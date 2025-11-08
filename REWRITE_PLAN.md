# Recipe Maker Rewrite Plan

## Executive Summary

Modernizing a Rails + React recipe organization app to a full TypeScript stack with Azure Cosmos DB and simplified hosting.

**Migration Goals:**
- ✅ Fully TypeScript (type safety, modern tooling)
- ✅ Cosmos DB instead of MySQL (serverless, scalable, JSON-native)
- ✅ Simplified Azure hosting vs AKS (60-70% cost reduction)
- ✅ Feature parity with real-time updates
- ✅ Improved developer experience

---

## Current Stack Analysis

### Existing Application (recipe-maker-rails)

**Technology:**
- Backend: Ruby on Rails 6.0.3
- Frontend: React 16 + Bootstrap 4 (Webpacker integration)
- Database: Azure MySQL (InnoDB)
- Hosting: Azure Kubernetes Service (AKS) - 2 replicas
- CI/CD: GitHub Actions → Azure Container Registry → AKS

**Features:**
1. **Recipe Management**
   - Create manually or scrape from URL (8 supported sites)
   - Rich editing: ingredients (grouped), directions, times, servings, tags, notes
   - Preview images with smart layout
   - Search with advanced query syntax (tag:dinner chicken)
   - Real-time collaborative editing via custom SSE

2. **Menu Planning**
   - Create named collections of recipes
   - Add/remove recipes from menus
   - Drag-and-drop support

3. **Recipe Scraping**
   - Site-specific parsers for:
     - Budget Bytes, Skinny Taste, Half Baked Harvest
     - Love and Lemons, Yummy Toddler Food
     - Sally's Baking Addiction, King Arthur Baking, Minimalist Baker
   - XPath-based extraction
   - Duplicate URL detection
   - Background job processing

**Database Schema (MySQL):**
```sql
recipes:
  - name, prep_time, cook_time, total_time, servings
  - ingredients (JSON), directions (JSON)
  - tags (Array), notes (Array)
  - preview_url, source, source_kind (url|manual)
  - last_viewed, created_at, updated_at

menus:
  - name
  - recipes (Array of IDs)
  - created_at, updated_at
```

**Key Components:**
- Custom LiveModel system (SSE pub/sub)
- Background jobs (CreateRecipeJob, FetchRecipeJob, ParseRecipeJob)
- Filterable/Sortable concerns for queries
- React components: RecipeViewer, RecipeEditor, MenuViewer, MenuEditor

---

## New Technology Stack

### Backend: TypeScript + Next.js 14+
- **Framework**: Next.js App Router (full-stack)
- **Runtime**: Node.js 20+
- **ORM**: Prisma with Cosmos DB connector
- **API**: Next.js API Routes (REST or tRPC)
- **Validation**: Zod for runtime type checking

### Database: Azure Cosmos DB
- **API**: MongoDB API (document-oriented)
- **Collections**: recipes, menus
- **Tier**: Serverless (pay-per-use)
- **Benefits**: Auto-scaling, JSON-native, global distribution

### Hosting: Azure Static Web Apps
- **Why**: Simplest deployment, free tier, auto-scaling, global CDN
- **Alternative**: Azure App Service (if more backend control needed)
- **Deployment**: GitHub Actions automatic integration

### Frontend: TypeScript React
- **Framework**: Next.js 14+ with App Router
- **UI Library**: shadcn/ui + Tailwind CSS (modern) OR React Bootstrap (familiar)
- **State Management**:
  - TanStack Query (React Query) for server state
  - Zustand for client state (if needed)
- **Real-time**: Socket.io OR Azure SignalR Service
- **Drag & Drop**: @dnd-kit/core (modern alternative)

### Development Tools
- **Package Manager**: pnpm (fast, efficient)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Type Checking**: TypeScript strict mode

---

## Data Model (TypeScript)

```typescript
// Core types
interface Recipe {
  id: string;
  name: string;
  prepTime?: number;        // minutes
  cookTime?: number;        // minutes
  totalTime?: number;       // minutes
  servings?: number;
  ingredients: IngredientGroup[];
  directions: Direction[];
  previewUrl?: string;
  source?: string;          // Original URL
  sourceKind: 'url' | 'manual';
  tags: string[];
  notes: string[];
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface IngredientGroup {
  name?: string;            // Optional group name (e.g., "For the sauce")
  items: string[];          // List of ingredients
}

interface Direction {
  step: number;
  text: string;
}

interface Menu {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Scraping types
interface RecipeScraperResult {
  name: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: IngredientGroup[];
  directions: Direction[];
  previewUrl?: string;
}

interface ScraperConfig {
  domain: string;
  name: string;
  parser: (html: string) => RecipeScraperResult;
}
```

---

## Incremental Migration Plan

### Phase 1: Foundation & Infrastructure (Week 1)
**Goal**: Set up new repository with modern tooling

**Tasks:**
1. ✅ Initialize Next.js 14+ project with TypeScript
   ```bash
   npx create-next-app@latest recipe-maker --typescript --tailwind --app --use-pnpm
   ```

2. Configure project structure:
   ```
   recipe-maker/
   ├── src/
   │   ├── app/              # Next.js App Router pages
   │   ├── components/       # React components
   │   │   ├── recipes/
   │   │   ├── menus/
   │   │   └── shared/
   │   ├── lib/              # Utilities, DB, services
   │   │   ├── db/          # Prisma client
   │   │   ├── scrapers/    # Recipe site parsers
   │   │   └── services/    # Business logic
   │   ├── types/            # TypeScript types
   │   └── styles/           # Global styles
   ├── prisma/
   │   └── schema.prisma     # Database schema
   ├── public/               # Static assets
   └── tests/                # Test files
   ```

3. Set up Azure Cosmos DB:
   - Create Cosmos DB account (MongoDB API)
   - Configure connection string
   - Install Prisma: `pnpm add -D prisma && pnpm add @prisma/client`

4. Initialize Prisma schema for Cosmos DB:
   ```prisma
   datasource db {
     provider = "mongodb"
     url      = env("COSMOS_DB_CONNECTION_STRING")
   }

   generator client {
     provider = "prisma-client-js"
   }

   model Recipe {
     id          String   @id @default(auto()) @map("_id") @db.ObjectId
     name        String
     prepTime    Int?
     cookTime    Int?
     totalTime   Int?
     servings    Int?
     ingredients Json
     directions  Json
     previewUrl  String?
     source      String?
     sourceKind  String   // 'url' | 'manual'
     tags        String[]
     notes       String[]
     lastViewed  DateTime?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt

     @@index([tags])
     @@index([name])
     @@index([lastViewed])
   }

   model Menu {
     id         String   @id @default(auto()) @map("_id") @db.ObjectId
     name       String
     recipeIds  String[] @db.ObjectId
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt
   }
   ```

5. Configure deployment:
   - Set up Azure Static Web Apps resource
   - Configure GitHub Actions workflow
   - Set environment variables

**Deliverables**:
- ✅ Empty Next.js app deployed to Azure
- ✅ Cosmos DB configured and connected
- ✅ CI/CD pipeline functional

---

### Phase 2: Core Data Layer (Week 2)
**Goal**: Migrate data model and basic CRUD operations

**Tasks:**
1. Define comprehensive TypeScript types (`src/types/recipe.ts`, `src/types/menu.ts`)

2. Set up Prisma client wrapper:
   ```typescript
   // src/lib/db/client.ts
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined;
   };

   export const prisma = globalForPrisma.prisma ?? new PrismaClient();

   if (process.env.NODE_ENV !== 'production') {
     globalForPrisma.prisma = prisma;
   }
   ```

3. Implement repository layer:
   - `src/lib/services/recipe-service.ts`: CRUD, filtering, sorting
   - `src/lib/services/menu-service.ts`: CRUD, add/remove recipes
   - Port filtering logic (name, tags, URL)
   - Port sorting logic (name, date, last viewed)

4. Create seed data for development:
   ```typescript
   // prisma/seed.ts
   import { prisma } from '../src/lib/db/client';

   async function main() {
     // Create sample recipes and menus
   }
   ```

5. Write unit tests for services (Vitest)

**Deliverables**:
- ✅ Type-safe data layer
- ✅ Repository pattern implemented
- ✅ Unit tests passing
- ✅ Seed data available

---

### Phase 3: REST API (Week 3)
**Goal**: Replicate all Rails API endpoints

**API Endpoints to Create:**

```typescript
// Recipe endpoints (src/app/api/recipes/...)
GET    /api/recipes              // List with filters
GET    /api/recipes/:id          // Single recipe
POST   /api/recipes              // Create manual recipe
PUT    /api/recipes/:id          // Update
DELETE /api/recipes/:id          // Delete
POST   /api/recipes/from-url     // Create from URL (stub)

// Menu endpoints (src/app/api/menus/...)
GET    /api/menus                // List all
GET    /api/menus/:id            // Single menu
POST   /api/menus                // Create
PUT    /api/menus/:id            // Update
DELETE /api/menus/:id            // Delete
POST   /api/menus/:id/recipes    // Add recipe
DELETE /api/menus/:id/recipes/:recipeId  // Remove recipe
```

**Implementation Steps:**
1. Create Next.js API routes for all endpoints
2. Add request validation with Zod schemas
3. Implement error handling middleware
4. Port query parser for search (tag:dinner chicken)
5. Add pagination support
6. Create API documentation (OpenAPI/Swagger)

**Example:**
```typescript
// src/app/api/recipes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { recipeService } from '@/lib/services/recipe-service';
import { z } from 'zod';

const querySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const recipes = await recipeService.list(query);
    return NextResponse.json(recipes);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
```

**Deliverables**:
- ✅ All API endpoints functional
- ✅ Request validation in place
- ✅ Postman collection for testing
- ✅ API documentation

---

### Phase 4: Recipe Scraping Service (Week 4)
**Goal**: Port recipe URL scraping functionality

**Tasks:**
1. Choose scraping library:
   - **Cheerio** (lightweight, fast, server-side jQuery)
   - **Playwright** (full browser, handles JS-rendered content)
   - Recommendation: Start with Cheerio, add Playwright if needed

2. Port 8 site-specific parsers to TypeScript:
   ```typescript
   // src/lib/scrapers/budget-bytes.ts
   import * as cheerio from 'cheerio';
   import { RecipeScraperResult } from '@/types/scraper';

   export async function parseBudgetBytes(html: string): Promise<RecipeScraperResult> {
     const $ = cheerio.load(html);

     // Port XPath logic to Cheerio selectors
     const name = $('.wprm-recipe-name').text().trim();
     const prepTime = parseInt($('.wprm-recipe-prep_time-minutes').text());
     // ... etc

     return {
       name,
       prepTime,
       // ...
     };
   }
   ```

3. Create scraper registry:
   ```typescript
   // src/lib/scrapers/index.ts
   import { parseBudgetBytes } from './budget-bytes';
   import { parseSkinnyTaste } from './skinny-taste';
   // ... other parsers

   export const SCRAPERS: ScraperConfig[] = [
     { domain: 'budgetbytes.com', name: 'Budget Bytes', parser: parseBudgetBytes },
     { domain: 'skinnytaste.com', name: 'Skinny Taste', parser: parseSkinnyTaste },
     // ... 6 more
   ];

   export function getScraperForUrl(url: string): ScraperConfig | null {
     const domain = new URL(url).hostname.replace('www.', '');
     return SCRAPERS.find(s => domain.includes(s.domain)) || null;
   }
   ```

4. Implement fetch → parse → save pipeline:
   ```typescript
   // src/lib/services/recipe-scraper-service.ts
   export async function createRecipeFromUrl(url: string) {
     // 1. Check for duplicate
     const existing = await recipeService.findByUrl(url);
     if (existing) throw new Error('Recipe already exists');

     // 2. Fetch HTML
     const html = await fetchRecipeHtml(url);

     // 3. Find and run parser
     const scraper = getScraperForUrl(url);
     if (!scraper) throw new Error('Unsupported recipe site');

     const parsed = await scraper.parser(html);

     // 4. Save to database
     return await recipeService.create({
       ...parsed,
       source: url,
       sourceKind: 'url',
     });
   }
   ```

5. Add background job processing:
   - **Option A**: Bull (Redis-based queue) - requires Redis
   - **Option B**: Azure Service Bus - fully managed
   - **Option C**: Simple async processing (good enough for low traffic)

6. Add error handling and retry logic

7. Write tests for each scraper with real HTML fixtures

**Deliverables**:
- ✅ All 8 scrapers working
- ✅ `/api/recipes/from-url` endpoint functional
- ✅ Duplicate detection
- ✅ Error handling for failed scrapes

---

### Phase 5: Frontend - Basic UI (Week 5)
**Goal**: Recipe and menu viewing

**Tasks:**
1. Set up UI framework:
   ```bash
   # Option A: shadcn/ui (modern, customizable)
   pnpm dlx shadcn-ui@latest init

   # Option B: React Bootstrap (familiar from old app)
   pnpm add react-bootstrap bootstrap
   ```

2. Create layout and navigation:
   ```typescript
   // src/app/layout.tsx
   // Header with navigation: Recipes, Menus, Create Recipe
   ```

3. Recipe components:
   - **RecipeList** (`src/components/recipes/RecipeList.tsx`)
     - Grid/list toggle
     - Recipe preview cards with image
     - Search bar and tag filters
     - Infinite scroll or pagination

   - **RecipeDetail** (`src/components/recipes/RecipeDetail.tsx`)
     - View-only mode
     - Display all fields: name, times, servings, ingredients, directions, tags, notes
     - Port smart image placement logic (left vs right pane)
     - "Edit" button to switch to editor
     - "Add to Menu" button with modal

   - **RecipeIngredientsList** (`src/components/recipes/RecipeIngredientsList.tsx`)
     - Support grouped ingredients
     - Clean formatting

   - **RecipeDirectionsList** (`src/components/recipes/RecipeDirectionsList.tsx`)
     - Numbered steps

   - **RecipeTag** (`src/components/recipes/RecipeTag.tsx`)
     - Clickable badges for filtering

4. Menu components:
   - **MenuList** (`src/components/menus/MenuList.tsx`)
   - **MenuDetail** (`src/components/menus/MenuDetail.tsx`)
     - Show list of recipes in menu
     - Link to each recipe

5. Create Next.js pages:
   ```typescript
   // src/app/recipes/page.tsx - Recipe list
   // src/app/recipes/[id]/page.tsx - Recipe detail
   // src/app/menus/page.tsx - Menu list
   // src/app/menus/[id]/page.tsx - Menu detail
   ```

6. Integrate TanStack Query for data fetching:
   ```typescript
   // src/lib/hooks/useRecipes.ts
   import { useQuery } from '@tanstack/react-query';

   export function useRecipes(filters: RecipeFilters) {
     return useQuery({
       queryKey: ['recipes', filters],
       queryFn: () => fetchRecipes(filters),
     });
   }
   ```

7. Port search and filtering UI

**Deliverables**:
- ✅ Full read-only UI
- ✅ Recipe browsing and search
- ✅ Menu viewing
- ✅ Responsive design

---

### Phase 6: Frontend - Editing & Creation (Week 6)
**Goal**: Full CRUD from UI

**Tasks:**
1. Recipe Editor component (`src/components/recipes/RecipeEditor.tsx`):
   - Form with all fields
   - Editable ingredient groups (add/remove groups, add/remove items)
   - Editable directions (add/remove/reorder)
   - Tag input with autocomplete
   - Notes management
   - Image URL input
   - Save button (POST or PUT)
   - Delete button with confirmation modal

2. Create from URL component:
   - URL input form (`src/components/recipes/CreateFromUrl.tsx`)
   - Loading spinner during scraping
   - Error display if scraping fails
   - Success redirect to new recipe

3. Menu Editor component (`src/components/menus/MenuEditor.tsx`):
   - Name input
   - "Add Recipe" button with modal picker
   - Recipe list with remove buttons
   - Optional: Drag-and-drop reordering with @dnd-kit
   - Save/Delete buttons

4. Create editor pages:
   ```typescript
   // src/app/recipes/new/page.tsx - Create manual recipe
   // src/app/recipes/new/from-url/page.tsx - Create from URL
   // src/app/recipes/[id]/edit/page.tsx - Edit recipe
   // src/app/menus/new/page.tsx - Create menu
   // src/app/menus/[id]/edit/page.tsx - Edit menu
   ```

5. Add form validation:
   - Zod schemas for client-side validation
   - React Hook Form for form state management
   - Error messages

6. Implement optimistic updates with TanStack Query:
   ```typescript
   const mutation = useMutation({
     mutationFn: updateRecipe,
     onMutate: async (newRecipe) => {
       // Optimistically update UI
       await queryClient.cancelQueries({ queryKey: ['recipes', id] });
       const previous = queryClient.getQueryData(['recipes', id]);
       queryClient.setQueryData(['recipes', id], newRecipe);
       return { previous };
     },
     onError: (err, newRecipe, context) => {
       // Rollback on error
       queryClient.setQueryData(['recipes', id], context.previous);
     },
   });
   ```

7. Add toast notifications for success/error

**Deliverables**:
- ✅ Full CRUD UI
- ✅ Recipe creation (manual + URL)
- ✅ Recipe editing and deletion
- ✅ Menu management
- ✅ Form validation and error handling

---

### Phase 7: Real-Time Updates (Week 7)
**Goal**: Collaborative editing with live updates

**Tasks:**
1. Choose real-time solution:
   - **Option A**: Socket.io (self-hosted, free, full control)
     - Pros: Well-documented, easy to use, works with Next.js
     - Cons: Need to manage connections, scaling

   - **Option B**: Azure SignalR Service (managed, auto-scaling)
     - Pros: Fully managed, scales automatically, Azure integration
     - Cons: Additional cost, vendor lock-in

   Recommendation: **Socket.io** for simplicity and cost

2. Set up Socket.io server:
   ```typescript
   // src/lib/socket/server.ts
   import { Server } from 'socket.io';

   export function initSocketServer(httpServer) {
     const io = new Server(httpServer, {
       cors: { origin: process.env.NEXT_PUBLIC_APP_URL },
     });

     io.on('connection', (socket) => {
       console.log('Client connected:', socket.id);

       socket.on('subscribe:recipe', (recipeId) => {
         socket.join(`recipe:${recipeId}`);
       });

       socket.on('disconnect', () => {
         console.log('Client disconnected:', socket.id);
       });
     });

     return io;
   }
   ```

3. Broadcast recipe updates:
   ```typescript
   // In recipe-service.ts
   import { getIO } from '@/lib/socket/server';

   export async function updateRecipe(id: string, data: UpdateRecipeDto) {
     const recipe = await prisma.recipe.update({
       where: { id },
       data,
     });

     // Broadcast update to all connected clients
     const io = getIO();
     io.to(`recipe:${id}`).emit('recipe:updated', recipe);

     return recipe;
   }
   ```

4. Create client-side hook:
   ```typescript
   // src/lib/hooks/useRealtimeRecipe.ts
   import { useEffect } from 'react';
   import { useQueryClient } from '@tanstack/react-query';
   import { socket } from '@/lib/socket/client';

   export function useRealtimeRecipe(recipeId: string) {
     const queryClient = useQueryClient();

     useEffect(() => {
       socket.emit('subscribe:recipe', recipeId);

       socket.on('recipe:updated', (updatedRecipe) => {
         // Update local cache
         queryClient.setQueryData(['recipes', recipeId], updatedRecipe);
       });

       return () => {
         socket.off('recipe:updated');
       };
     }, [recipeId, queryClient]);
   }
   ```

5. Add connection status indicator:
   - Green dot when connected
   - Red/yellow when disconnected
   - Reconnection logic

6. Implement heartbeat/keep-alive

7. Handle edge cases:
   - Conflict resolution (last write wins)
   - Network disconnections
   - Stale data recovery

**Deliverables**:
- ✅ Real-time updates working
- ✅ Multiple users can edit simultaneously
- ✅ Connection status visible
- ✅ Graceful reconnection

---

### Phase 8: Data Migration (Week 8)
**Goal**: Move production data from MySQL to Cosmos DB

**Tasks:**
1. Create MySQL export script:
   ```typescript
   // scripts/export-mysql.ts
   import mysql from 'mysql2/promise';
   import fs from 'fs/promises';

   async function exportData() {
     const connection = await mysql.createConnection({
       host: process.env.MYSQL_HOST,
       user: process.env.MYSQL_USER,
       password: process.env.MYSQL_PASSWORD,
       database: 'recipe_maker',
     });

     // Export recipes
     const [recipes] = await connection.query('SELECT * FROM recipes');
     await fs.writeFile('data/recipes.json', JSON.stringify(recipes, null, 2));

     // Export menus
     const [menus] = await connection.query('SELECT * FROM menus');
     await fs.writeFile('data/menus.json', JSON.stringify(menus, null, 2));

     await connection.end();
   }
   ```

2. Create data transformation script:
   ```typescript
   // scripts/transform-data.ts
   // Handle MySQL-specific formats:
   // - YAML serialized arrays → proper JSON arrays
   // - Date formats
   // - ID conversion (int → ObjectId)
   ```

3. Create Cosmos DB import script:
   ```typescript
   // scripts/import-cosmos.ts
   import { prisma } from '../src/lib/db/client';
   import recipes from '../data/recipes-transformed.json';
   import menus from '../data/menus-transformed.json';

   async function importData() {
     console.log('Importing recipes...');
     for (const recipe of recipes) {
       await prisma.recipe.create({ data: recipe });
     }

     console.log('Importing menus...');
     for (const menu of menus) {
       await prisma.menu.create({ data: menu });
     }

     console.log('Import complete!');
   }
   ```

4. Validate data integrity:
   - Count records (MySQL vs Cosmos)
   - Spot-check random recipes
   - Verify relationships (menu → recipes)
   - Test queries

5. Performance testing:
   - Load test with production data volume
   - Optimize Cosmos DB indexes
   - Measure query performance

6. Create rollback plan

7. Plan parallel deployment:
   - Keep old app running
   - Deploy new app to staging
   - Test with subset of users
   - Monitor errors and performance

**Deliverables**:
- ✅ All production data migrated
- ✅ Data integrity validated
- ✅ Performance acceptable
- ✅ Rollback plan documented

---

### Phase 9: Polish & Testing (Week 9)
**Goal**: Production readiness

**Tasks:**
1. Unit Testing (Vitest):
   - Service layer tests
   - Utility function tests
   - Component tests (React Testing Library)
   - Target: 70%+ coverage

2. Integration Testing:
   - API endpoint tests
   - Database operations
   - Scraper tests with fixtures

3. E2E Testing (Playwright):
   - Critical user flows:
     - Create recipe manually
     - Create recipe from URL
     - Edit recipe
     - Delete recipe
     - Create menu and add recipes
     - Search and filter recipes

4. Performance optimization:
   - Implement caching (Redis or in-memory LRU cache)
   - Optimize Cosmos DB queries
   - Add indexes for common queries
   - Image optimization:
     - Use next/image for automatic optimization
     - Consider Azure CDN for static assets
   - Bundle size analysis:
     - `pnpm run build && pnpm dlx @next/bundle-analyzer`
     - Code splitting for heavy components
   - Lazy load recipe editor

5. SEO & Metadata:
   - Add proper meta tags for each page
   - Open Graph tags for social sharing
   - Generate sitemap

6. Error handling & monitoring:
   - Structured logging (Winston or Pino)
   - Error tracking:
     - **Option A**: Sentry (popular, free tier)
     - **Option B**: Azure Application Insights (Azure-native)
   - Health check endpoint (`/api/health`)
   - Alerting rules:
     - High error rate
     - Slow query performance
     - Failed scrapes

7. Accessibility (a11y):
   - Keyboard navigation
   - ARIA labels
   - Color contrast
   - Screen reader testing

8. Security audit:
   - Input validation on all endpoints
   - Rate limiting (to prevent scraping abuse)
   - CORS configuration
   - Environment variable security
   - Dependency vulnerability scan

**Deliverables**:
- ✅ Comprehensive test suite
- ✅ Performance optimized
- ✅ Monitoring and logging configured
- ✅ Accessibility compliant
- ✅ Security hardened

---

### Phase 10: Deployment & Cutover (Week 10)
**Goal**: Go live with new app

**Tasks:**
1. Finalize GitHub Actions workflow:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Azure

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'pnpm'

         - name: Install dependencies
           run: pnpm install

         - name: Run tests
           run: pnpm test

         - name: Build
           run: pnpm build
           env:
             COSMOS_DB_CONNECTION_STRING: ${{ secrets.COSMOS_DB_CONNECTION_STRING }}

         - name: Deploy to Azure Static Web Apps
           uses: Azure/static-web-apps-deploy@v1
           with:
             azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
             repo_token: ${{ secrets.GITHUB_TOKEN }}
             action: 'upload'
             app_location: '/'
             api_location: 'api'
             output_location: '.next'
   ```

2. Set up environments:
   - **Staging**: Test deployment before production
   - **Production**: Live app
   - Environment-specific configs

3. Configure Azure resources:
   - Static Web App (or App Service)
   - Cosmos DB with proper security rules
   - Application Insights for monitoring
   - Azure CDN (optional, for images)

4. DNS and custom domain:
   - Point domain to Azure Static Web Apps
   - Configure SSL certificate (automatic with Azure)

5. Create deployment documentation:
   - Step-by-step deployment guide
   - Environment variable list
   - Troubleshooting common issues
   - Rollback procedures

6. Write development documentation:
   ```markdown
   # README.md
   - Project overview
   - Tech stack
   - Getting started (local development)
   - Running tests
   - Deployment
   - Architecture overview
   ```

7. Create Architecture Decision Records (ADRs):
   - Why Next.js over separate frontend/backend
   - Why Cosmos DB MongoDB API
   - Why Azure Static Web Apps
   - Why Socket.io for real-time

8. Go-live checklist:
   - [ ] All tests passing
   - [ ] Production data migrated
   - [ ] Monitoring configured
   - [ ] Backups enabled
   - [ ] DNS updated
   - [ ] SSL working
   - [ ] Performance acceptable
   - [ ] Error tracking active

9. Execute cutover:
   - Final data sync from MySQL
   - Update DNS to point to new app
   - Monitor for issues (first 24 hours critical)
   - Keep old app as fallback

10. Post-launch:
    - Monitor error rates and performance
    - Gather user feedback
    - Fix any issues quickly
    - Keep old app running for 1-2 weeks
    - Decommission AKS cluster and MySQL after confidence

**Deliverables**:
- ✅ Production deployment successful
- ✅ Documentation complete
- ✅ Old app decommissioned
- ✅ Cost savings realized

---

## Cost Analysis

### Current Infrastructure (Monthly)
| Service | Cost |
|---------|------|
| AKS Cluster (2 nodes) | $75-150 |
| Azure MySQL Database | $50-100 |
| Azure Container Registry | $5 |
| **Total** | **$130-255** |

### New Infrastructure (Monthly)
| Service | Tier | Cost |
|---------|------|------|
| Azure Static Web Apps | Free or Standard | $0-9 |
| Cosmos DB (Serverless) | Pay-per-use | $10-50 |
| Azure Container Apps (optional) | Consumption | $0-30 |
| **Total** | | **$10-90** |

**Estimated Savings: 60-70% ($40-165/month)**

---

## Risk Mitigation

### Technical Risks

**Risk**: Cosmos DB performance worse than MySQL
- **Mitigation**: Performance testing in Phase 8, optimize indexes, use caching
- **Fallback**: Can switch to Azure SQL with Prisma (minimal code changes)

**Risk**: Real-time updates don't scale
- **Mitigation**: Load testing, can switch to Azure SignalR Service if needed
- **Fallback**: Polling as temporary solution

**Risk**: Recipe scrapers break due to site changes
- **Mitigation**: Comprehensive tests, error handling, user-reported issues
- **Fallback**: Manual recipe creation always available

**Risk**: Migration data loss
- **Mitigation**: Thorough validation, checksums, dry-runs, backups
- **Fallback**: Keep MySQL running during parallel deployment

### Business Risks

**Risk**: Extended downtime during migration
- **Mitigation**: Parallel deployment, can rollback to old app
- **Fallback**: Blue-green deployment strategy

**Risk**: User adoption issues
- **Mitigation**: Keep UI similar, provide migration guide
- **Fallback**: Collect feedback, iterate quickly

---

## Success Metrics

### Technical Metrics
- [ ] 100% feature parity with old app
- [ ] <2s page load time (P95)
- [ ] <500ms API response time (P95)
- [ ] 99.9% uptime
- [ ] 70%+ test coverage
- [ ] Zero data loss during migration

### Business Metrics
- [ ] 60-70% cost reduction
- [ ] Simplified deployment (1 command vs complex K8s)
- [ ] Faster development velocity (TypeScript, modern tools)
- [ ] Better developer experience

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| 1. Foundation | 1 week | Next.js + Cosmos DB setup |
| 2. Data Layer | 1 week | CRUD operations working |
| 3. REST API | 1 week | All endpoints functional |
| 4. Scrapers | 1 week | URL-to-recipe working |
| 5. Basic UI | 1 week | Read-only interface |
| 6. Editing UI | 1 week | Full CRUD from frontend |
| 7. Real-time | 1 week | Live updates working |
| 8. Migration | 1 week | Data migrated & validated |
| 9. Polish | 1 week | Production-ready quality |
| 10. Deployment | 1 week | Live in production |

**Total: 10 weeks (2.5 months)**

---

## Code Reusability Assessment

### CAN Reuse (with TypeScript conversion)

✅ **React Components** (50-70% reusable structure):
- RecipeViewer, RecipeEditor, RecipeDetails
- MenuViewer, MenuEditor, MenuDetails
- RecipeIngredientsList, RecipeDirectionsList
- RecipeTag, TextInput, AutoHeightTextArea
- Component logic and layout can be ported

✅ **Recipe Site Parsers** (70-90% reusable logic):
- XPath → Cheerio selector conversion is straightforward
- Business logic (grouping, cleaning) can be ported directly
- 8 site-specific parsers: Budget Bytes, Skinny Taste, etc.

✅ **Business Logic** (80-90% reusable):
- Query parser for search (tag:dinner chicken)
- Filtering logic (name, tags, URL)
- Sorting logic (name, date, last viewed)
- Duplicate detection
- Ingredient/direction grouping

✅ **Database Schema** (100% portable):
- Same fields, just different database engine
- JSON structure for ingredients/directions stays same

### CANNOT Directly Reuse

❌ **Rails Backend**:
- Controllers → Next.js API routes (rewrite)
- ActiveRecord models → Prisma (different ORM)
- Background jobs → New queue system
- LiveModel SSE → Socket.io (different approach)

❌ **Infrastructure**:
- Docker/Kubernetes configs → Azure Static Web Apps
- GitHub Actions workflow → New deployment process
- MySQL migrations → Cosmos DB schema

### Migration Strategy

1. **Phase 1-4**: Write new backend (TypeScript + Prisma)
2. **Phase 5-6**: Port React components with updates
3. **Phase 4**: Port scraper logic with library changes
4. **Phase 7**: Replace LiveModel with Socket.io
5. **Phase 8**: One-time data migration

---

## Next Steps

### Immediate Actions

1. **Initialize Repository** (Phase 1)
   - Create Next.js project
   - Set up Prisma with Cosmos DB
   - Configure development environment

2. **Azure Setup**
   - Create Cosmos DB account (MongoDB API)
   - Set up Static Web Apps resource
   - Configure GitHub repository secrets

3. **First Sprint Goals**
   - Complete Phase 1 & 2 (Foundation + Data Layer)
   - Get basic CRUD working
   - Deploy to staging environment

### Questions to Resolve

- [ ] UI Framework: shadcn/ui (modern) or React Bootstrap (familiar)?
- [ ] Real-time: Socket.io (simple) or Azure SignalR (managed)?
- [ ] Background Jobs: Bull/Redis or Azure Service Bus?
- [ ] Hosting: Static Web Apps (recommended) or App Service?

### Resources Needed

- Azure subscription with permissions to create resources
- GitHub repository with Actions enabled
- Local development environment:
  - Node.js 20+
  - pnpm package manager
  - VS Code with TypeScript extensions

---

## References

### Documentation
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Prisma with Cosmos DB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Socket.io](https://socket.io/docs/v4/)

### Tools
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Playwright Testing](https://playwright.dev/)
- [Vitest](https://vitest.dev/)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: Ready for Phase 1 implementation
