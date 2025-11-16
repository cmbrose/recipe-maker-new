// GET /api/recipes - List recipes with filtering and pagination
// POST /api/recipes - Create a new recipe

import { NextRequest } from 'next/server';
import { listRecipes, createRecipe } from '@/lib/services/recipe-service';
import { CreateRecipeSchema, RecipeFiltersSchema } from '@/lib/utils/validation';
import {
  successResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';
import { requireAuth } from '@/lib/utils/auth';

/**
 * GET /api/recipes
 * List recipes with optional filtering, sorting, and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const rawFilters: Record<string, string | string[] | number | undefined> = {};

  if (searchParams.has('search')) {
    rawFilters.search = searchParams.get('search') || undefined;
  }

  if (searchParams.has('tags')) {
    // Tags can be comma-separated
    rawFilters.tags = searchParams.get('tags')?.split(',').filter(Boolean);
  }

  if (searchParams.has('sourceKind')) {
    rawFilters.sourceKind = searchParams.get('sourceKind') || undefined;
  }

  if (searchParams.has('sort')) {
    rawFilters.sort = searchParams.get('sort') || undefined;
  }

  if (searchParams.has('page')) {
    rawFilters.page = parseInt(searchParams.get('page') || '1', 10);
  }

  if (searchParams.has('limit')) {
    rawFilters.limit = parseInt(searchParams.get('limit') || '20', 10);
  }

  // Validate filters
  const validation = RecipeFiltersSchema.safeParse(rawFilters);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Fetch recipes
  const result = await listRecipes(validation.data);

  return successResponse(result);
});

/**
 * POST /api/recipes
 * Create a new recipe manually
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // Require authentication
  const authError = await requireAuth();
  if (authError) return authError;

  const body = await request.json();

  // Validate input
  const validation = CreateRecipeSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Create recipe
  const recipe = await createRecipe(validation.data);

  return successResponse(recipe, 201);
});
