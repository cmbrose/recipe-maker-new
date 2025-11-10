#!/bin/bash
set -e

# Setup GitHub Actions credentials for Azure Container Apps deployment
# This creates a service principal with appropriate permissions and outputs
# the credentials JSON for GitHub Actions

RESOURCE_GROUP="${RESOURCE_GROUP:-recipe-maker-rg}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID}"
SP_NAME="${SP_NAME:-recipe-maker-github-actions}"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=== Setup GitHub Actions Azure Credentials ===${NC}"
echo ""

# Get subscription ID if not provided
if [ -z "$SUBSCRIPTION_ID" ]; then
    SUBSCRIPTION_ID=$(az account show --query id --output tsv)
fi

echo "Subscription ID: $SUBSCRIPTION_ID"
echo "Resource Group: $RESOURCE_GROUP"
echo "Service Principal: $SP_NAME"
echo ""

# Get resource group ID
RG_ID=$(az group show --name "$RESOURCE_GROUP" --query id --output tsv)

echo -e "${YELLOW}Creating service principal with Contributor access to resource group...${NC}"

# Create service principal
CREDENTIALS=$(az ad sp create-for-rbac \
    --name "$SP_NAME" \
    --role Contributor \
    --scopes "$RG_ID" \
    --sdk-auth)

echo -e "${GREEN}✓ Service principal created${NC}"
echo ""

echo -e "${YELLOW}GitHub Secret Configuration:${NC}"
echo ""
echo "1. Go to your GitHub repository settings:"
echo "   ${BLUE}https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/settings/secrets/actions${NC}"
echo ""
echo "2. Click 'New repository secret'"
echo ""
echo "3. Name: ${GREEN}AZURE_CREDENTIALS${NC}"
echo ""
echo "4. Value (copy this JSON):"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "$CREDENTIALS"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "5. Click 'Add secret'"
echo ""

echo -e "${YELLOW}Or set it via GitHub CLI:${NC}"
echo "${BLUE}echo '$CREDENTIALS' | gh secret set AZURE_CREDENTIALS${NC}"
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Add the AZURE_CREDENTIALS secret to GitHub"
echo "2. Push to main branch to trigger deployment"
echo "3. Monitor deployment: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\(.*\)\.git/\1/')/actions"
