# Production Deployment Guide

This guide covers deploying the Recipe Maker application to Azure Container Apps with Google OAuth authentication.

**Production Domain:** `https://brose-recipes.com`

## Prerequisites

- Azure subscription with appropriate permissions
- Google Cloud Console access
- GitHub repository with configured secrets
- Custom domain `brose-recipes.com` configured in Azure Container Apps

## 1. Set Up GitHub Secrets (One-Time Setup)

The deployment workflow requires the following secrets to be configured in your GitHub repository:

### Navigate to GitHub Secrets
1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret** for each secret below

### Required Secrets

#### `AZURE_CREDENTIALS`
Azure service principal credentials (already configured in your repo).

#### `AUTH_SECRET` ⭐ **NEW**
A random secret for NextAuth.js session encryption.

**Generate it:**
```bash
openssl rand -base64 32
```

**Example value:**
```
qP075W78NCglmtu7IBDax3yyQuUjuvZJEwdNy9OiqUY=
```

#### `GOOGLE_CLIENT_ID` ⭐ **NEW**
Your production Google OAuth Client ID.

**Format:**
```
1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

#### `GOOGLE_CLIENT_SECRET` ⭐ **NEW**
Your production Google OAuth Client Secret.

**Format:**
```
GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## 2. Configure Google OAuth for Production (One-Time Setup)

You need to create **separate OAuth credentials** for production (don't reuse your development credentials).

### Step 1: Create Production OAuth Client

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one for production)
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Name: `Recipe Maker Production`

### Step 2: Configure Authorized Origins and Redirect URIs

Since your custom domain is `brose-recipes.com`, configure the following:

**Authorized JavaScript origins:**
```
https://brose-recipes.com
```

**Authorized redirect URIs:**
```
https://brose-recipes.com/api/auth/callback/google
```

⚠️ **Important Notes:**
- Use `https://` (not `http://`)
- No trailing slashes
- **These settings are permanent** - you won't need to change them with each deployment
- The custom domain doesn't change, so this is a one-time setup

### Step 3: Copy Credentials to GitHub Secrets

1. After creating the OAuth client, copy the **Client ID** and **Client Secret**
2. Add them as GitHub secrets:
   - `GOOGLE_CLIENT_ID` = your production client ID
   - `GOOGLE_CLIENT_SECRET` = your production client secret

---

## 3. Set Up Email Allowlist for Production (One-Time Setup)

The allowlist is stored in Cosmos DB, so you need to add allowed emails directly to your production database.

### Recommended Method: Use CLI Script with Production Connection String

**Get the production connection string:**
```bash
az cosmosdb keys list \
  --name recipe-maker-cosmos \
  --resource-group recipe-maker-rg \
  --type connection-strings \
  --query "connectionStrings[?description=='Primary MongoDB Connection String'].connectionString" \
  --output tsv
```

**Create a temporary `.env.production` file:**
```bash
# Create separate file to avoid overwriting local .env
cat > .env.production << EOF
COSMOS_DB_CONNECTION_STRING="<paste-connection-string-here>/recipe-maker?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&directConnection=true"
EOF
```

**Update the script temporarily to use it:**
```bash
# Edit scripts/manage-allowlist.ts line 19 to use .env.production
# Change: config({ path: resolve(__dirname, '../.env') });
# To:     config({ path: resolve(__dirname, '../.env.production') });
```

**Add allowed users:**
```bash
pnpm user:add your-email@example.com
pnpm user:add another-user@example.com
```

**Verify:**
```bash
pnpm user:list
```

**Clean up:**
```bash
# Restore the script
git checkout scripts/manage-allowlist.ts

# Remove temporary env file
rm .env.production
```

### Alternative: Add via Azure Portal

1. Go to Azure Portal > Your Cosmos DB account
2. Navigate to **Data Explorer**
3. Find the `recipe-maker` database
4. Open the `AllowedUser` collection
5. Click **New Document** and add:
```json
{
  "email": "your-email@example.com",
  "createdAt": { "$date": "2025-01-16T00:00:00Z" }
}
```

---

## 4. Deploy to Production

### Automatic Deployment (Recommended)

Push to the `main` branch to trigger automatic deployment:

```bash
git push origin main
```

The workflow will:
1. Build the Docker image
2. Push to Azure Container Registry
3. Deploy to Azure Container Apps with all secrets
4. Application will be available at `https://brose-recipes.com`

### Manual Deployment

You can also trigger a deployment manually:

1. Go to GitHub repository > **Actions**
2. Select **Deploy to Azure Container Apps** workflow
3. Click **Run workflow** > **Run workflow**

### Verify Deployment

After deployment completes:

1. **Test health endpoint:**
   ```bash
   curl https://brose-recipes.com/api/health
   ```

2. **Test authentication:**
   - Visit `https://brose-recipes.com`
   - Click "Sign In"
   - Sign in with an email from your allowlist
   - Verify you can create/edit recipes

---

## 5. Monitoring and Troubleshooting

### View Container Logs

```bash
az containerapp logs show \
  --name recipe-maker-container \
  --resource-group recipe-maker-rg \
  --follow
```

### Check Environment Variables

```bash
az containerapp show \
  --name recipe-maker-container \
  --resource-group recipe-maker-rg \
  --query "properties.template.containers[0].env"
```

### Common Issues

**OAuth "redirect_uri_mismatch" error:**
- Verify the redirect URI in Google Console is exactly: `https://brose-recipes.com/api/auth/callback/google`
- No trailing slash
- Use `https://` not `http://`

**"Sign-in denied: email not in allowlist":**
- Add your email to the allowlist using the CLI script (see section 3)
- Verify it's in the Cosmos DB `AllowedUser` collection

**Environment variables not set:**
- Check GitHub Secrets are configured correctly (section 1)
- Re-run the deployment workflow
- Verify secrets in Container Apps with the command above

---

## Summary Checklist (One-Time Setup)

Complete these steps once - you won't need to repeat them for future deployments:

- [ ] Generate `AUTH_SECRET` with `openssl rand -base64 32`
- [ ] Create production Google OAuth client credentials
- [ ] Configure OAuth redirect URI: `https://brose-recipes.com/api/auth/callback/google`
- [ ] Add GitHub Secrets: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Add allowed emails to production Cosmos DB

## Regular Deployments (After Setup)

Once the one-time setup is complete, deploying is simple:

1. Push changes to `main` branch
2. GitHub Actions automatically deploys
3. App is live at `https://brose-recipes.com`

**That's it!** No OAuth updates, no configuration changes needed.

---

## Environment Variables Reference

All environment variables are set automatically by the deployment workflow:

| Variable | Source | Description |
|----------|--------|-------------|
| `COSMOS_DB_CONNECTION_STRING` | Auto-fetched from Azure | MongoDB connection string |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Auto-fetched from Azure | App Insights connection |
| `AUTH_SECRET` | GitHub Secret | NextAuth session encryption |
| `GOOGLE_CLIENT_ID` | GitHub Secret | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | GitHub Secret | Google OAuth Client Secret |
| `AUTH_URL` | Set by workflow | Production URL (`https://brose-recipes.com`) |

Secrets (`AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) are stored as **Container App secrets** (encrypted at rest) and referenced with `secretref:` in environment variables.

---

## Adding New Allowed Users (Post-Deployment)

If you need to add new users after initial setup:

```bash
# Get production connection string (one time)
az cosmosdb keys list \
  --name recipe-maker-cosmos \
  --resource-group recipe-maker-rg \
  --type connection-strings \
  --query "connectionStrings[?description=='Primary MongoDB Connection String'].connectionString" \
  --output tsv

# Create .env.production with the connection string
# Temporarily update scripts/manage-allowlist.ts to use .env.production
# Add users:
pnpm user:add new-user@example.com

# Clean up
git checkout scripts/manage-allowlist.ts
rm .env.production
```

Or use Azure Portal Data Explorer to add documents directly to the `AllowedUser` collection.
