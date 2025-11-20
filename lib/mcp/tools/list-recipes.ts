/**
 * List Recipes MCP Tool
 * 
 * Allows querying recipes with filtering, sorting, and pagination.
 */

import { z } from 'zod';
import { listRecipes } from '@/lib/services/recipe-service';
import type { RecipeFilters } from '@/types/recipe';
import type { MCPTool } from '../types';

// Zod schema for type-safe arguments
const listRecipesSchema = z.object({
  search: z.string().optional().describe('Search term to filter recipes by name (case-insensitive)'),
  tags: z.array(z.string()).optional().describe('Filter recipes that have ALL of these tags'),
  sourceKind: z.enum(['url', 'manual']).optional().describe('Filter by recipe source type'),
  sort: z.enum(['created-desc', 'created-asc', 'name-desc', 'name-asc', 'viewed-desc', 'viewed-asc'])
    .optional()
    .default('created-desc')
    .describe('Sort order for results'),
  page: z.number().int().min(1).optional().default(1).describe('Page number for pagination (1-indexed)'),
  limit: z.number().int().min(1).max(100).optional().default(20).describe('Number of recipes per page'),
});

// Tool definition
export const listRecipesTool: MCPTool<typeof listRecipesSchema> = {
  name: 'list_recipes',
  description: 'List recipes with optional filtering, sorting, and pagination. Returns recipes matching the specified criteria.',
  requiresAuth: false,
  inputSchema: listRecipesSchema,
  handler: async (args) => {
    // Args are automatically typed as z.infer<typeof listRecipesSchema>
    const filters: RecipeFilters = {
      search: args.search,
      tags: args.tags,
      sourceKind: args.sourceKind,
      sort: args.sort || 'created-desc',
      page: args.page || 1,
      limit: args.limit || 20,
    };

    // Call the recipe service
    const result = await listRecipes(filters);

    const condensedRecipes = result.recipes.map(recipe => {
      let totalTime = recipe.totalTime;
      if (!totalTime) {
        totalTime = (recipe.prepTime ? `${recipe.prepTime} + ` : '') + (recipe.cookTime || '');
      }

      const data = {
        id: recipe.id,
        name: recipe.name,
        tags: recipe.tags,
        sourceKind: recipe.sourceKind,
        source: recipe.source,
        previewUrl: recipe.previewUrl,
        totalTime,
        servings: recipe.servings,
      }

      // Remove undefined fields
      Object.keys(data).forEach(key => 
        data[key as keyof typeof data] === undefined && delete data[key as keyof typeof data]
      );

      return data;
    });

    const condensedResult = {
      ...result,
      recipes: condensedRecipes,
    };

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(condensedResult, null, 2),
        },
      ],
    };
  },
};
