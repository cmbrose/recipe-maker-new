/**
 * List Recipes MCP Tool
 * 
 * Allows querying recipes with filtering, sorting, and pagination.
 */

import { z } from 'zod';
import { getRecipe } from '@/lib/services/recipe-service';
import type { MCPTool } from '../types';

// Zod schema for type-safe arguments
const getRecipeSchema = z.object({
  id: z.string().describe('ID of the recipe to retrieve'),
});

// Tool definition
export const getRecipeTool: MCPTool<typeof getRecipeSchema> = {
  name: 'get_recipe',
  description: 'Retrieve the full details of a single recipe by its ID. The ID can be obtained from the list_recipes tool.',
  requiresAuth: false,
  inputSchema: getRecipeSchema,
  handler: async (args) => {
    const recipe = await getRecipe(args.id);

    if (!recipe) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({"error": "Recipe not found."}),
          },
        ],
      };
    }

    // Return result in MCP format
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
