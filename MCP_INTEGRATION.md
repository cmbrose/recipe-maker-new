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

### 3. Authentication

Some MCP tools require authentication (like `create_recipe`). The authentication is handled automatically through NextAuth.js session management.

**Tools requiring authentication:**
- `create_recipe` - Creating new recipes requires a logged-in user

**Tools not requiring authentication:**
- `list_recipes` - Browse public recipes
- `get_recipe` - View recipe details

To authenticate:
1. Log in to the web application at `http://localhost:3000` using Google OAuth
2. Your session cookie will automatically be sent with MCP requests from the same browser
3. If using an external MCP client, you'll need to include the session cookie in requests

**Note:** For programmatic access from external clients, you may want to add API key authentication by modifying `/app/api/mcp/route.ts`.

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
