# MCP (Model Context Protocol) Tools

This directory contains the Model Context Protocol tool definitions for the Recipe Maker application.

## Structure

```
lib/mcp/
├── types.ts              # TypeScript type definitions for MCP protocol
├── tools.ts              # Registry of all available MCP tools
└── tools/
    ├── list-recipes.ts   # List recipes tool implementation
    └── ...               # Additional tools go here
```

## Adding a New Tool

To add a new MCP tool, follow these steps:

### 1. Create a new tool file in `lib/mcp/tools/`

Example: `lib/mcp/tools/get-recipe.ts`

```typescript
import { z } from 'zod';
import type { MCPTool } from '../types';
import { getRecipe } from '@/lib/services/recipe-service';

// Define Zod schema for type-safe arguments
const getRecipeSchema = z.object({
  id: z.string().describe('The recipe ID to retrieve'),
});

// Define JSON Schema for MCP protocol
const getRecipeJsonSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'The recipe ID to retrieve',
    },
  },
  required: ['id'],
};

// Export the tool definition
export const getRecipeTool: MCPTool<typeof getRecipeSchema> = {
  name: 'get_recipe',
  description: 'Get a single recipe by ID with full details.',
  inputSchema: getRecipeSchema,
  jsonSchema: getRecipeJsonSchema,
  handler: async (args) => {
    // Handler is type-safe - args has proper types from Zod schema
    const recipe = await getRecipe(args.id);
    
    if (!recipe) {
      throw new Error(`Recipe not found: ${args.id}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(recipe, null, 2),
        },
      ],
    };
  },
};
```

### 2. Register the tool in `lib/mcp/tools.ts`

```typescript
import { getRecipeTool } from './tools/get-recipe';

export const MCP_TOOLS: MCPTool[] = [
  listRecipesTool,
  getRecipeTool,  // Add your new tool here
  // ... more tools
];
```

### 3. That's it!

The tool is now automatically:
- ✅ Available via the `/api/mcp` endpoint
- ✅ Listed in `tools/list` responses
- ✅ Callable via `tools/call` with validation
- ✅ Type-safe in the handler

## Key Concepts

### Zod Schema
- Provides runtime validation
- Generates TypeScript types via `z.infer<typeof schema>`
- Documents field descriptions

### JSON Schema
- Required for MCP protocol `tools/list` response
- Manually defined to match Zod schema
- Could be auto-generated but manual definition gives more control

### MCPTool Interface
- `name`: Unique identifier for the tool
- `description`: Human-readable description
- `inputSchema`: Zod schema for validation
- `jsonSchema`: JSON Schema for MCP protocol
- `handler`: Type-safe function that executes the tool

## Testing

Test your tools using curl:

```bash
# List all tools
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call a tool
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"list_recipes",
      "arguments":{"limit":5}
    }
  }'
```

## Benefits of This Structure

1. **Separation of Concerns**: Tool definitions are separate from route handling
2. **Type Safety**: Zod provides both runtime validation and compile-time types
3. **Easy to Extend**: Adding tools is straightforward and documented
4. **Testable**: Each tool can be tested independently
5. **Maintainable**: All tools in one place, easy to find and modify
