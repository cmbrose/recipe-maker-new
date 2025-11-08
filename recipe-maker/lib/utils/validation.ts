// Validation utilities using Zod

import { z } from 'zod';

/**
 * Ingredient group schema
 */
export const IngredientGroupSchema = z.object({
  name: z.string().optional(),
  items: z.array(z.string().min(1)),
});

/**
 * Recipe creation schema
 */
export const CreateRecipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required'),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  totalTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  ingredients: z.array(IngredientGroupSchema).min(1, 'At least one ingredient group is required'),
  directions: z.array(z.string().min(1)).min(1, 'At least one direction is required'),
  previewUrl: z.url().optional().or(z.literal('')),
  source: z.url().optional().or(z.literal('')),
  sourceKind: z.enum(['url', 'manual']),
  tags: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

/**
 * Recipe update schema (all fields optional except ID)
 */
export const UpdateRecipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  prepTime: z.number().int().positive().optional(),
  cookTime: z.number().int().positive().optional(),
  totalTime: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  ingredients: z.array(IngredientGroupSchema).optional(),
  directions: z.array(z.string().min(1)).optional(),
  previewUrl: z.url().optional().or(z.literal('')),
  source: z.url().optional().or(z.literal('')),
  sourceKind: z.enum(['url', 'manual']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
  lastViewed: z.date().optional(),
});

/**
 * Recipe filters schema
 */
export const RecipeFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sourceKind: z.enum(['url', 'manual']).optional(),
  sort: z.enum([
    'name-asc',
    'name-desc',
    'created-asc',
    'created-desc',
    'viewed-asc',
    'viewed-desc',
  ]).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

/**
 * Menu creation schema
 */
export const CreateMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required'),
  recipeIds: z.array(z.string()).optional(),
});

/**
 * Menu update schema
 */
export const UpdateMenuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  recipeIds: z.array(z.string()).optional(),
});

/**
 * URL validation
 */
export const UrlSchema = z.string().url('Invalid URL');

/**
 * Validate and parse data with a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validate and parse data, returning errors if validation fails
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}
