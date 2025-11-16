# Google OAuth Setup Guide

This application uses Google OAuth for authentication. Follow these steps to configure Google OAuth credentials.

## Steps to Set Up Google OAuth

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - App name: `Recipe Maker`
   - User support email: Your email
   - Developer contact email: Your email
4. Add scopes (optional, the default scopes are sufficient)
5. Add test users if using External type during development
6. Save and continue

### 3. Create OAuth Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Configure the OAuth client:
   - Name: `Recipe Maker Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### 4. Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

3. Generate a random secret for NextAuth:
   ```bash
   openssl rand -base64 32
   ```

4. Add the generated secret to `.env`:
   ```env
   AUTH_SECRET="your-generated-secret"
   ```

### 5. Configure Email Allowlist

The application uses an email allowlist stored in Cosmos DB. Only users whose emails are in the allowlist can sign in.

**Add your email to the allowlist:**

```bash
pnpm tsx scripts/manage-allowlist.ts add your-email@example.com
```

**Other allowlist commands:**

```bash
# List all allowed emails
pnpm tsx scripts/manage-allowlist.ts list

# Remove an email
pnpm tsx scripts/manage-allowlist.ts remove user@example.com
```

**Important Notes:**
- The allowlist is checked **only during sign-in**
- Once a user is signed in with a valid session cookie, their access is not re-verified
- Removing an email from the allowlist will not kick out already signed-in users
- Users must sign out and back in for allowlist changes to take effect

### 6. Test the Authentication

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `http://localhost:3000`
3. Click the **Sign In** button in the navigation bar
4. You should be redirected to Google's OAuth consent screen
5. Sign in with your Google account (must be in the allowlist)
6. After successful authentication, you'll be redirected back to the application

## Authentication Requirements

The following operations require authentication:

### Recipes
- **Create** recipe (manual entry) - `POST /api/recipes`
- **Update** recipe - `PUT /api/recipes/[id]`
- **Delete** recipe - `DELETE /api/recipes/[id]`

### Menus
- **Create** menu - `POST /api/menus`
- **Update** menu - `PUT /api/menus/[id]`
- **Delete** menu - `DELETE /api/menus/[id]`
- **Add** recipe to menu - `POST /api/menus/[id]/recipes`
- **Remove** recipe from menu - `DELETE /api/menus/[id]/recipes/[recipeId]`
- **Reorder** recipes in menu - `PUT /api/menus/[id]/recipes`
- **Clear** menu - `POST /api/menus/[id]/clear`

### Public Endpoints (No Authentication Required)

- View recipes - `GET /api/recipes`, `GET /api/recipes/[id]`
- Search recipes - `GET /api/recipes/search`
- Create recipe from URL - `POST /api/recipes/from-url` ⚠️ **Special case**
- View menus - `GET /api/menus`, `GET /api/menus/[id]`

## Troubleshooting

### "Authentication required" errors

If you receive 401 errors when trying to create, update, or delete resources:
1. Make sure you're signed in (check the navigation bar)
2. Try signing out and signing back in
3. Check browser console for any errors

### OAuth redirect errors

If you see redirect URI mismatch errors:
1. Verify that the redirect URI in Google Cloud Console matches exactly: `http://localhost:3000/api/auth/callback/google`
2. Make sure there are no trailing slashes
3. Check that the port number matches (default is 3000)

### Session issues

If authentication seems to work but you still get 401 errors:
1. Check that `AUTH_SECRET` is set in your `.env` file
2. Restart the development server after changing environment variables
3. Clear browser cookies and try again

## Production Deployment

When deploying to production:

1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`

2. Update environment variables in your production environment:
   ```env
   GOOGLE_CLIENT_ID="your-client-id"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   AUTH_SECRET="your-production-secret"
   NEXT_PUBLIC_APP_URL="https://yourdomain.com"
   ```

3. Make sure to use different OAuth credentials for production and development (recommended for security)
