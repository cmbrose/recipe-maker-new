// GET /api/recipes/[id] - Get single recipe
// PUT /api/recipes/[id] - Update recipe
// DELETE /api/recipes/[id] - Delete recipe

import { NextRequest } from 'next/server';
import {
  getRecipe,
  updateRecipe,
  deleteRecipe,
  markRecipeAsViewed,
} from '@/lib/services/recipe-service';
import { UpdateRecipeSchema } from '@/lib/utils/validation';
import {
  successResponse,
  notFoundResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/recipes/[id]
 * Get a single recipe by ID and mark it as viewed
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    const recipe = await getRecipe(id);

    if (!recipe) {
      return notFoundResponse('Recipe', id);
    }

    // Mark as viewed (async, don't wait)
    markRecipeAsViewed(id).catch(console.error);

    return successResponse(recipe);
  }
);

/**
 * PUT /api/recipes/[id]
 * Update a recipe
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = UpdateRecipeSchema.safeParse({
      id,
      ...body,
    });

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Check if recipe exists
    const existing = await getRecipe(id);
    if (!existing) {
      return notFoundResponse('Recipe', id);
    }

    // Update recipe
    const recipe = await updateRecipe(validation.data);

    return successResponse(recipe);
  }
);

/**
 * DELETE /api/recipes/[id]
 * Delete a recipe
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    // Check if recipe exists
    const existing = await getRecipe(id);
    if (!existing) {
      return notFoundResponse('Recipe', id);
    }

    // Delete recipe
    await deleteRecipe(id);

    return successResponse({ success: true, id });
  }
);
