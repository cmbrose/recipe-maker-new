#!/bin/bash
set -e

# Local development script to build and run the Docker container
# This mimics the production environment locally

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env file if it exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# Check for required environment variables
if [ -z "$COSMOS_DB_CONNECTION_STRING" ]; then
    echo "Error: COSMOS_DB_CONNECTION_STRING environment variable is required"
    echo "Please set it in .env file or export it"
    exit 1
fi

if [ -z "$AUTH_SECRET" ]; then
    echo "Error: AUTH_SECRET environment variable is required"
    echo "Please set it in .env file or export it"
    exit 1
fi

if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "Warning: GOOGLE_CLIENT_ID not set - OAuth will not work"
fi

if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
    echo "Warning: GOOGLE_CLIENT_SECRET not set - OAuth will not work"
fi

# Set default AUTH_URL for local development
# Maps external port 3000 to internal port 80 (nginx)
AUTH_URL="${AUTH_URL:-http://localhost:3000}"

# NextAuth will use this base URL for OAuth redirects

IMAGE_NAME="${IMAGE_NAME:-recipe-maker-local}"
CONTAINER_NAME="${CONTAINER_NAME:-recipe-maker-dev}"

echo "=== Building Docker Image ==="
echo "Image: $IMAGE_NAME"
echo "Project Root: $PROJECT_ROOT"
echo ""

# Build the Docker image
docker build \
    --build-arg COSMOS_DB_CONNECTION_STRING="$COSMOS_DB_CONNECTION_STRING" \
    -t "$IMAGE_NAME" \
    "$PROJECT_ROOT"

echo ""
echo "=== Stopping existing container ==="
docker stop "$CONTAINER_NAME" 2>/dev/null || true
docker rm "$CONTAINER_NAME" 2>/dev/null || true

echo ""
echo "=== Starting Docker Container ==="
echo "Container: $CONTAINER_NAME"
echo "Port: 3000 -> 80 (internal)"
echo "Auth URL: $AUTH_URL"
echo ""

# Run the container
docker run -d \
    --name "$CONTAINER_NAME" \
    -p 3000:80 \
    -e COSMOS_DB_CONNECTION_STRING="$COSMOS_DB_CONNECTION_STRING" \
    -e APPLICATIONINSIGHTS_CONNECTION_STRING="${APPLICATIONINSIGHTS_CONNECTION_STRING:-}" \
    -e AUTH_SECRET="$AUTH_SECRET" \
    -e GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}" \
    -e GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}" \
    -e AUTH_URL="$AUTH_URL" \
    "$IMAGE_NAME"

echo "✓ Container started successfully"
echo ""
echo "=== Service URLs ==="
echo "Web App: http://localhost:3000"
echo "Health Check: http://localhost:3000/health"
echo "API Health: http://localhost:3000/api/health"
if [ -n "$GOOGLE_CLIENT_ID" ]; then
    echo "MCP Endpoint: http://localhost:3000/mcp"
fi
echo ""
echo "=== Useful Commands ==="
echo "View logs: docker logs -f $CONTAINER_NAME"
echo "Stop container: docker stop $CONTAINER_NAME"
echo "Remove container: docker rm $CONTAINER_NAME"
echo "Shell access: docker exec -it $CONTAINER_NAME /bin/bash"
echo ""
echo "Following logs (Ctrl+C to stop)..."
echo ""

# Follow logs
docker logs -f "$CONTAINER_NAME"
