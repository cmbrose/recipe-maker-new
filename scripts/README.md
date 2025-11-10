# Deployment Scripts

Automated scripts for deploying Azure resources for the Recipe Maker application.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure subscription with appropriate permissions
- Logged in to Azure CLI: `az login`
- [GitHub CLI](https://cli.github.com/) (optional, for setting secrets)

## Scripts

### Deployment Scripts

#### 1. deploy-cosmosdb.sh

Creates and configures Azure Cosmos DB with MongoDB API.

**Usage:**
```bash
./scripts/deploy-cosmosdb.sh [OPTIONS]
```

**Options:**
- `--resource-group <name>` - Resource group name (default: recipe-maker-rg)
- `--location <region>` - Azure region (default: eastus)
- `--account-name <name>` - Cosmos DB account name (default: recipe-maker-cosmos)
- `--subscription <id>` - Subscription Id, you probably want bb3afef1-e1ff-4b0e-a8e3-bd3a8e208b43
- `--help` - Show help message

**What it does:**
1. Creates resource group (if needed)
2. Creates Cosmos DB account with MongoDB API in serverless mode
3. Creates `recipe-maker` database
4. Creates `Recipe` and `Menu` collections
5. Sets up performance indexes on:
   - Recipe: name, tags, lastViewed, createdAt, sourceKind
   - Menu: name, createdAt
6. Outputs connection string for configuration

**Example:**
```bash
# Use defaults
./scripts/deploy-cosmosdb.sh

# Custom configuration
./scripts/deploy-cosmosdb.sh \
  --resource-group my-rg \
  --location westus2 \
  --account-name my-cosmos-account
```

**Output:**
- Connection string for `.env` file
- Command to set GitHub secret
- Next steps for Prisma setup

### 2. deploy-static-web-app.sh

Creates and configures Azure Static Web App for hosting the Next.js application.

**Usage:**
```bash
./scripts/deploy-static-web-app.sh [OPTIONS]
```

**Options:**
- `--resource-group <name>` - Resource group name (default: recipe-maker-rg)
- `--location <region>` - Azure region (default: eastus2)
- `--app-name <name>` - Static Web App name (default: recipe-maker-app)
- `--sku <tier>` - Pricing tier: Free or Standard (default: Free)
- `--subscription <id>` - Subscription Id, you probably want bb3afef1-e1ff-4b0e-a8e3-bd3a8e208b43
- `--github-repo <owner/repo>` - GitHub repository (auto-detected if in git repo)
- `--github-branch <branch>` - GitHub branch (default: main)
- `--help` - Show help message

**What it does:**
1. Auto-detects GitHub repository from git remote
2. Creates resource group (if needed)
3. Creates Static Web App resource
4. Retrieves deployment token
5. Provides commands to set up GitHub Actions deployment

**Example:**
```bash
# Use defaults (auto-detect repo)
./scripts/deploy-static-web-app.sh

# Custom configuration
./scripts/deploy-static-web-app.sh \
  --app-name my-recipe-app \
  --sku Standard \
  --github-repo myuser/my-repo
```

**Output:**
- Deployment token for GitHub Actions
- App URL
- Commands to set GitHub secrets
- Next steps for deployment setup

### 3. deploy-container-app.sh

Creates and configures Azure Container Apps for hosting the Recipe Maker application.

**Usage:**
```bash
./scripts/deploy-container-app.sh [OPTIONS]
```

**Options:**
- `--resource-group <name>` - Resource group name (default: recipe-maker-rg)
- `--app-name <name>` - Container App name (default: recipe-maker-container)
- `--location <region>` - Azure region (default: centralus)
- `--sku <tier>` - Pricing tier: Consumption or Premium (default: Consumption)
- `--subscription <id>` - Subscription Id, you probably want bb3afef1-e1ff-4b0e-a8e3-bd3a8e208b43
- `--image <image>` - Docker image name (default: recipe-maker-image)
- `--env <key=value>` - Environment variables (repeat for multiple)
- `--help` - Show help message

**What it does:**
1. Creates resource group (if needed)
2. Creates Azure Container Registry (ACR) for storing Docker images
3. Builds and pushes Docker image to ACR
4. Creates Container App with the specified image
5. Configures environment variables and secrets
6. Outputs URL of the deployed app

**Example:**
```bash
# Use defaults
./scripts/deploy-container-app.sh

# Custom configuration
./scripts/deploy-container-app.sh \
  --app-name my-container-app \
  --location westeurope \
  --image myregistry.azurecr.io/myimage:latest \
  --env COSMOS_DB_CONNECTION_STRING="<your-cosmos-conn-string>"
```

**Output:**
- URL of the deployed Container App
- Command to set GitHub secret for ACR login
- Next steps for testing the deployment

### Data Migration Scripts

#### 4. export-mysql-data.sh

Exports recipes and menus from MySQL database to JSON files using TypeScript/Prisma for reliable serialization.

**Usage:**
```bash
./scripts/export-mysql-data.sh [OPTIONS]
```

**Options:**
- `--output-dir <path>` - Output directory for exported data (default: ./data-export)
- `--help` - Show help message

**Environment Variables:**
- `DATABASE_URL` - MySQL connection string (required)
- `EXPORT_OUTPUT_DIR` - Alternative to --output-dir

**What it does:**
1. Uses Prisma Client to connect to MySQL
2. Exports all recipes to `recipes.json` (properly serialized)
3. Exports all menus to `menus.json` (properly serialized)
4. Creates `metadata.json` with export information
5. Handles complex data types (JSON arrays, special characters) correctly

**Example:**
```bash
# Basic export
export DATABASE_URL='mysql://user:pass@host:3306/database'
./scripts/export-mysql-data.sh

# Custom output directory
export DATABASE_URL='mysql://user:pass@recipes-dev.mysql.database.azure.com:3306/recipes'
./scripts/export-mysql-data.sh --output-dir ./backup
```

**Output:**
- `<output-dir>/recipes.json` - All recipe data (valid JSON)
- `<output-dir>/menus.json` - All menu data (valid JSON)
- `<output-dir>/metadata.json` - Export metadata

**Note:** This script uses TypeScript (`export-mysql-data.ts`) via `tsx` for reliable data serialization. The old bash/awk approach was too brittle for handling complex JSON data.

#### 5. import-cosmos-data.sh

Imports recipes and menus from JSON files into Cosmos DB via Prisma.

**Usage:**
```bash
./scripts/import-cosmos-data.sh [OPTIONS]
```

**Options:**
- `--input-dir <path>` - Input directory with exported data (default: ./data-export)
- `--prisma-dir <path>` - Directory containing Prisma schema (default: .)
- `--dry-run` - Validate data without importing
- `--help` - Show help message

**What it does:**
1. Validates JSON files
2. Creates Node.js import script
3. Imports recipes to Cosmos DB via Prisma
4. Maps old MySQL IDs to new Cosmos IDs
5. Imports menus with updated recipe references
6. Reports success/failure statistics

**Example:**
```bash
# Basic import (uses ./data-export)
./scripts/import-cosmos-data.sh

# Dry run to validate data
./scripts/import-cosmos-data.sh --dry-run

# Custom directories
./scripts/import-cosmos-data.sh \
  --input-dir ./backup
```

**Requirements:**
- `COSMOS_DB_CONNECTION_STRING` environment variable must be set
- Prisma must be configured and connected to Cosmos DB
- Node.js and jq must be installed

## Complete Migration Workflow

### Step 1: Export Data from MySQL

```bash
# Export existing recipes and menus from MySQL
./scripts/export-mysql-data.sh \
  --host <your-mysql-host> \
  --user <your-username> \
  --password <your-password> \
  --database recipe_maker_production
```

This creates JSON files in `./data-export/`:
- `recipes.json` - All recipe data
- `menus.json` - All menu data  
- `metadata.json` - Export information

### Step 2: Validate Exported Data

```bash
# Dry run to validate before importing
./scripts/import-cosmos-data.sh --dry-run

# Inspect the data manually
cat ./data-export/metadata.json
jq '.[0]' ./data-export/recipes.json  # View first recipe
```

### Step 3: Import Data to Cosmos DB

```bash
# Make sure COSMOS_DB_CONNECTION_STRING is set in .env
./scripts/import-cosmos-data.sh
```

The import script will:
- Import all recipes
- Map old MySQL IDs to new Cosmos IDs
- Import menus with updated recipe references
- Report any errors

### Step 4: Verify Migration

```bash
# Check the data in Cosmos DB
pnpm db:studio

# Test the application
pnpm dev
```

## Complete Deployment Workflow

### Step 1: Deploy Cosmos DB

```bash
./scripts/deploy-cosmosdb.sh
```

Save the connection string output, then:

```bash
# Set local environment variable
echo 'COSMOS_DB_CONNECTION_STRING="<your-connection-string>"' >> .env

# Initialize database schema
pnpm db:push

# Seed with sample data (optional)
pnpm db:seed
```

### Step 2: Deploy Static Web App

```bash
./scripts/deploy-static-web-app.sh
```

Set GitHub secrets:

```bash
# Set deployment token
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "<deployment-token>"

# Set Cosmos DB connection string
gh secret set COSMOS_DB_CONNECTION_STRING --body "<cosmos-connection-string>"
```

### Step 3: Set Up GitHub Actions

Create workflow file (if not exists):

```bash
mkdir -p .github/workflows
# Create azure-static-web-apps.yml workflow
# See the workflow template in the repository
```

### Step 4: Deploy

```bash
git add .
git commit -m "Set up Azure deployment"
git push origin main
```

GitHub Actions will automatically build and deploy your app!

## Container App Deployment

## Deploying to Azure Container Apps

1. **Build and push Docker image**
2. **Deploy to Azure Container Apps**

### Prerequisites
- Azure CLI (`az`)
- Docker
- Azure Container Registry (created by script)
- Cosmos DB and Application Insights connection strings

### Steps

```bash
# Set environment variables (or pass as flags)
export COSMOS_DB_CONNECTION_STRING="<cosmos-conn-string>"
export APPLICATIONINSIGHTS_CONNECTION_STRING="<app-insights-conn-string>"

# Deploy
./scripts/deploy-container-app.sh \
  --resource-group recipe-maker-rg \
  --app-name recipe-maker-container \
  --location centralus
```

- The script will build the Docker image, push to ACR, and deploy to Azure Container Apps.
- The app will be available at the URL output by the script.

### Environment Variables
- `COSMOS_DB_CONNECTION_STRING` (required)
- `APPLICATIONINSIGHTS_CONNECTION_STRING` (optional, for telemetry)

---

## Cleaned up: Azure SWA files and scripts have been removed.

## Environment Variables

The scripts respect these environment variables as defaults:

- `AZURE_RESOURCE_GROUP` - Default resource group name
- `AZURE_LOCATION` - Default Azure region
- `COSMOS_ACCOUNT_NAME` - Cosmos DB account name
- `STATIC_WEB_APP_NAME` - Static Web App name
- `STATIC_WEB_APP_SKU` - Static Web App pricing tier
- `GITHUB_BRANCH` - GitHub branch for deployment

## Costs

### Free Tier (default)
- **Cosmos DB Serverless**: ~$10-50/month (usage-based)
- **Static Web App Free**: $0/month
  - 100 GB bandwidth
  - 0.5 GB storage
  - Custom domains with SSL

**Total: ~$10-50/month**

### Standard Tier (optional)
- **Static Web App Standard**: $9/month
  - Adds: More bandwidth, staging environments, custom auth

## Troubleshooting

### "Not logged in to Azure"
```bash
az login
```

### "Resource already exists"
The scripts are idempotent - they'll skip existing resources and only create what's missing.

### "Failed to retrieve deployment token"
Try running the script again. If it persists, check your Azure permissions.

### "Could not detect GitHub repository"
Either run the script from within your git repository, or specify `--github-repo owner/repo`.

## Cleanup

To remove all deployed resources:

```bash
# Delete the entire resource group
az group delete --name recipe-maker-rg --yes --no-wait
```

## Support

For issues or questions:
1. Check Azure CLI is up to date: `az upgrade`
2. Verify you have necessary Azure permissions
3. Check Azure Portal for resource status
4. Review script output for specific error messages
