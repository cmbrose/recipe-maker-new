# Environment Variables Setup

## Understanding .env Files in Next.js + Prisma

This project uses two environment files:

### `.env` (Required for Prisma CLI)
- Used by Prisma CLI commands (`db:push`, `db:seed`, `db:generate`)
- Loaded automatically by Prisma
- **Gitignored** - never commit this file

### `.env.local` (Optional, for Next.js runtime)
- Used by Next.js at runtime (when running `pnpm dev` or `pnpm start`)
- Next.js automatically loads this in development
- **Gitignored** - never commit this file

### `.env.example` (Template)
- Safe to commit - contains no secrets
- Shows what variables are needed
- Copy this to create your `.env` file

## Quick Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your connection string:**
   ```env
   # For local MongoDB
   COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev"

   # For Azure Cosmos DB
   COSMOS_DB_CONNECTION_STRING="mongodb://your-account.mongo.cosmos.azure.com:10255/?ssl=true..."
   ```

3. **Run Prisma commands:**
   ```bash
   pnpm db:generate  # Generate Prisma Client
   pnpm db:push      # Push schema to database
   pnpm db:seed      # Seed sample data
   ```

## Database Options

### Option 1: Local MongoDB (Easiest for Development)

Start MongoDB with Docker:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Use this connection string in `.env`:
```env
COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev"
```

### Option 2: Azure Cosmos DB

1. Create a Cosmos DB account with **MongoDB API** in Azure Portal
2. Navigate to "Connection String" in the portal
3. Copy the **Primary Connection String**
4. Add it to your `.env`:
   ```env
   COSMOS_DB_CONNECTION_STRING="mongodb://your-cosmosdb-account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@your-cosmosdb-account@"
   ```

### Option 3: Cosmos DB Emulator (Windows only)

1. Install [Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)
2. Start the emulator
3. Use the emulator connection string in `.env`

## Troubleshooting

### Error: "Environment variable not found: COSMOS_DB_CONNECTION_STRING"

**Cause:** The `.env` file doesn't exist or isn't in the right location.

**Fix:**
```bash
# Create .env from example
cp .env.example .env

# Verify it exists
ls -la .env

# Try the command again
pnpm db:generate
```

### Error: "Can't reach database server"

**Cause:** MongoDB/Cosmos DB isn't running or connection string is wrong.

**Fix for local MongoDB:**
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# Start if not running
docker start mongodb

# Or create new container
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Error: "Invalid connection string format"

**Cause:** Connection string is malformed.

**Fix:** Ensure the connection string starts with `mongodb://` and has proper format:
```env
# Good ✓
COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev"

# Bad ✗ (missing quotes)
COSMOS_DB_CONNECTION_STRING=mongodb://localhost:27017/recipe-maker-dev

# Bad ✗ (wrong protocol)
COSMOS_DB_CONNECTION_STRING="postgresql://..."
```

## Why Two .env Files?

**Historical Reason:** Next.js uses `.env.local` for runtime variables, but Prisma only reads `.env` by default. To make both work seamlessly:

- **`.env`** - Shared by both Prisma CLI and Next.js runtime
- **`.env.local`** - Optional override for Next.js-specific variables

**Best Practice:** Just use `.env` for everything in this project. The `.env.local` file is optional.

## Security Notes

- ✅ Both `.env` and `.env.local` are in `.gitignore`
- ✅ Only `.env.example` is committed (no secrets)
- ⚠️ Never commit real connection strings
- ⚠️ Use different databases for dev/staging/production
- ⚠️ Rotate credentials if accidentally committed

## Verifying Setup

Test your environment setup:

```bash
# 1. Generate Prisma Client
pnpm db:generate
# Should output: "Generated Prisma Client" with no errors

# 2. Test database connection
pnpm db:push
# Should output: "Your database is now in sync with your Prisma schema"

# 3. Seed sample data
pnpm db:seed
# Should output: "Seeding complete!" with 3 recipes and 2 menus

# 4. Open Prisma Studio to view data
pnpm db:studio
# Should open http://localhost:5555 with your data
```

If all commands succeed, you're ready to develop! 🚀
