# Recipe Maker API Documentation

Base URL: `http://localhost:3000/api`

All responses follow a standard format:
- Success: `{ "data": <response_data> }`
- Error: `{ "error": "<error_type>", "message": "<error_message>", "details": <optional_details> }`

---

## Recipes

### List Recipes
**GET** `/recipes`

List all recipes with optional filtering, sorting, and pagination.

**Query Parameters:**
- `search` (string) - Search recipes by name (case-insensitive)
- `tags` (string) - Comma-separated list of tags (AND logic)
- `sourceKind` (string) - Filter by source: `url` or `manual`
- `sort` (string) - Sort field and direction:
  - `name-asc` | `name-desc`
  - `created-asc` | `created-desc`
  - `viewed-asc` | `viewed-desc`
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20, max: 100)

**Example:**
```bash
curl "http://localhost:3000/api/recipes?search=chicken&tags=dinner,quick&sort=created-desc&page=1&limit=10"
```

**Response:**
```json
{
  "data": {
    "recipes": [...],
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### Get Recipe
**GET** `/recipes/:id`

Get a single recipe by ID. Automatically marks the recipe as viewed.

**Example:**
```bash
curl "http://localhost:3000/api/recipes/507f1f77bcf86cd799439011"
```

**Response:**
```json
{
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Fluffy Pancakes",
    "prepTime": 10,
    "cookTime": 15,
    "totalTime": 25,
    "servings": 4,
    "ingredients": [
      {
        "name": "Dry Ingredients",
        "items": ["2 cups all-purpose flour", "..."]
      }
    ],
    "directions": [
      { "step": 1, "text": "Mix all dry ingredients..." }
    ],
    "tags": ["breakfast", "easy"],
    "notes": [],
    "sourceKind": "manual",
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### Create Recipe
**POST** `/recipes`

Create a new recipe manually.

**Request Body:**
```json
{
  "name": "My Recipe",
  "prepTime": 10,
  "cookTime": 20,
  "totalTime": 30,
  "servings": 4,
  "ingredients": [
    {
      "name": "Main Ingredients",
      "items": ["1 cup flour", "2 eggs"]
    }
  ],
  "directions": [
    { "step": 1, "text": "Mix ingredients..." },
    { "step": 2, "text": "Cook..." }
  ],
  "sourceKind": "manual",
  "tags": ["dinner", "easy"],
  "notes": ["Can be frozen"],
  "previewUrl": "https://example.com/image.jpg"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/recipes" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Recipe",
    "ingredients": [{"items": ["1 cup flour"]}],
    "directions": [{"step": 1, "text": "Mix"}],
    "sourceKind": "manual"
  }'
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "...",
    "name": "Test Recipe",
    ...
  }
}
```

---

### Update Recipe
**PUT** `/recipes/:id`

Update an existing recipe. All fields are optional except `id`.

**Request Body:** (same as Create, but all fields optional)

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/recipes/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name", "servings": 6}'
```

**Response:** `200 OK`

---

### Delete Recipe
**DELETE** `/recipes/:id`

Delete a recipe permanently.

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/recipes/507f1f77bcf86cd799439011"
```

**Response:**
```json
{
  "data": {
    "success": true,
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

### Create from URL
**POST** `/recipes/from-url`

Create a recipe by scraping a URL (stub - Phase 4).

**Request Body:**
```json
{
  "url": "https://budgetbytes.com/some-recipe/"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/recipes/from-url" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://budgetbytes.com/recipe/"}'
```

**Response:** `501 Not Implemented` (Phase 4)

---

### Get All Tags
**GET** `/recipes/tags`

Get all unique tags across all recipes (for autocomplete).

**Example:**
```bash
curl "http://localhost:3000/api/recipes/tags"
```

**Response:**
```json
{
  "data": ["breakfast", "dinner", "easy", "italian", "quick", "soup", "vegetarian"]
}
```

---

### Advanced Search
**GET** `/recipes/search?q=<query>`

Search recipes using advanced query syntax.

**Query Syntax:**
- `tag:dinner` - Filter by tag
- `tag:quick tag:easy` - Multiple tags (AND logic)
- `chicken` - Search by name
- `tag:dinner chicken` - Combined filters and search

**Query Parameters:**
- `q` (string, required) - Search query
- `page` (number) - Page number
- `limit` (number) - Items per page
- `sort` (string) - Sort order

**Example:**
```bash
curl "http://localhost:3000/api/recipes/search?q=tag:dinner+chicken&page=1&limit=10"
```

**Response:** Same as List Recipes

---

### Recently Viewed/Created
**GET** `/recipes/recent?type=<viewed|created>&limit=<number>`

Get recently viewed or created recipes.

**Query Parameters:**
- `type` (string) - `viewed` or `created` (default: `created`)
- `limit` (number) - Number of recipes (default: 10)

**Example:**
```bash
# Recently viewed
curl "http://localhost:3000/api/recipes/recent?type=viewed&limit=5"

# Recently created
curl "http://localhost:3000/api/recipes/recent?type=created&limit=10"
```

**Response:**
```json
{
  "data": [...]
}
```

---

## Menus

### List Menus
**GET** `/menus`

List all menus.

**Example:**
```bash
curl "http://localhost:3000/api/menus"
```

**Response:**
```json
{
  "data": [
    {
      "id": "...",
      "name": "Quick Weeknight Dinners",
      "recipeIds": ["...", "..."],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### Get Menu
**GET** `/menus/:id`

Get a single menu with populated recipe details.

**Example:**
```bash
curl "http://localhost:3000/api/menus/507f1f77bcf86cd799439011"
```

**Response:**
```json
{
  "data": {
    "id": "...",
    "name": "Quick Weeknight Dinners",
    "recipeIds": ["...", "..."],
    "recipes": [
      {
        "id": "...",
        "name": "Pasta Aglio e Olio",
        ...
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### Create Menu
**POST** `/menus`

Create a new menu.

**Request Body:**
```json
{
  "name": "My Menu",
  "recipeIds": ["507f1f77bcf86cd799439011", "..."]
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/menus" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekend Meals"}'
```

**Response:** `201 Created`

---

### Update Menu
**PUT** `/menus/:id`

Update a menu (name or recipe IDs).

**Request Body:**
```json
{
  "name": "Updated Name",
  "recipeIds": ["...", "..."]
}
```

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/menus/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

**Response:** `200 OK`

---

### Delete Menu
**DELETE** `/menus/:id`

Delete a menu permanently.

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/menus/507f1f77bcf86cd799439011"
```

**Response:**
```json
{
  "data": {
    "success": true,
    "id": "507f1f77bcf86cd799439011"
  }
}
```

---

### Add Recipe to Menu
**POST** `/menus/:id/recipes`

Add a recipe to a menu.

**Request Body:**
```json
{
  "recipeId": "507f1f77bcf86cd799439011"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/menus/MENU_ID/recipes" \
  -H "Content-Type: application/json" \
  -d '{"recipeId": "RECIPE_ID"}'
```

**Response:**
```json
{
  "data": {
    "id": "...",
    "name": "My Menu",
    "recipeIds": ["...", "RECIPE_ID"]
  }
}
```

---

### Remove Recipe from Menu
**DELETE** `/menus/:id/recipes/:recipeId`

Remove a recipe from a menu.

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/menus/MENU_ID/recipes/RECIPE_ID"
```

**Response:**
```json
{
  "data": {
    "id": "...",
    "name": "My Menu",
    "recipeIds": ["..."]
  }
}
```

---

### Reorder Recipes in Menu
**PUT** `/menus/:id/recipes`

Reorder recipes in a menu.

**Request Body:**
```json
{
  "recipeIds": ["RECIPE_ID_1", "RECIPE_ID_2", "RECIPE_ID_3"]
}
```

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/menus/MENU_ID/recipes" \
  -H "Content-Type: application/json" \
  -d '{"recipeIds": ["...","...","..."]}'
```

**Response:** `200 OK`

---

### Clear Menu
**POST** `/menus/:id/clear`

Remove all recipes from a menu.

**Example:**
```bash
curl -X POST "http://localhost:3000/api/menus/MENU_ID/clear"
```

**Response:**
```json
{
  "data": {
    "id": "...",
    "name": "My Menu",
    "recipeIds": []
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "error": "Validation Error",
  "message": "Invalid request data",
  "details": [
    {
      "field": "name",
      "message": "Recipe name is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Not Found",
  "message": "Recipe with id '123' not found"
}
```

### Duplicate Recipe (409)
```json
{
  "error": "Duplicate Recipe",
  "message": "A recipe from this URL already exists",
  "details": {
    "recipeId": "507f1f77bcf86cd799439011"
  }
}
```

### Server Error (500)
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Testing with curl

### Create a recipe
```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quick Omelette",
    "prepTime": 5,
    "cookTime": 5,
    "servings": 1,
    "ingredients": [
      {
        "items": [
          "2 eggs",
          "Salt and pepper",
          "1 tbsp butter"
        ]
      }
    ],
    "directions": [
      {"step": 1, "text": "Beat eggs with salt and pepper"},
      {"step": 2, "text": "Melt butter in pan over medium heat"},
      {"step": 3, "text": "Pour eggs and cook until set"}
    ],
    "sourceKind": "manual",
    "tags": ["breakfast", "quick", "easy"]
  }'
```

### Search recipes
```bash
# By name
curl "http://localhost:3000/api/recipes?search=chicken"

# By tags
curl "http://localhost:3000/api/recipes?tags=dinner,quick"

# Combined
curl "http://localhost:3000/api/recipes?search=pasta&tags=italian&sort=name-asc"

# Advanced search
curl "http://localhost:3000/api/recipes/search?q=tag:dinner+tag:quick+chicken"
```

### Create a menu
```bash
# Get recipe IDs first
RECIPE_IDS=$(curl -s "http://localhost:3000/api/recipes" | jq -r '.data.recipes[0:2] | .[].id' | tr '\n' ',' | sed 's/,$//')

# Create menu
curl -X POST http://localhost:3000/api/menus \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"My Test Menu\", \"recipeIds\": [\"$RECIPE_IDS\"]}"
```

---

## Next Steps

- **Phase 4:** Implement recipe scraping from URLs
- **Phase 5-6:** Build frontend UI components
- **Phase 7:** Add real-time updates with Socket.io
- **Phase 8-10:** Production deployment

For more information, see [REWRITE_PLAN.md](../REWRITE_PLAN.md).
