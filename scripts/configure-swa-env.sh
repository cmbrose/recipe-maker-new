#!/bin/bash
set -e

# Script to configure Azure Static Web App environment variables

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-recipe-maker-rg}"
APP_NAME="${APP_NAME:-recipe-maker-app}"
COSMOS_ACCOUNT_NAME="${COSMOS_ACCOUNT_NAME:-recipe-maker-cosmos}"
COSMOS_DB_NAME="${COSMOS_DB_NAME:-recipe-maker}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID}"

echo -e "${GREEN}=== Configure Azure Static Web App Environment ===${NC}"
echo ""

# Set subscription if provided
if [ -n "$SUBSCRIPTION_ID" ]; then
    echo -e "${YELLOW}Setting subscription: $SUBSCRIPTION_ID${NC}"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo "Cosmos Account: $COSMOS_ACCOUNT_NAME"
echo ""

# Fetch the Cosmos DB connection string
echo -e "${YELLOW}Fetching Cosmos DB connection string...${NC}"
COSMOS_DB_CONNECTION_STRING=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --type connection-strings \
    --query "connectionStrings[?description=='Primary MongoDB Connection String'].connectionString" \
    --output tsv)

if [ -z "$COSMOS_DB_CONNECTION_STRING" ]; then
    echo -e "${RED}Error: Failed to retrieve Cosmos DB connection string${NC}"
    echo "Please check that the Cosmos DB account exists:"
    echo "  az cosmosdb show --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP"
    exit 1
fi

echo -e "${GREEN}✓ Connection string retrieved${NC}"
echo ""

# Set the environment variable in Azure Static Web App
echo -e "${YELLOW}Setting COSMOS_DB_CONNECTION_STRING in Azure Static Web App...${NC}"
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names COSMOS_DB_CONNECTION_STRING="$COSMOS_DB_CONNECTION_STRING"

echo -e "${GREEN}✓ Environment variable configured${NC}"
echo ""

# Verify
echo -e "${YELLOW}Verifying configuration...${NC}"
SETTINGS=$(az staticwebapp appsettings list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output json)

if echo "$SETTINGS" | jq -e '.properties.COSMOS_DB_CONNECTION_STRING' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ COSMOS_DB_CONNECTION_STRING is set${NC}"
else
    echo -e "${RED}✗ COSMOS_DB_CONNECTION_STRING is not set${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Configuration complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Trigger a new deployment by pushing to GitHub"
echo "2. Or manually trigger a redeployment:"
echo "   ${BLUE}az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query 'properties.defaultHostname'${NC}"
