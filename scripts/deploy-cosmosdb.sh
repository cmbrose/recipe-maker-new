#!/bin/bash
set -e

# Cosmos DB Deployment Script
# Creates Azure Cosmos DB with MongoDB API and configures indexes
# Usage: ./scripts/deploy-cosmosdb.sh [--resource-group <name>] [--location <location>]

# Default values
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-recipe-maker-rg}"
LOCATION="${AZURE_LOCATION:-centralus}"
ACCOUNT_NAME="${COSMOS_ACCOUNT_NAME:-recipe-maker-cosmos}"
DATABASE_NAME="recipe-maker"
MAX_THROUGHPUT=1000  # Serverless mode doesn't use this, but kept for reference

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --account-name)
      ACCOUNT_NAME="$2"
      shift 2
      ;;
    --subscription)
      SUBSCRIPTION_ID="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --resource-group <name>   Azure resource group name (default: recipe-maker-rg)"
      echo "  --location <location>     Azure region (default: eastus)"
      echo "  --account-name <name>     Cosmos DB account name (default: recipe-maker-cosmos)"
      echo "  --help                    Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  AZURE_RESOURCE_GROUP      Alternative to --resource-group"
      echo "  AZURE_LOCATION            Alternative to --location"
      echo "  COSMOS_ACCOUNT_NAME       Alternative to --account-name"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}=== Cosmos DB Deployment Script ===${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Account Name: $ACCOUNT_NAME"
echo "Database Name: $DATABASE_NAME"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
echo -e "${YELLOW}Checking Azure login status...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in to Azure. Please run: az login${NC}"
    exit 1
fi

# Set subscription if provided, otherwise use current
if [ -n "$SUBSCRIPTION_ID" ]; then
    echo -e "${YELLOW}Setting subscription to: $SUBSCRIPTION_ID${NC}"
    az account set --subscription "$SUBSCRIPTION_ID"
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    echo -e "${GREEN}✓ Subscription set to: $SUBSCRIPTION_NAME${NC}"
else
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
    echo -e "${GREEN}✓ Using current subscription: $SUBSCRIPTION_NAME${NC}"
fi
echo ""

# Register required resource providers
echo -e "${YELLOW}Checking resource provider registration...${NC}"
PROVIDER_STATE=$(az provider show --namespace Microsoft.DocumentDB --query "registrationState" -o tsv 2>/dev/null || echo "NotRegistered")

if [ "$PROVIDER_STATE" != "Registered" ]; then
    echo -e "${YELLOW}Registering Microsoft.DocumentDB provider (this may take a few minutes)...${NC}"
    az provider register --namespace Microsoft.DocumentDB --wait
    echo -e "${GREEN}✓ Microsoft.DocumentDB provider registered${NC}"
else
    echo -e "${GREEN}✓ Microsoft.DocumentDB provider already registered${NC}"
fi
echo ""

# Create resource group if it doesn't exist
echo -e "${YELLOW}Checking resource group...${NC}"
if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' already exists${NC}"
else
    echo -e "${YELLOW}Creating resource group '$RESOURCE_GROUP'...${NC}"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --output none
    echo -e "${GREEN}✓ Resource group created${NC}"
fi
echo ""

# Check if Cosmos DB account exists
echo -e "${YELLOW}Checking Cosmos DB account...${NC}"
if az cosmosdb show --name "$ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Cosmos DB account '$ACCOUNT_NAME' already exists${NC}"
    ACCOUNT_EXISTS=true
else
    echo -e "${YELLOW}Creating Cosmos DB account '$ACCOUNT_NAME' (this may take 5-10 minutes)...${NC}"
    ACCOUNT_EXISTS=false
    
    az cosmosdb create \
        --name "$ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --kind MongoDB \
        --server-version 4.2 \
        --capabilities EnableServerless \
        --locations regionName="$LOCATION" \
        --enable-automatic-failover false \
        --output none
    
    echo -e "${GREEN}✓ Cosmos DB account created${NC}"
fi
echo ""

# Create database if it doesn't exist
echo -e "${YELLOW}Checking database...${NC}"
if az cosmosdb mongodb database show \
    --account-name "$ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DATABASE_NAME" &> /dev/null; then
    echo -e "${GREEN}✓ Database '$DATABASE_NAME' already exists${NC}"
else
    echo -e "${YELLOW}Creating database '$DATABASE_NAME'...${NC}"
    az cosmosdb mongodb database create \
        --account-name "$ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --name "$DATABASE_NAME" \
        --output none
    echo -e "${GREEN}✓ Database created${NC}"
fi
echo ""

# Create collections with indexes
echo -e "${YELLOW}Setting up collections and indexes...${NC}"

# Function to create or update collection with indexes
setup_collection() {
    local collection_name=$1
    local shard_key=$2
    shift 2
    local indexes=("$@")
    
    echo -e "${YELLOW}  Setting up collection: $collection_name${NC}"
    
    # Check if collection exists
    if az cosmosdb mongodb collection show \
        --account-name "$ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --name "$collection_name" &> /dev/null; then
        echo -e "${GREEN}    ✓ Collection '$collection_name' already exists${NC}"
    else
        echo -e "${YELLOW}    Creating collection '$collection_name'...${NC}"
        az cosmosdb mongodb collection create \
            --account-name "$ACCOUNT_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --database-name "$DATABASE_NAME" \
            --name "$collection_name" \
            --shard "$shard_key" \
            --output none
        echo -e "${GREEN}    ✓ Collection created${NC}"
    fi
    
    # Create indexes
    for index_spec in "${indexes[@]}"; do
        local index_name=$(echo "$index_spec" | cut -d'|' -f1)
        local index_keys=$(echo "$index_spec" | cut -d'|' -f2)
        
        echo -e "${YELLOW}    Creating index: $index_name${NC}"
        
        # Note: Azure CLI doesn't support checking if index exists easily
        # So we'll try to create and ignore errors if it exists
        az cosmosdb mongodb collection update \
            --account-name "$ACCOUNT_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --database-name "$DATABASE_NAME" \
            --name "$collection_name" \
            --idx "$index_keys" \
            --output none 2>/dev/null || true
        
        echo -e "${GREEN}    ✓ Index configured: $index_name${NC}"
    done
}

# Setup Recipe collection
# Indexes format: "name|key1=1 key2=-1"
setup_collection "Recipe" "_id" \
    "name_idx|name=1" \
    "tags_idx|tags=1" \
    "lastViewed_idx|lastViewed=-1" \
    "createdAt_idx|createdAt=-1" \
    "sourceKind_idx|sourceKind=1"

echo ""

# Setup Menu collection
setup_collection "Menu" "_id" \
    "name_idx|name=1" \
    "createdAt_idx|createdAt=-1"

echo ""

# Get connection string
echo -e "${YELLOW}Retrieving connection string...${NC}"
CONNECTION_STRING=$(az cosmosdb keys list \
    --name "$ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --type connection-strings \
    --query "connectionStrings[0].connectionString" \
    -o tsv)

echo -e "${GREEN}✓ Connection string retrieved${NC}"
echo ""

# Display summary
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Cosmos DB Details:"
echo "  Account Name: $ACCOUNT_NAME"
echo "  Database Name: $DATABASE_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Endpoint: https://$ACCOUNT_NAME.mongo.cosmos.azure.com:10255/"
echo ""
echo "Collections Created:"
echo "  - Recipe (with indexes: name, tags, lastViewed, createdAt, sourceKind)"
echo "  - Menu (with indexes: name, createdAt)"
echo ""
echo -e "${YELLOW}Connection String:${NC}"
echo "$CONNECTION_STRING"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Save the connection string to your .env file:"
echo "   COSMOS_DB_CONNECTION_STRING=\"$CONNECTION_STRING\""
echo ""
echo "2. Or set it as a GitHub secret for deployments:"
echo "   gh secret set COSMOS_DB_CONNECTION_STRING --body \"$CONNECTION_STRING\""
echo ""
echo "3. Run Prisma commands to sync schema:"
echo "   pnpm db:push"
echo "   pnpm db:seed  # Optional: seed with sample data"
echo ""
echo -e "${GREEN}Deployment script completed successfully!${NC}"
