#!/bin/bash
set -e

# Azure Static Web App Deployment Script
# Creates Azure Static Web App resource and configures deployment
# Usage: ./scripts/deploy-static-web-app.sh [--resource-group <name>] [--location <location>]

# Default values
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-recipe-maker-rg}"
LOCATION="${AZURE_LOCATION:-centralus}"
APP_NAME="${STATIC_WEB_APP_NAME:-recipe-maker-app}"
SKU="${STATIC_WEB_APP_SKU:-Free}"  # Free or Standard
GITHUB_REPO=""  # Will be auto-detected or can be specified
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    --app-name)
      APP_NAME="$2"
      shift 2
      ;;
    --sku)
      SKU="$2"
      shift 2
      ;;
    --github-repo)
      GITHUB_REPO="$2"
      shift 2
      ;;
    --github-branch)
      GITHUB_BRANCH="$2"
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
      echo "  --location <location>     Azure region (default: eastus2)"
      echo "  --app-name <name>         Static Web App name (default: recipe-maker-app)"
      echo "  --sku <tier>              Pricing tier: Free or Standard (default: Free)"
      echo "  --github-repo <repo>      GitHub repo (owner/repo format, auto-detected if in git repo)"
      echo "  --github-branch <branch>  GitHub branch (default: main)"
      echo "  --subscription <id>       Azure subscription ID (uses current if not specified)"
      echo "  --help                    Show this help message"
      echo ""
      echo "Environment variables:"
      echo "  AZURE_RESOURCE_GROUP      Alternative to --resource-group"
      echo "  AZURE_LOCATION            Alternative to --location"
      echo "  STATIC_WEB_APP_NAME       Alternative to --app-name"
      echo "  STATIC_WEB_APP_SKU        Alternative to --sku"
      echo "  GITHUB_BRANCH             Alternative to --github-branch"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}=== Azure Static Web App Deployment Script ===${NC}"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "App Name: $APP_NAME"
echo "SKU: $SKU"
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
PROVIDER_STATE=$(az provider show --namespace Microsoft.Web --query "registrationState" -o tsv 2>/dev/null || echo "NotRegistered")

if [ "$PROVIDER_STATE" != "Registered" ]; then
    echo -e "${YELLOW}Registering Microsoft.Web provider (this may take a few minutes)...${NC}"
    az provider register --namespace Microsoft.Web --wait
    echo -e "${GREEN}✓ Microsoft.Web provider registered${NC}"
else
    echo -e "${GREEN}✓ Microsoft.Web provider already registered${NC}"
fi
echo ""

# Auto-detect GitHub repository if not specified
if [ -z "$GITHUB_REPO" ]; then
    echo -e "${YELLOW}Detecting GitHub repository...${NC}"
    if git rev-parse --git-dir > /dev/null 2>&1; then
        # Get remote URL
        REMOTE_URL=$(git config --get remote.origin.url)
        if [[ $REMOTE_URL == *"github.com"* ]]; then
            # Extract owner/repo from various GitHub URL formats
            if [[ $REMOTE_URL =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
                GITHUB_OWNER="${BASH_REMATCH[1]}"
                GITHUB_REPO_NAME="${BASH_REMATCH[2]}"
                GITHUB_REPO="$GITHUB_OWNER/$GITHUB_REPO_NAME"
                echo -e "${GREEN}✓ Detected repository: $GITHUB_REPO${NC}"
            else
                echo -e "${RED}Could not parse GitHub repo from remote URL: $REMOTE_URL${NC}"
                echo "Please specify --github-repo <owner/repo>"
                exit 1
            fi
        else
            echo -e "${RED}Remote origin is not a GitHub repository${NC}"
            echo "Please specify --github-repo <owner/repo>"
            exit 1
        fi
    else
        echo -e "${RED}Not in a git repository${NC}"
        echo "Please specify --github-repo <owner/repo>"
        exit 1
    fi
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

# Check if Static Web App exists
echo -e "${YELLOW}Checking Static Web App...${NC}"
if az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${GREEN}✓ Static Web App '$APP_NAME' already exists${NC}"
    APP_EXISTS=true
else
    echo -e "${YELLOW}Creating Static Web App '$APP_NAME'...${NC}"
    APP_EXISTS=false
    
    # Create without GitHub integration first (we'll set that up via GitHub Actions)
    az staticwebapp create \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU" \
        --output none
    
    echo -e "${GREEN}✓ Static Web App created${NC}"
fi
echo ""

# Get deployment token
echo -e "${YELLOW}Retrieving deployment token...${NC}"
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    -o tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    echo -e "${RED}Failed to retrieve deployment token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Deployment token retrieved${NC}"
echo ""

# Get app details
APP_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" \
    -o tsv)

APP_ID=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "id" \
    -o tsv)

# Display summary
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""
echo "Static Web App Details:"
echo "  Name: $APP_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  SKU: $SKU"
echo "  URL: https://$APP_URL"
echo "  Resource ID: $APP_ID"
echo ""
echo -e "${YELLOW}Deployment Token:${NC}"
echo "$DEPLOYMENT_TOKEN"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Set GitHub secret for deployments:"
echo "   ${BLUE}gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body \"$DEPLOYMENT_TOKEN\"${NC}"
echo ""
echo "2. If deploying from this repository ($GITHUB_REPO):"
echo "   ${BLUE}cd \$(git rev-parse --show-toplevel)${NC}"
echo "   ${BLUE}gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body \"$DEPLOYMENT_TOKEN\"${NC}"
echo ""
echo "3. GitHub Actions workflow is already configured at:"
echo "   ${BLUE}.github/workflows/azure-static-web-apps.yml${NC}"
echo ""
echo "4. Set Cosmos DB connection string as GitHub secret:"
echo "   ${BLUE}gh secret set COSMOS_DB_CONNECTION_STRING --body \"<your-connection-string>\"${NC}"
echo ""
echo "5. Push to GitHub to trigger deployment:"
echo "   ${BLUE}git push origin $GITHUB_BRANCH${NC}"
echo ""
echo "6. Configure custom domain (optional):"
echo "   ${BLUE}az staticwebapp hostname set --name $APP_NAME --resource-group $RESOURCE_GROUP --hostname <your-domain.com>${NC}"
echo ""
echo -e "${BLUE}Note: Free tier includes:${NC}"
echo "  - 100 GB bandwidth/month"
echo "  - 0.5 GB storage"
echo "  - Custom domains with free SSL"
echo "  - GitHub integration"
echo ""
echo -e "${GREEN}Deployment script completed successfully!${NC}"
echo ""
echo "View your app at: ${BLUE}https://$APP_URL${NC}"
