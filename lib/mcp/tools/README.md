# MCP Tools

This directory contains the individual tool implementations for the Model Context Protocol (MCP) server.

Each tool is a self-contained module that exports an `MCPTool` object with:
- `name`: The tool's identifier
- `description`: Human-readable description
- `inputSchema`: Zod schema for validating arguments
- `handler`: Async function that executes the tool

## Available Tools

### `list-recipes.ts`
Lists recipes with filtering, sorting, and pagination. No authentication required.

### `get-recipe.ts`
Retrieves full details of a single recipe by ID. No authentication required.

### `create-recipe.ts`
Creates a new recipe. **Requires authentication** - add tool name to `toolsRequiringAuth` array in `/app/api/mcp/route.ts`.

## Adding a New Tool

1. Create a new file in this directory (e.g., `my-tool.ts`)
2. Define the Zod input schema with descriptions
3. Implement the handler function
4. Export the tool object
5. Add it to the registry in `../tools.ts`
6. If it requires auth, add the tool name to `toolsRequiringAuth` in `/app/api/mcp/route.ts`
7. Update `/MCP_INTEGRATION.md` with documentation

Example:

```typescript
import { z } from 'zod';
import type { MCPTool } from '../types';

const myToolSchema = z.object({
  param: z.string().describe('Description of parameter'),
});

export const myTool: MCPTool<typeof myToolSchema> = {
  name: 'my_tool',
  description: 'What this tool does',
  requiresAuthentication: false,
  inputSchema: myToolSchema,
  handler: async (args) => {
    // Implementation here
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ result: 'success' }, null, 2),
        },
      ],
    };
  },
};
```

## Authentication

Some tools require authentication. The authentication check is performed in `/app/api/mcp/route.ts` in the `handleToolCall` function.

To require authentication for a tool simply set `requiresAuth: true` in its McpTool definition.

## Return Format

All tools should return results in the MCP content format:

```typescript
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify(data, null, 2),
    },
  ],
};
```

For errors, include `isError: true`:

```typescript
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify({ error: 'Error message' }, null, 2),
    },
  ],
  isError: true,
};
```
