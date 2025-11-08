// GET /api/recipes/recent - Get recently viewed or created recipes

import { NextRequest } from 'next/server';
import {
  getRecentlyViewedRecipes,
  getRecentlyCreatedRecipes,
} from '@/lib/services/recipe-service';
import { successResponse, withErrorHandling } from '@/lib/utils/api-response';

/**
 * GET /api/recipes/recent?type=viewed&limit=10
 * Get recently viewed or created recipes
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'created';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  let recipes;

  if (type === 'viewed') {
    recipes = await getRecentlyViewedRecipes(limit);
  } else {
    recipes = await getRecentlyCreatedRecipes(limit);
  }

  return successResponse(recipes);
});
