# Recipe Maker

A modern recipe organization and meal planning application built with TypeScript, Next.js, and Azure Cosmos DB.

## Features

- 📖 **Recipe Management**: Create, edit, and organize recipes with rich details
- 🌐 **URL Scraping**: Automatically import recipes from supported websites
- 🏷️ **Tag-Based Organization**: Categorize and filter recipes with tags
- 📋 **Menu Planning**: Create meal plans and collections of recipes
- 🔍 **Advanced Search**: Find recipes with powerful query syntax
- ⚡ **Real-time Updates**: Collaborative editing with live updates (planned)
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query) - planned
- **UI Components**: shadcn/ui - planned

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **ORM**: Prisma 6
- **Validation**: Zod 4

### Database
- **Primary**: Azure Cosmos DB (MongoDB API)
- **Development**: Local MongoDB or Cosmos DB Emulator

### Hosting
- **Deployment**: Azure Static Web Apps (planned)
- **CI/CD**: GitHub Actions (planned)

## Project Structure

```
recipe-maker/
├── app/                    # Next.js App Router pages and layouts
├── components/             # React components
│   ├── recipes/           # Recipe-related components
│   ├── menus/             # Menu-related components
│   └── shared/            # Shared/common components
├── lib/                   # Core libraries and utilities
│   ├── db/               # Database client and utilities
│   ├── services/         # Business logic services
│   ├── scrapers/         # Recipe site parsers
│   └── utils/            # Helper functions
├── types/                 # TypeScript type definitions
├── prisma/               # Prisma schema and migrations
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm
- MongoDB (local) OR Azure Cosmos DB account

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Configure your database connection in `.env`:
   ```env
   # For local development with MongoDB
   COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev"

   # For Azure Cosmos DB (production)
   COSMOS_DB_CONNECTION_STRING="your-cosmos-db-connection-string"
   ```

   > **Note:** Prisma CLI requires `.env` (not `.env.local`). See [ENV_SETUP.md](ENV_SETUP.md) for details.

### Authentication

Recipe Maker now requires Google OAuth for any write operations (creating, editing, or deleting recipes and menus). To enable authentication locally:

1. Create an OAuth 2.0 Client ID in the [Google Cloud Console](https://console.cloud.google.com/).
2. Set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google`.
3. Copy the Client ID and Client Secret into your `.env` file as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Generate a random string (for example using `openssl rand -base64 32`) and set it as `NEXTAUTH_SECRET`.

With these values in place, sign in from the navigation bar to gain access to recipe and menu write features. Read-only actions (viewing, listing, searching, and importing from a URL) continue to work without authentication.

4. Generate Prisma client:
   ```bash
   pnpm db:generate
   ```

5. (Optional) Push schema to database:
   ```bash
   pnpm db:push
   ```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will automatically reload when you make changes.

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Prisma Studio (database GUI)

## Database Setup

### Option 1: Local Development (MongoDB)

Install MongoDB locally or use Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Update `.env.local`:
```env
COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev"
```

### Option 2: Azure Cosmos DB

1. Create a Cosmos DB account with MongoDB API in Azure Portal
2. Get the connection string from the portal
3. Update `.env.local` with the connection string:
   ```env
   COSMOS_DB_CONNECTION_STRING="mongodb://your-account.mongo.cosmos.azure.com:10255/?ssl=true..."
   ```

### Option 3: Cosmos DB Emulator (Windows)

1. Install [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)
2. Use the emulator connection string in `.env.local`

## Supported Recipe Sites (Planned)

The app will be able to automatically scrape recipes from:

- Budget Bytes
- Skinny Taste
- Half Baked Harvest
- Love and Lemons
- Yummy Toddler Food
- Sally's Baking Addiction
- King Arthur Baking
- Minimalist Baker

## API Endpoints (Planned)

### Recipes

- `GET /api/recipes` - List recipes with filtering and pagination
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create manual recipe
- `POST /api/recipes/from-url` - Create recipe from URL
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Menus

- `GET /api/menus` - List all menus
- `GET /api/menus/:id` - Get single menu
- `POST /api/menus` - Create menu
- `PUT /api/menus/:id` - Update menu
- `DELETE /api/menus/:id` - Delete menu
- `POST /api/menus/:id/recipes` - Add recipe to menu
- `DELETE /api/menus/:id/recipes/:recipeId` - Remove recipe from menu

## Development Roadmap

See [../REWRITE_PLAN.md](../REWRITE_PLAN.md) for the complete migration plan.

### Phase 1: Foundation ✅ (Current)
- [x] Next.js project setup
- [x] Prisma + Cosmos DB configuration
- [x] TypeScript type definitions
- [x] Project structure

### Phase 2: Data Layer (Next)
- [ ] Repository services
- [ ] Filtering and sorting logic
- [ ] Unit tests

### Phase 3: REST API
- [ ] Recipe endpoints
- [ ] Menu endpoints
- [ ] Query parser
- [ ] Validation with Zod

### Phase 4: Recipe Scraping
- [ ] Scraper infrastructure
- [ ] Port 8 site-specific parsers
- [ ] Background job processing

### Phase 5-6: Frontend
- [ ] UI components
- [ ] Recipe browsing and editing
- [ ] Menu management
- [ ] Search and filtering

### Phase 7: Real-time Updates
- [ ] Socket.io integration
- [ ] Live collaborative editing

### Phase 8-10: Production
- [ ] Data migration from old app
- [ ] Testing and optimization
- [ ] Deployment to Azure

## Testing (Planned)

```bash
pnpm test          # Unit tests
pnpm test:e2e      # End-to-end tests
```

## Migration Notes

This is a complete rewrite of the original `recipe-maker-rails` application. Key improvements:

- **Full TypeScript**: Type safety across the entire stack
- **Modern Stack**: Next.js 16 with App Router instead of Rails + Webpacker
- **Serverless Database**: Cosmos DB instead of MySQL
- **Simplified Hosting**: Azure Static Web Apps instead of Kubernetes
- **60-70% Cost Reduction**: More efficient infrastructure
- **Latest React**: React 19 with Server Components

For detailed migration documentation, see [../REWRITE_PLAN.md](../REWRITE_PLAN.md).

## Contributing

This is a personal project being migrated from a Rails/React monolith. Contributions welcome after initial rewrite is complete.

## License

See [../LICENSE](../LICENSE) file.
