/**
 * Update Recipe MCP Tool
 *
 * Allows updating an existing recipe by ID. Requires authentication.
 * For array-based properties, supports either replacing the entire array
 * or updating individual items by index.
 */

import { z } from 'zod';
import { getRecipe, updateRecipe } from '@/lib/services/recipe-service';
import type { MCPTool } from '../types';
import type { IngredientGroup, UpdateRecipeInput } from '@/types/recipe';

// Zod schema for ingredient groups
const ingredientGroupSchema = z.object({
  name: z.string().optional().describe('Optional section name for this ingredient group (e.g., "Sauce", "Dough")'),
  ingredients: z.array(z.string()).min(1).describe('List of ingredients in this group'),
});

// Schema for updating an individual item in a string array by index
const stringItemUpdateSchema = z.object({
  index: z.number().int().nonnegative().describe('Zero-based index of the item to update'),
  value: z.string().describe('New value for the item at the given index'),
});

// Schema for updating an individual ingredient group by index
const ingredientGroupUpdateSchema = z.object({
  index: z.number().int().nonnegative().describe('Zero-based index of the ingredient group to update'),
  value: ingredientGroupSchema.describe('New ingredient group value at the given index'),
});

// Zod schema for type-safe arguments
const updateRecipeSchema = z.object({
  id: z.string().min(1).describe('ID of the recipe to update'),
  name: z.string().min(1).optional().describe('New name of the recipe'),
  prepTime: z.string().optional().describe('Preparation time (e.g., "15 mins", "1 hour")'),
  cookTime: z.string().optional().describe('Cooking time (e.g., "30 mins", "45 mins")'),
  totalTime: z.string().optional().describe('Total time (e.g., "1 hour 15 mins")'),
  servings: z.string().optional().describe('Number of servings (e.g., "4 servings", "8-10 cookies")'),
  sourceKind: z.enum(['url', 'manual']).optional().describe('Source type: "url" if from a website, "manual" if created manually'),
  previewUrl: z.url().optional().describe('Optional URL to a preview image'),
  source: z.url().optional().describe('Optional source URL if recipe came from a website'),

  // Array fields - full replacement
  ingredients: z.array(ingredientGroupSchema).optional().describe('Replace all ingredient groups with this new list'),
  directions: z.array(z.string()).optional().describe('Replace all directions with this new list'),
  tags: z.array(z.string()).optional().describe('Replace all tags with this new list'),
  notes: z.array(z.string()).optional().describe('Replace all notes with this new list'),

  // Array fields - individual item updates (applied after full replacement if both are provided)
  ingredientUpdates: z.array(ingredientGroupUpdateSchema).optional().describe('Update individual ingredient groups by zero-based index. Applied after full replacement if both are provided.'),
  directionUpdates: z.array(stringItemUpdateSchema).optional().describe('Update individual directions by zero-based index. Applied after full replacement if both are provided.'),
  tagUpdates: z.array(stringItemUpdateSchema).optional().describe('Update individual tags by zero-based index. Applied after full replacement if both are provided.'),
  noteUpdates: z.array(stringItemUpdateSchema).optional().describe('Update individual notes by zero-based index. Applied after full replacement if both are provided.'),
});

/** Apply index-based updates to a string array, returning a new array. */
function applyStringUpdates(base: string[], updates: { index: number; value: string }[]): string[] {
  const result = [...base];
  for (const { index, value } of updates) {
    if (index < 0 || index >= result.length) {
      throw new Error(`Update index ${index} is out of bounds for array of length ${result.length}`);
    }
    result[index] = value;
  }
  return result;
}

/** Apply index-based updates to an ingredient group array, returning a new array. */
function applyIngredientUpdates(
  base: IngredientGroup[],
  updates: { index: number; value: IngredientGroup }[]
): IngredientGroup[] {
  const result = [...base];
  for (const { index, value } of updates) {
    if (index < 0 || index >= result.length) {
      throw new Error(`Update index ${index} is out of bounds for array of length ${result.length}`);
    }
    result[index] = value;
  }
  return result;
}

// Tool definition
export const updateRecipeTool: MCPTool<typeof updateRecipeSchema> = {
  name: 'update_recipe',
  description:
    'Update an existing recipe by ID. All fields are optional — only the provided fields will be changed. ' +
    'For array-based properties (ingredients, directions, tags, notes), you can either replace the entire array ' +
    'by providing the new full array, or update individual items by index using the corresponding *Updates fields ' +
    '(e.g., directionUpdates). If both are provided for the same property, the full array replacement is applied ' +
    'first, then the individual updates are applied on top of it.',
  inputSchema: updateRecipeSchema,
  handler: async (args) => {
    // Fetch the existing recipe so we can apply partial updates
    const existing = await getRecipe(args.id);
    if (!existing) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: 'Recipe not found.' }),
          },
        ],
        isError: true,
      };
    }

    // Resolve final array values:
    // Start from the existing value, apply full replacement if provided, then individual updates.
    let resolvedIngredients: IngredientGroup[];
    let resolvedDirections: string[];
    let resolvedTags: string[];
    let resolvedNotes: string[];

    try {
      resolvedIngredients = args.ingredients
        ? (args.ingredients as IngredientGroup[])
        : existing.ingredients;
      if (args.ingredientUpdates && args.ingredientUpdates.length > 0) {
        resolvedIngredients = applyIngredientUpdates(resolvedIngredients, args.ingredientUpdates as { index: number; value: IngredientGroup }[]);
      }

      resolvedDirections = args.directions ?? existing.directions;
      if (args.directionUpdates && args.directionUpdates.length > 0) {
        resolvedDirections = applyStringUpdates(resolvedDirections, args.directionUpdates);
      }

      resolvedTags = args.tags ?? existing.tags;
      if (args.tagUpdates && args.tagUpdates.length > 0) {
        resolvedTags = applyStringUpdates(resolvedTags, args.tagUpdates);
      }

      resolvedNotes = args.notes ?? existing.notes;
      if (args.noteUpdates && args.noteUpdates.length > 0) {
        resolvedNotes = applyStringUpdates(resolvedNotes, args.noteUpdates);
      }
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to apply updates' }),
          },
        ],
        isError: true,
      };
    }

    // Build the update input, only including scalar fields that were explicitly provided
    const input: UpdateRecipeInput = {
      id: args.id,
      ...(args.name !== undefined && { name: args.name }),
      ...(args.prepTime !== undefined && { prepTime: args.prepTime }),
      ...(args.cookTime !== undefined && { cookTime: args.cookTime }),
      ...(args.totalTime !== undefined && { totalTime: args.totalTime }),
      ...(args.servings !== undefined && { servings: args.servings }),
      ...(args.sourceKind !== undefined && { sourceKind: args.sourceKind }),
      ...(args.previewUrl !== undefined && { previewUrl: args.previewUrl }),
      ...(args.source !== undefined && { source: args.source }),
      // Always include resolved arrays (they default to the existing values above)
      ingredients: resolvedIngredients,
      directions: resolvedDirections,
      tags: resolvedTags,
      notes: resolvedNotes,
    };

    const recipe = await updateRecipe(input);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Recipe updated successfully',
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
