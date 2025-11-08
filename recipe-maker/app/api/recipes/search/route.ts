// GET /api/recipes/search - Advanced search with query syntax

import { NextRequest } from 'next/server';
import { searchRecipesByQuery } from '@/lib/services/recipe-service';
import {
  successResponse,
  errorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';

/**
 * GET /api/recipes/search?q=tag:dinner chicken
 * Search recipes using advanced query syntax
 * Supports: "tag:dinner tag:quick chicken soup"
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return errorResponse(
      'Missing Query',
      'Query parameter "q" is required',
      400
    );
  }

  // Parse pagination
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const sort = searchParams.get('sort') || 'created-desc';

  // Search recipes
  const result = await searchRecipesByQuery(query, { page, limit, sort: sort as any });

  return successResponse(result);
});
