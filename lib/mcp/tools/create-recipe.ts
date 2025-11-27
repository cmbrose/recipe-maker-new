/**
 * Create Recipe MCP Tool
 * 
 * Allows creating a new recipe. Requires authentication.
 */

import { z } from 'zod';
import { createRecipe } from '@/lib/services/recipe-service';
import type { MCPTool } from '../types';
import type { CreateRecipeInput, IngredientGroup } from '@/types/recipe';

// Zod schema for ingredient groups
const ingredientGroupSchema = z.object({
  name: z.string().optional().describe('Optional section name for this ingredient group (e.g., "Sauce", "Dough")'),
  ingredients: z.array(z.string()).min(1).describe('List of ingredients in this group'),
});

// Zod schema for type-safe arguments
const createRecipeSchema = z.object({
  name: z.string().min(1).describe('Name of the recipe'),
  prepTime: z.string().optional().describe('Preparation time (e.g., "15 mins", "1 hour")'),
  cookTime: z.string().optional().describe('Cooking time (e.g., "30 mins", "45 mins")'),
  totalTime: z.string().optional().describe('Total time (e.g., "1 hour 15 mins")'),
  servings: z.string().optional().describe('Number of servings (e.g., "4 servings", "8-10 cookies")'),
  ingredients: z.array(ingredientGroupSchema).min(1).describe('List of ingredient groups. Each group can have an optional name and a list of ingredients'),
  directions: z.array(z.string()).min(1).describe('Step-by-step cooking directions'),
  previewUrl: z.url().optional().describe('Optional URL to a preview image'),
  source: z.url().optional().describe('Optional source URL if recipe came from a website'),
  sourceKind: z.enum(['url', 'manual']).default('manual').describe('Source type: "url" if from a website, "manual" if created manually'),
  tags: z.array(z.string()).optional().default([]).describe('Optional list of tags for categorization (e.g., ["dinner", "vegetarian", "quick"])'),
  notes: z.array(z.string()).optional().default([]).describe('Optional notes about the recipe'),
});

// Tool definition
export const createRecipeTool: MCPTool<typeof createRecipeSchema> = {
  name: 'create_recipe',
  description: 'Create a new recipe. Requires authentication. Returns the created recipe with its assigned ID.',
  inputSchema: createRecipeSchema,
  handler: async (args) => {
    // Args are automatically typed as z.infer<typeof createRecipeSchema>
    const input: CreateRecipeInput = {
      name: args.name,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      totalTime: args.totalTime,
      servings: args.servings,
      ingredients: args.ingredients as IngredientGroup[],
      directions: args.directions,
      previewUrl: args.previewUrl,
      source: args.source,
      sourceKind: args.sourceKind,
      tags: args.tags,
      notes: args.notes,
    };

    // Create the recipe
    const recipe = await createRecipe(input);

    // Return result in MCP format
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Recipe created successfully',
            recipe: {
              id: recipe.id,
              name: recipe.name,
              tags: recipe.tags,
              sourceKind: recipe.sourceKind,
              browserUrl: `https://brose-recipes.com/recipes/${recipe.id}`,
            },
          }, null, 2),
        },
      ],
    };
  },
};
