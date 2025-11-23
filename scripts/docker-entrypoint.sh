#!/bin/bash
set -e

# Docker entrypoint script to start all three services:
# 1. Next.js application (port 3000)
# 2. MCP Auth Proxy (port 8080)
# 3. Nginx (port 80)

echo "=== Starting Recipe Maker Services ==="

# Function to handle shutdown gracefully
cleanup() {
    echo "Shutting down services..."
    kill $NEXTJS_PID $MCP_PROXY_PID $NGINX_PID 2>/dev/null || true
    wait $NEXTJS_PID $MCP_PROXY_PID $NGINX_PID 2>/dev/null || true
    echo "Services stopped"
    exit 0
}

trap cleanup SIGTERM SIGINT

# Set NEXTAUTH_URL from AUTH_URL for NextAuth.js
if [ -n "$AUTH_URL" ]; then
    export NEXTAUTH_URL="$AUTH_URL"
    echo "NEXTAUTH_URL set to: $NEXTAUTH_URL"
fi

# Start Next.js app in background (as node user for security)
echo "Starting Next.js application on port 3000..."
# Use 'su' without '-' to preserve environment variables
su node -s /bin/bash -c "cd /app && node_modules/.bin/next start" > /var/log/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"
echo "Next.js logs: /var/log/nextjs.log"

# Wait for Next.js to be ready
echo "Waiting for Next.js to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✓ Next.js is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "Error: Next.js failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Start MCP Auth Proxy in background (only if OAuth credentials are provided)
if [ -n "$GOOGLE_CLIENT_ID" ] && [ -n "$GOOGLE_CLIENT_SECRET" ] && [ -n "$AUTH_URL" ]; then
    echo "Starting MCP Auth Proxy on port 8080..."
    /usr/local/bin/start-mcp-proxy.sh > /var/log/mcp-proxy.log 2>&1 &
    MCP_PROXY_PID=$!
    echo "MCP Auth Proxy PID: $MCP_PROXY_PID"
    echo "MCP Auth Proxy logs: /var/log/mcp-proxy.log"
else
    echo "Warning: OAuth credentials not provided, MCP Auth Proxy will not start"
    echo "MCP endpoint will not be available at /mcp"
    MCP_PROXY_PID=""
fi

# Start nginx in foreground (this becomes the main process)
echo "Starting nginx on port 80..."
# Use exec so nginx becomes PID 1 and receives signals properly
exec nginx -g 'daemon off;'

echo "=== All background services started ==="
echo "Next.js: http://localhost:3000 (PID: $NEXTJS_PID)"
echo "  Logs: /var/log/nextjs.log"
if [ -n "$MCP_PROXY_PID" ]; then
    echo "MCP Auth Proxy: http://localhost:8080 (PID: $MCP_PROXY_PID)"
    echo "  Logs: /var/log/mcp-proxy.log"
    echo "MCP Endpoint (via nginx): http://localhost:80/mcp"
fi
echo "Nginx: http://localhost:80"
echo "  Access log: /var/log/nginx/access.log"
echo "  Error log: /var/log/nginx/error.log"
echo ""
echo "Starting nginx on port 80 (will become main process)..."
echo "Container will stop if nginx exits"
echo ""

# nginx runs in foreground and becomes the main process
# If nginx exits, the container will stop
# This is the standard pattern for multi-service containers
