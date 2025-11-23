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
echo "Target: http://localhost:3000/api/mcp"
echo "Listen: :8080"
echo "Auth URL: $AUTH_URL"

mkdir -p data

exec /usr/local/bin/mcp-auth-proxy \
  --external-url "http://localhost" \
  --listen ":8080" \
  --tls-accept-tos \
  --google-client-id "$GOOGLE_CLIENT_ID" \
  --google-client-secret "$GOOGLE_CLIENT_SECRET" \
  "http://localhost:3000/api/mcp"
