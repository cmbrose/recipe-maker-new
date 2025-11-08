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
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (planned)

### Backend
- **Runtime**: Node.js 20+
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Validation**: Zod

### Database
- **Primary**: Azure Cosmos DB (MongoDB API)
- **Development**: Local MongoDB or Cosmos DB Emulator

### Hosting
- **Deployment**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

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

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd recipe-maker
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your database connection in `.env.local`:
   ```env
   COSMOS_DB_CONNECTION_STRING="your-connection-string"
   ```

5. Generate Prisma client:
   ```bash
   pnpm prisma generate
   ```

6. (Optional) Seed the database with sample data:
   ```bash
   pnpm prisma db seed
   ```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## Database Setup

### Local Development (MongoDB)

Install MongoDB locally or use Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Azure Cosmos DB

1. Create a Cosmos DB account with MongoDB API
2. Get the connection string from Azure Portal
3. Update `.env.local` with the connection string

## Supported Recipe Sites

The app can automatically scrape recipes from:

- Budget Bytes
- Skinny Taste
- Half Baked Harvest
- Love and Lemons
- Yummy Toddler Food
- Sally's Baking Addiction
- King Arthur Baking
- Minimalist Baker

## API Endpoints

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

See [REWRITE_PLAN.md](../REWRITE_PLAN.md) for the complete migration plan.

### Phase 1: Foundation ✅ (Current)
- [x] Next.js project setup
- [x] Prisma + Cosmos DB configuration
- [x] TypeScript type definitions
- [x] Project structure

### Phase 2: Data Layer (In Progress)
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

## Testing

Run tests:

```bash
pnpm test          # Unit tests
pnpm test:e2e      # End-to-end tests (planned)
```

## Contributing

This is a personal project being migrated from a Rails/React monolith. Contributions are welcome!

## License

See [LICENSE](../LICENSE) file.

## Migration Notes

This is a complete rewrite of the original `recipe-maker-rails` application. Key improvements:

- **Full TypeScript**: Type safety across the entire stack
- **Modern Stack**: Next.js 14+ with App Router instead of Rails + Webpacker
- **Serverless Database**: Cosmos DB instead of MySQL
- **Simplified Hosting**: Azure Static Web Apps instead of Kubernetes
- **60-70% Cost Reduction**: More efficient infrastructure

For detailed migration documentation, see [REWRITE_PLAN.md](../REWRITE_PLAN.md).
