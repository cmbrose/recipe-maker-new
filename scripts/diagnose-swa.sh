#!/bin/bash
set -e

# Azure Static Web App Diagnostics Script
# Retrieves logs and diagnostics information for troubleshooting deployment issues

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
RESOURCE_GROUP="${RESOURCE_GROUP:-recipe-maker-rg}"
APP_NAME="${APP_NAME:-recipe-maker-app}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID}"

echo -e "${GREEN}=== Azure Static Web App Diagnostics ===${NC}"
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
echo "App Name: $APP_NAME"
echo ""

# Get app details
echo -e "${YELLOW}Fetching Static Web App details...${NC}"
APP_DETAILS=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output json 2>/dev/null || echo "{}")

if [ "$APP_DETAILS" = "{}" ]; then
    echo -e "${RED}Failed to fetch app details. Check resource group and app name.${NC}"
    exit 1
fi

APP_URL=$(echo "$APP_DETAILS" | jq -r '.defaultHostname // "N/A"')
echo -e "${GREEN}✓ App URL: https://$APP_URL${NC}"
echo ""

# Get build/deployment history
echo -e "${YELLOW}Fetching deployment history (last 5 builds)...${NC}"
az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "buildProperties" \
    --output table 2>/dev/null || echo "Build properties not available"
echo ""

# Get environment details
echo -e "${YELLOW}Fetching environment list...${NC}"
az staticwebapp environment list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output table 2>/dev/null || echo "Environment list not available"
echo ""

# Get App Insights connection (if configured)
echo -e "${YELLOW}Checking Application Insights configuration...${NC}"
APP_INSIGHTS=$(echo "$APP_DETAILS" | jq -r '.properties.applicationInsightsResourceId // "Not configured"')
echo "Application Insights: $APP_INSIGHTS"
echo ""

# Get function app logs (backend)
echo -e "${YELLOW}Attempting to get function app logs...${NC}"
echo "Note: Azure SWA uses managed functions, logs may not be directly accessible"
echo ""

# Show how to access logs via Azure Portal
echo -e "${GREEN}=== How to Access Logs ===${NC}"
echo ""
echo "1. Azure Portal - Log Stream:"
echo "   ${BLUE}https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/staticSites/$APP_NAME/logStream${NC}"
echo ""
echo "2. Azure Portal - Monitoring:"
echo "   ${BLUE}https://portal.azure.com/#@/resource/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/staticSites/$APP_NAME/monitoring${NC}"
echo ""
echo "3. Check deployment logs in GitHub Actions"
echo "   - Go to your GitHub repository"
echo "   - Click 'Actions' tab"
echo "   - Select the failed workflow run"
echo ""
echo "4. Test the health endpoint:"
echo "   ${BLUE}curl -v https://$APP_URL/api/health${NC}"
echo ""
echo "5. Enable Application Insights for better diagnostics:"
echo "   ${BLUE}az staticwebapp appsettings set \\${NC}"
echo "   ${BLUE}  --name $APP_NAME \\${NC}"
echo "   ${BLUE}  --resource-group $RESOURCE_GROUP \\${NC}"
echo "   ${BLUE}  --setting-names APPLICATIONINSIGHTS_CONNECTION_STRING=<your-connection-string>${NC}"
echo ""

# Check current app settings (to see if DB connection is configured)
echo -e "${YELLOW}Checking configured app settings...${NC}"
az staticwebapp appsettings list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output table 2>/dev/null || echo "Unable to list app settings"
echo ""

# Test health endpoint
echo -e "${YELLOW}Testing health endpoint...${NC}"
if curl -s -f "https://$APP_URL/api/health" -o /dev/null -w "%{http_code}" 2>/dev/null | grep -q "200"; then
    echo -e "${GREEN}✓ Health endpoint is responding${NC}"
    curl -s "https://$APP_URL/api/health" | jq '.' 2>/dev/null || echo "Response not JSON"
else
    echo -e "${RED}✗ Health endpoint is not responding or returned an error${NC}"
    echo "Attempting to get response details..."
    curl -v "https://$APP_URL/api/health" 2>&1 || true
fi
echo ""

echo -e "${GREEN}=== Diagnostics Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Check the Azure Portal log stream (link above)"
echo "2. Review GitHub Actions deployment logs for detailed errors"
echo "3. Consider enabling Application Insights for production monitoring"
echo "4. If warmup continues to fail, consider:"
echo "   - Using Azure Container Apps instead"
echo "   - Reducing app bundle size"
echo "   - Upgrading to Standard SKU for better performance"
