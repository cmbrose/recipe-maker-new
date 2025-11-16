// POST /api/menus/[id]/clear - Remove all recipes from menu

import { NextRequest } from 'next/server';
import { clearMenu } from '@/lib/services/menu-service';
import {
  successResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';
import { requireUserSession } from '@/lib/auth/session';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/menus/[id]/clear
 * Remove all recipes from a menu
 */
export const POST = withErrorHandling(
  async (request: NextRequest, { params }: RouteParams) => {
    await requireUserSession();
    const { id } = await params;
    const menu = await clearMenu(id);
    return successResponse(menu);
  }
);
