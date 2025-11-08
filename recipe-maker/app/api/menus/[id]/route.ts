// GET /api/menus/[id] - Get single menu with recipes
// PUT /api/menus/[id] - Update menu
// DELETE /api/menus/[id] - Delete menu

import { NextRequest } from 'next/server';
import {
  getMenuWithRecipes,
  updateMenu,
  deleteMenu,
} from '@/lib/services/menu-service';
import { UpdateMenuSchema } from '@/lib/utils/validation';
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
 * GET /api/menus/[id]
 * Get a single menu with populated recipe details
 */
export const GET = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    const menu = await getMenuWithRecipes(id);

    if (!menu) {
      return notFoundResponse('Menu', id);
    }

    return successResponse(menu);
  }
);

/**
 * PUT /api/menus/[id]
 * Update a menu
 */
export const PUT = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validation = UpdateMenuSchema.safeParse({
      id,
      ...body,
    });

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    // Update menu
    const menu = await updateMenu(validation.data);

    return successResponse(menu);
  }
);

/**
 * DELETE /api/menus/[id]
 * Delete a menu
 */
export const DELETE = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id } = await params;
    // Delete menu (will throw if not found)
    await deleteMenu(id);

    return successResponse({ success: true, id });
  }
);
