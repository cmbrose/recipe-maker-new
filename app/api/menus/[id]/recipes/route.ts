// POST /api/menus/[id]/recipes - Add recipe to menu
// PUT /api/menus/[id]/recipes - Reorder recipes in menu

import { NextRequest } from 'next/server';
import {
  addRecipeToMenu,
  reorderMenuRecipes,
} from '@/lib/services/menu-service';
import { z } from 'zod';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';
import { requireUserSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const AddRecipeSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID is required'),
});

const ReorderRecipesSchema = z.object({
  recipeIds: z.array(z.string()).min(1, 'At least one recipe ID is required'),
});

/**
 * POST /api/menus/[id]/recipes
 * Add a recipe to a menu
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireUserSession();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = AddRecipeSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    try {
      const menu = await addRecipeToMenu(id, validation.data.recipeId);
      return successResponse(menu);
    } catch (error) {
      if (error instanceof Error && error.message === 'Menu not found') {
        return errorResponse('Not Found', `Menu with id '${id}' not found`, 404);
      }
      throw error;
    }
  }
);

/**
 * PUT /api/menus/[id]/recipes
 * Reorder recipes in a menu
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireUserSession();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = ReorderRecipesSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const menu = await reorderMenuRecipes(id, validation.data.recipeIds);
    return successResponse(menu);
  }
);
