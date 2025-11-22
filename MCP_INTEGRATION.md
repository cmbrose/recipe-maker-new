# Model Context Protocol (MCP) Integration

This application exposes a Model Context Protocol (MCP) endpoint that allows LLM chat applications (like Claude Desktop, Cline, or other MCP-compatible clients) to access your recipe data through a standardized protocol.

## Architecture

The MCP endpoint is protected by OAuth authentication using `mcp-auth-proxy`. The application runs three services in a Docker container:

1. **Next.js Application** (port 3000) - Main web application and internal MCP API
2. **MCP Auth Proxy** (port 3001) - OAuth wrapper for MCP endpoint using Google OAuth
3. **Nginx** (port 80) - Routes `/mcp` to auth proxy, everything else to Next.js

This architecture allows:
- MCP clients to authenticate using OAuth flows (required for programmatic access)
- Regular browser users to access the web app without interference
- REST API clients to access other endpoints normally

## Endpoint

The MCP server is available at:
```
# Local development (via nginx, exposed on port 3000)
POST http://localhost:3000/mcp

# Production
POST https://brose-recipes.com/mcp
```

**Note:** The internal Next.js endpoint at `/api/mcp` is not directly accessible from outside the container. All external MCP requests must go through the `/mcp` path which enforces OAuth authentication.

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

### `get_recipe`

Retrieve the full details of a single recipe by its ID.

**Parameters:**
- `id` (string, required): The ID of the recipe to retrieve (can be obtained from `list_recipes`)

**Returns:**
The complete recipe object with all details including ingredients, directions, notes, etc.

### `create_recipe`

Create a new recipe. **Requires authentication.**

**Parameters:**
- `name` (string, required): Name of the recipe
- `prepTime` (string, optional): Preparation time (e.g., "15 mins", "1 hour")
- `cookTime` (string, optional): Cooking time (e.g., "30 mins", "45 mins")
- `totalTime` (string, optional): Total time (e.g., "1 hour 15 mins")
- `servings` (string, optional): Number of servings (e.g., "4 servings", "8-10 cookies")
- `ingredients` (array, required): List of ingredient groups. Each group has:
  - `name` (string, optional): Section name (e.g., "For the sauce", "For the dough")
  - `ingredients` (array of strings, required): List of ingredients in this group
- `directions` (array of strings, required): Step-by-step cooking directions
- `previewUrl` (string, optional): URL to a preview image
- `source` (string, optional): Source URL if recipe came from a website
- `sourceKind` (string, optional): Source type - `url` or `manual` (default: `manual`)
- `tags` (array of strings, optional): Tags for categorization (e.g., `["dinner", "vegetarian", "quick"]`)
- `notes` (array of strings, optional): Additional notes about the recipe

**Returns:**
```json
{
  "success": true,
  "message": "Recipe created successfully",
  "recipe": {
    "id": "...",
    "name": "...",
    "tags": [...],
    "sourceKind": "manual",
    "browserUrl": "https://brose-recipes.com/recipes/..."
  }
}
```

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "create_recipe",
    "arguments": {
      "name": "Chocolate Chip Cookies",
      "prepTime": "15 mins",
      "cookTime": "12 mins",
      "servings": "24 cookies",
      "ingredients": [
        {
          "name": "Dry Ingredients",
          "ingredients": [
            "2 1/4 cups all-purpose flour",
            "1 tsp baking soda",
            "1 tsp salt"
          ]
        },
        {
          "name": "Wet Ingredients",
          "ingredients": [
            "1 cup butter, softened",
            "3/4 cup granulated sugar",
            "3/4 cup packed brown sugar",
            "2 large eggs",
            "2 tsp vanilla extract"
          ]
        },
        {
          "ingredients": [
            "2 cups chocolate chips"
          ]
        }
      ],
      "directions": [
        "Preheat oven to 375°F",
        "Combine flour, baking soda and salt in bowl",
        "Beat butter and sugars until creamy",
        "Add eggs and vanilla, beat well",
        "Gradually beat in flour mixture",
        "Stir in chocolate chips",
        "Drop by tablespoon onto baking sheets",
        "Bake 9-11 minutes until golden brown"
      ],
      "tags": ["dessert", "cookies", "chocolate"],
      "notes": ["These freeze well for up to 3 months"]
    }
  }
}
```

## Setup

### 1. Local Development

#### Option A: Direct Next.js Development (No OAuth)
For quick development without MCP OAuth:

```bash
pnpm dev
```

The internal MCP endpoint will be available at `http://localhost:3000/api/mcp` but without OAuth protection.

#### Option B: Full Docker Environment (With OAuth)
To test the complete production-like setup with OAuth:

```bash
# Create .env file with required variables:
# COSMOS_DB_CONNECTION_STRING=...
# AUTH_SECRET=...
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# AUTH_URL=http://localhost

# Build and run the Docker container
chmod +x scripts/run-local-docker.sh
./scripts/run-local-docker.sh
```

This starts all three services (Next.js, MCP Auth Proxy, Nginx) on port 80.

### 2. Configure MCP Client

#### For Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "recipe-maker": {
      "url": "http://localhost:3000/mcp",
      "oauth": {
        "provider": "google",
        "scopes": ["openid", "email", "profile"]
      }
    }
  }
}
```

#### For Other MCP-Compatible Tools

Configure your MCP client to make POST requests to:
- Local: `http://localhost:3000/mcp`
- Production: `https://brose-recipes.com/mcp`

The first request will initiate an OAuth flow that opens a browser for authentication.

### 3. Authentication

**MCP Endpoint Authentication:**
The `/mcp` endpoint requires OAuth authentication via `mcp-auth-proxy`. When an MCP client connects:

1. The client makes a request to `/mcp`
2. If not authenticated, `mcp-auth-proxy` redirects to Google OAuth
3. User authenticates in browser
4. Client receives access token for subsequent requests

**Tool-Level Authentication:**
Some MCP tools also require the user to be in the application's allowlist:

**Tools requiring allowlist:**
- `create_recipe` - Creating new recipes requires a logged-in, allowed user

**Tools not requiring allowlist:**
- `list_recipes` - Browse public recipes
- `get_recipe` - View recipe details

To manage the allowlist:
```bash
pnpm user:add    # Add email to allowlist
pnpm user:list   # List allowed emails
pnpm user:remove # Remove email from allowlist
```

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

### Testing with OAuth (via Docker)

If running the full Docker setup, you'll need to authenticate first. The easiest way is to use an MCP client that handles OAuth (like Claude Desktop).

For manual testing, you'll need to:
1. Complete the OAuth flow to get an access token
2. Include the token in subsequent requests

### Testing Without OAuth (Direct Next.js)

For development, you can test the internal endpoint directly:

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

# Get a specific recipe
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "get_recipe",
      "arguments": {
        "id": "YOUR_RECIPE_ID_HERE"
      }
    }
  }'

# Create a recipe (requires authentication)
# Note: You need to be logged in via the web UI first, or include session cookie
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -b "your-session-cookie" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "create_recipe",
      "arguments": {
        "name": "Simple Pasta",
        "prepTime": "5 mins",
        "cookTime": "10 mins",
        "servings": "2",
        "ingredients": [
          {
            "ingredients": [
              "200g pasta",
              "2 tbsp olive oil",
              "2 cloves garlic",
              "Salt and pepper to taste"
            ]
          }
        ],
        "directions": [
          "Boil pasta according to package directions",
          "Heat olive oil in a pan",
          "Add minced garlic and cook until fragrant",
          "Toss cooked pasta with garlic oil",
          "Season with salt and pepper"
        ],
        "tags": ["pasta", "quick", "easy"]
      }
    }
  }'
```

## Future Enhancements

Potential tools to add:

- `update_recipe`: Update an existing recipe (requires auth)
- `delete_recipe`: Delete a recipe (requires auth)
- `get_tags`: Get all available tags
- `search_recipes`: Advanced search with query syntax
- `get_recent_recipes`: Get recently viewed or created recipes
- `create_menu`: Create a meal plan/menu (requires auth)
- `list_menus`: List all menus
- `scrape_recipe_from_url`: Import a recipe from a URL (requires auth)

## Technical Architecture

### Multi-Service Container

The application runs three services in a single Docker container:

1. **Next.js Application** (port 3000)
   - Main web application
   - Internal MCP API at `/api/mcp`
   - Handles business logic and database operations

2. **MCP Auth Proxy** (port 3001)
   - Wraps the internal MCP endpoint with OAuth
   - Uses [mcp-auth-proxy](https://github.com/sigbit/mcp-auth-proxy)
   - Handles Google OAuth flow for MCP clients

3. **Nginx** (port 80)
   - Entry point for all traffic
   - Routes `/mcp` → MCP Auth Proxy (port 3001)
   - Routes everything else → Next.js (port 3000)

### Service Flow

```
MCP Client Request → Nginx (/mcp) → MCP Auth Proxy (OAuth) → Next.js (/api/mcp) → Database
Browser Request   → Nginx (/*) → Next.js → Database
```

### Benefits

1. **OAuth for MCP**: MCP clients can authenticate programmatically
2. **Transparent to browsers**: Web users access the app normally
3. **Single deployment**: All services in one container
4. **Consistent environment**: Local dev mirrors production
5. **Existing auth**: Web app continues using NextAuth.js sessions

## Troubleshooting

### Connection Errors

**Docker setup not starting:**
1. Check all required environment variables are set in `.env`
2. View container logs: `docker logs -f recipe-maker-dev`
3. Ensure ports 80 is available on your machine

**MCP endpoint not accessible:**
1. Verify container is running: `docker ps`
2. Check nginx is routing correctly: `curl http://localhost/health`
3. Test internal Next.js endpoint: `docker exec recipe-maker-dev curl http://localhost:3000/api/health`

**OAuth flow failing:**
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
2. Check `AUTH_URL` matches your actual URL (including protocol)
3. Ensure redirect URI is configured in Google Cloud Console: `https://your-domain.com/mcp/callback`
4. View MCP Auth Proxy logs in container: `docker logs recipe-maker-dev | grep mcp-auth-proxy`

### Tool Execution Errors

1. Check the Next.js server logs in container
2. Verify your database has data (run `pnpm db:seed` if needed)
3. Ensure the request format matches the JSON-RPC 2.0 specification
4. For `create_recipe`, verify user email is in allowlist: `pnpm user:list`

### Local Docker Issues

**Building fails:**
- Ensure `COSMOS_DB_CONNECTION_STRING` is set during build
- Check Docker has enough resources (memory/disk)

**Container crashes immediately:**
- Check logs: `docker logs recipe-maker-dev`
- Verify all scripts have execute permissions
- Ensure Next.js built successfully in the image

**Services not starting in order:**
- The entrypoint script waits for Next.js before starting other services
- If MCP Auth Proxy starts before Next.js is ready, it will fail
- Check startup sequence in logs

### Production Deployment Issues

**Container Apps deployment fails:**
1. Verify all GitHub secrets are set: `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
2. Check Azure Container Registry access
3. Ensure target port is set to 80 (not 3000)
4. View deployment logs in Azure Portal
