#!/bin/bash
set -e

# Script to create and configure Application Insights for Azure Static Web App
# Provides better observability for debugging deployment and runtime issues

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-recipe-maker-rg}"
APP_NAME="${APP_NAME:-recipe-maker-app}"
INSIGHTS_NAME="${INSIGHTS_NAME:-recipe-maker-insights}"
LOCATION="${LOCATION:-centralus}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --app-name)
      APP_NAME="$2"
      shift 2
      ;;
    --insights-name)
      INSIGHTS_NAME="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
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
      echo "  --resource-group <rg>      Resource group name (default: recipe-maker-rg)"
      echo "  --app-name <name>          Static Web App name (default: recipe-maker-app)"
      echo "  --insights-name <name>     Application Insights name (default: recipe-maker-insights)"
      echo "  --location <region>        Azure region (default: centralus)"
      echo "  --subscription <id>        Azure subscription ID"
      echo "  --help                     Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}=== Configure Application Insights for Static Web App ===${NC}"
echo ""

# Check if az is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    echo "Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Set subscription if provided
if [ -n "$SUBSCRIPTION_ID" ]; then
    echo -e "${YELLOW}Setting subscription: $SUBSCRIPTION_ID${NC}"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

echo "Resource Group: $RESOURCE_GROUP"
echo "Static Web App: $APP_NAME"
echo "Application Insights: $INSIGHTS_NAME"
echo "Location: $LOCATION"
echo ""

# Check if Application Insights extension is installed
echo -e "${YELLOW}Checking Azure CLI extensions...${NC}"
if ! az extension show --name application-insights &> /dev/null; then
    echo -e "${YELLOW}Installing application-insights extension...${NC}"
    az extension add --name application-insights --only-show-errors
fi
echo -e "${GREEN}✓ Extensions ready${NC}"
echo ""

# Check if Application Insights already exists
echo -e "${YELLOW}Checking if Application Insights exists...${NC}"
INSIGHTS_EXISTS=$(az monitor app-insights component show \
    --app "$INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output json 2>/dev/null || echo "{}")

if [ "$INSIGHTS_EXISTS" = "{}" ]; then
    # Create Application Insights
    echo -e "${YELLOW}Creating Application Insights instance...${NC}"
    az monitor app-insights component create \
        --app "$INSIGHTS_NAME" \
        --location "$LOCATION" \
        --resource-group "$RESOURCE_GROUP" \
        --application-type web \
        --kind web
    
    echo -e "${GREEN}✓ Application Insights created${NC}"
else
    echo -e "${GREEN}✓ Application Insights already exists${NC}"
fi
echo ""

# Get the connection string
echo -e "${YELLOW}Retrieving Application Insights connection string...${NC}"
INSIGHTS_CONNECTION_STRING=$(az monitor app-insights component show \
    --app "$INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "connectionString" \
    --output tsv)

if [ -z "$INSIGHTS_CONNECTION_STRING" ]; then
    echo -e "${RED}Error: Failed to retrieve connection string${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connection string retrieved${NC}"
echo ""

# Configure Static Web App with Application Insights
echo -e "${YELLOW}Configuring Static Web App with Application Insights...${NC}"
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names APPLICATIONINSIGHTS_CONNECTION_STRING="$INSIGHTS_CONNECTION_STRING"

echo -e "${GREEN}✓ Static Web App configured${NC}"
echo ""

# Get the instrumentation key for reference
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
    --app "$INSIGHTS_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "instrumentationKey" \
    --output tsv)

# Display summary
echo -e "${GREEN}=== Configuration Complete ===${NC}"
echo ""
echo "Application Insights Details:"
echo "  Name: $INSIGHTS_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Instrumentation Key: $INSTRUMENTATION_KEY"
echo ""
echo -e "${YELLOW}Access Application Insights:${NC}"
echo "1. Azure Portal:"
echo "   ${BLUE}https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$INSIGHTS_NAME/overview${NC}"
echo ""
echo "2. View live metrics:"
echo "   ${BLUE}https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$INSIGHTS_NAME/quickPulse${NC}"
echo ""
echo "3. Query logs:"
echo "   ${BLUE}https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Insights/components/$INSIGHTS_NAME/logs${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Deploy or restart your Static Web App to enable monitoring"
echo "2. Wait a few minutes for data to start flowing"
echo "3. Check Application Insights for:"
echo "   - Request traces"
echo "   - Exceptions and errors"
echo "   - Performance metrics"
echo "   - Custom logs from your application"
echo ""
echo -e "${GREEN}Application Insights is now configured!${NC}"
