#!/bin/bash
set -e

# Deploys the Next.js app to Azure Container Apps
# Usage: ./scripts/deploy-container-app.sh [--resource-group <rg>] [--app-name <name>] [--location <region>]

RESOURCE_GROUP="${RESOURCE_GROUP:-recipe-maker-rg}"
APP_NAME="${APP_NAME:-recipe-maker-container}"
LOCATION="${LOCATION:-centralus}"
IMAGE_NAME="${IMAGE_NAME:-recipe-maker-app}"
REGISTRY="${REGISTRY:-recipecontainerregistry}"
COSMOS_ACCOUNT_NAME="${COSMOS_ACCOUNT_NAME:-recipe-maker-cosmos}"
INSIGHTS_NAME="${INSIGHTS_NAME:-recipe-maker-insights}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"; shift 2;;
    --app-name)
      APP_NAME="$2"; shift 2;;
    --location)
      LOCATION="$2"; shift 2;;
    --cosmos-account)
      COSMOS_ACCOUNT_NAME="$2"; shift 2;;
    --insights-name)
      INSIGHTS_NAME="$2"; shift 2;;
    --subscription)
      SUBSCRIPTION_ID="$2"; shift 2;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --resource-group <rg>       Resource group (default: recipe-maker-rg)"
      echo "  --app-name <name>           Container app name (default: recipe-maker-container)"
      echo "  --location <region>         Azure region (default: centralus)"
      echo "  --cosmos-account <name>     Cosmos DB account name (default: recipe-maker-cosmos)"
      echo "  --insights-name <name>      Application Insights name (default: recipe-maker-insights)"
      echo "  --subscription <id>         Azure subscription ID"
      echo "  --help                      Show this help message"
      exit 0;;
    *) echo "Unknown option: $1"; exit 1;;
  esac
done

if [ -n "$SUBSCRIPTION_ID" ]; then
  az account set --subscription "$SUBSCRIPTION_ID"
fi

echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"
echo "Container Registry: $REGISTRY"
echo "Cosmos Account: $COSMOS_ACCOUNT_NAME"
echo "Application Insights: $INSIGHTS_NAME"
echo ""

# Create resource group
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Fetch Cosmos DB connection string
echo "Fetching Cosmos DB connection string..."
COSMOS_CONN=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --type connection-strings \
    --query "connectionStrings[?description=='Primary MongoDB Connection String'].connectionString" \
    --output tsv)

if [ -z "$COSMOS_CONN" ]; then
    echo "Error: Failed to retrieve Cosmos DB connection string"
    echo "Please check that the Cosmos DB account exists:"
    echo "  az cosmosdb show --name $COSMOS_ACCOUNT_NAME --resource-group $RESOURCE_GROUP"
    exit 1
fi

# Add database name to connection string (insert between port and query params)
COSMOS_CONN="${COSMOS_CONN/10255\//10255\/recipe-maker}"

# Add directConnection=true to disable transactions (Cosmos DB requirement)
COSMOS_CONN="${COSMOS_CONN}&directConnection=true"

echo "✓ Cosmos DB connection string retrieved"

# Fetch Application Insights connection string
echo "Fetching Application Insights connection string..."
AI_CONN=$(az monitor app-insights component show \
    --app "$INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "connectionString" \
    --output tsv 2>/dev/null || echo "")

if [ -z "$AI_CONN" ]; then
    echo "⚠ Application Insights not found, skipping (telemetry will be disabled)"
    AI_CONN=""
else
    echo "✓ Application Insights connection string retrieved"
fi
echo ""

# Create container registry if needed
az acr create --name "$REGISTRY" --resource-group "$RESOURCE_GROUP" --sku Basic --admin-enabled true || true
ACR_LOGIN_SERVER=$(az acr show --name "$REGISTRY" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)

# Build and push Docker image
az acr login --name "$REGISTRY"
docker build -t "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest" .
docker push "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest"

# Create Container App environment
az containerapp env create --name "${APP_NAME}-env" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" || true

# Deploy Container App
echo "Deploying Container App..."

# First, try to update existing app, if it fails, create new one
az containerapp update \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest" \
  --set-env-vars COSMOS_DB_CONNECTION_STRING="$COSMOS_CONN" APPLICATIONINSIGHTS_CONNECTION_STRING="$AI_CONN" \
  --cpu 1.0 --memory 2.0Gi \
  --min-replicas 1 --max-replicas 3 2>/dev/null || \
az containerapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --environment "${APP_NAME}-env" \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME:latest" \
  --target-port 3000 \
  --ingress external \
  --env-vars COSMOS_DB_CONNECTION_STRING="$COSMOS_CONN" APPLICATIONINSIGHTS_CONNECTION_STRING="$AI_CONN" \
  --cpu 1.0 --memory 2.0Gi \
  --min-replicas 1 --max-replicas 3 \
  --registry-server "$ACR_LOGIN_SERVER"

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Note: Health probes are configured in the Dockerfile via HEALTHCHECK directive"
echo ""

# Get the app URL
APP_URL=$(az containerapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)

echo "App URL: https://$APP_URL"
echo ""
echo "Next steps:"
echo "1. Test the health endpoint: curl https://$APP_URL/api/health"
echo "2. View logs: az containerapp logs show --name $APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo "3. Check Application Insights for telemetry data"
