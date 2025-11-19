# Model Context Protocol (MCP) Integration

This application exposes a Model Context Protocol (MCP) endpoint that allows LLM chat applications (like Claude Desktop, Cline, or other MCP-compatible clients) to access your recipe data through a standardized protocol.

## Endpoint

The MCP server is available at:
```
POST http://localhost:3000/api/mcp
```

Or in production:
```
POST https://your-domain.com/api/mcp
```

## Available Tools

### `list_recipes`

List recipes with optional filtering, sorting, and pagination.

**Parameters:**
- `search` (string, optional): Search term to filter recipes by name (case-insensitive)
- `tags` (array of strings, optional): Filter recipes that have ALL of these tags
- `sourceKind` (string, optional): Filter by recipe source type (`url` or `manual`)
- `sort` (string, optional): Sort order for results. Options:
  - `created-desc` (default): Newest first
  - `created-asc`: Oldest first
  - `name-desc`: Z to A
  - `name-asc`: A to Z
  - `viewed-desc`: Most recently viewed first
  - `viewed-asc`: Least recently viewed first
- `page` (number, optional): Page number for pagination (1-indexed, default: 1)
- `limit` (number, optional): Number of recipes per page (default: 20, max: 100)

**Returns:**
```json
{
  "recipes": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

## Setup

### 1. Start the Application

Make sure your Next.js application is running:

```bash
pnpm dev
# or in production
pnpm start
```

The MCP endpoint will be available at `/api/mcp`.

### 2. Configure MCP Client

#### For Claude Desktop (via HTTP)

Claude Desktop primarily supports stdio-based MCP servers, but you can use an HTTP-to-stdio bridge. For now, you can interact with the MCP endpoint using any HTTP client.

#### For Other MCP-Compatible Tools

Configure your MCP client to make POST requests to:
- Development: `http://localhost:3000/api/mcp`
- Production: `https://your-domain.com/api/mcp`

### 3. Authentication (Optional)

If you want to restrict access to the MCP endpoint, you can add authentication by modifying `/app/api/mcp/route.ts`. For example:

```typescript
// Add at the top of POST handler
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.MCP_API_KEY}`) {
  return NextResponse.json({
    jsonrpc: '2.0',
    error: { code: -32600, message: 'Unauthorized' },
  }, { status: 401 });
}
```

Then set `MCP_API_KEY` in your environment variables.

## Protocol Details

The endpoint implements the Model Context Protocol over HTTP using JSON-RPC 2.0.

### Example Requests

**Initialize:**
```json
POST /api/mcp
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "example-client",
      "version": "1.0.0"
    }
  }
}
```

**List Tools:**
```json
POST /api/mcp
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Call Tool:**
```json
POST /api/mcp
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_recipes",
    "arguments": {
      "search": "chicken",
      "tags": ["dinner"],
      "sort": "created-desc",
      "limit": 10
    }
  }
}
```

## Testing

You can test the MCP endpoint using curl:

```bash
# List available tools
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'

# List recipes
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "list_recipes",
      "arguments": {
        "limit": 5
      }
    }
  }'
```

## Future Enhancements

Potential tools to add to `/app/api/mcp/route.ts`:

- `get_recipe`: Get full details of a specific recipe
- `create_recipe`: Create a new recipe
- `update_recipe`: Update an existing recipe
- `delete_recipe`: Delete a recipe
- `get_tags`: Get all available tags
- `search_recipes`: Advanced search with query syntax
- `get_recent_recipes`: Get recently viewed or created recipes
- `create_menu`: Create a meal plan/menu
- `list_menus`: List all menus

## Architecture

The MCP integration is implemented as a Next.js API route at `/app/api/mcp/route.ts`. This approach has several advantages:

1. **No separate service**: Runs as part of your existing Next.js application
2. **Same database connection**: Uses the existing MongoDB connection and services
3. **Easy deployment**: Deploys with your app, no additional configuration needed
4. **Authentication**: Can leverage existing Next.js authentication
5. **Logging**: Uses your existing logging infrastructure

## Troubleshooting

### Connection Errors

1. Ensure your Next.js app is running
2. Verify the MCP endpoint is accessible: `curl http://localhost:3000/api/mcp`
3. Check your MongoDB connection is working

### Tool Execution Errors

1. Check the Next.js server logs
2. Verify your database has data (run `pnpm db:seed` if needed)
3. Ensure the request format matches the JSON-RPC 2.0 specification

### CORS Issues

If you need to call the MCP endpoint from a browser or different origin, CORS is already configured in the OPTIONS handler. Modify the headers if you need more specific control.
