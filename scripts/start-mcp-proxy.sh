#!/bin/bash
set -e

# Start mcp-auth-proxy to wrap the MCP endpoint with OAuth
# This proxies requests to the Next.js app's /api/mcp endpoint

# Required environment variables:
# - GOOGLE_CLIENT_ID: Google OAuth client ID
# - GOOGLE_CLIENT_SECRET: Google OAuth client secret
# - AUTH_URL: Base URL of the application (e.g., https://brose-recipes.com)

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "Error: GOOGLE_CLIENT_ID environment variable is required"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "Error: GOOGLE_CLIENT_SECRET environment variable is required"
    exit 1
fi

if [ -z "$AUTH_URL" ]; then
    echo "Error: AUTH_URL environment variable is required"
    exit 1
fi

echo "Starting mcp-auth-proxy..."
echo "Target backend: http://localhost:3000/api/mcp"
echo "Listen on: :8080"
echo "External URL: $AUTH_URL"
echo ""
echo "MCP endpoint (via nginx): $AUTH_URL/mcp -> proxy root / -> backend /api/mcp"
echo "OAuth endpoints: $AUTH_URL/authorize, /callback, etc. -> proxy root"

mkdir -p data

exec /usr/local/bin/mcp-auth-proxy \
  --external-url "$AUTH_URL" \
  --listen ":8080" \
  --no-auto-tls \
  --google-client-id "$GOOGLE_CLIENT_ID" \
  --google-client-secret "$GOOGLE_CLIENT_SECRET" \
  "http://localhost:3000/api/mcp"
