// GET /api/menus - List all menus
// POST /api/menus - Create a new menu

import { NextRequest } from 'next/server';
import { listMenus, createMenu } from '@/lib/services/menu-service';
import { CreateMenuSchema } from '@/lib/utils/validation';
import {
  successResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';

/**
 * GET /api/menus
 * List all menus
 */
export const GET = withErrorHandling(async () => {
  const menus = await listMenus();
  return successResponse(menus);
});

/**
 * POST /api/menus
 * Create a new menu
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  // Validate input
  const validation = CreateMenuSchema.safeParse(body);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  // Create menu
  const menu = await createMenu(validation.data);

  return successResponse(menu, 201);
});
