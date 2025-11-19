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

// JSON Schema for MCP protocol
const listRecipesJsonSchema = {
  type: 'object',
  properties: {
    search: {
      type: 'string',
      description: 'Search term to filter recipes by name (case-insensitive)',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter recipes that have ALL of these tags',
    },
    sourceKind: {
      type: 'string',
      enum: ['url', 'manual'],
      description: 'Filter by recipe source type',
    },
    sort: {
      type: 'string',
      enum: ['created-desc', 'created-asc', 'name-desc', 'name-asc', 'viewed-desc', 'viewed-asc'],
      description: 'Sort order for results',
      default: 'created-desc',
    },
    page: {
      type: 'number',
      description: 'Page number for pagination (1-indexed)',
      default: 1,
      minimum: 1,
    },
    limit: {
      type: 'number',
      description: 'Number of recipes per page',
      default: 20,
      minimum: 1,
      maximum: 100,
    },
  },
};

// Tool definition
export const listRecipesTool: MCPTool<typeof listRecipesSchema> = {
  name: 'list_recipes',
  description: 'List recipes with optional filtering, sorting, and pagination. Returns recipes matching the specified criteria.',
  inputSchema: listRecipesSchema,
  jsonSchema: listRecipesJsonSchema,
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

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
