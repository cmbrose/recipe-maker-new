// GET /api/recipes - List recipes with filtering and pagination
// POST /api/recipes - Create a new recipe

import { NextRequest } from 'next/server';
import { listRecipes, createRecipe } from '@/lib/services/recipe-service';
import { CreateRecipeSchema, RecipeFiltersSchema } from '@/lib/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';

/**
 * GET /api/recipes
 * List recipes with optional filtering, sorting, and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const filters: any = {};

  if (searchParams.has('search')) {
    filters.search = searchParams.get('search');
  }

  if (searchParams.has('tags')) {
    // Tags can be comma-separated
    filters.tags = searchParams.get('tags')?.split(',').filter(Boolean);
  }

  if (searchParams.has('sourceKind')) {
    filters.sourceKind = searchParams.get('sourceKind');
  }

  if (searchParams.has('sort')) {
    filters.sort = searchParams.get('sort');
  }

  if (searchParams.has('page')) {
    filters.page = parseInt(searchParams.get('page') || '1', 10);
  }

  if (searchParams.has('limit')) {
    filters.limit = parseInt(searchParams.get('limit') || '20', 10);
  }

  // Validate filters
  const validation = RecipeFiltersSchema.safeParse(filters);
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
