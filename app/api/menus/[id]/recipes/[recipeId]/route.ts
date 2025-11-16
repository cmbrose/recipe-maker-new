// DELETE /api/menus/[id]/recipes/[recipeId] - Remove recipe from menu

import { NextRequest } from 'next/server';
import { removeRecipeFromMenu } from '@/lib/services/menu-service';
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';
import { requireUserSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{
    id: string;
    recipeId: string;
  }>;
}

/**
 * DELETE /api/menus/[id]/recipes/[recipeId]
 * Remove a recipe from a menu
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireUserSession();
    const { id, recipeId } = await params;
    try {
      const menu = await removeRecipeFromMenu(id, recipeId);
      return successResponse(menu);
    } catch (error) {
      if (error instanceof Error && error.message === 'Menu not found') {
        return errorResponse('Not Found', `Menu with id '${id}' not found`, 404);
      }
      throw error;
    }
  }
);
