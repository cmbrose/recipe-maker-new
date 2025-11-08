// GET /api/recipes/tags - Get all unique tags

import { getAllTags } from '@/lib/services/recipe-service';
import { successResponse, withErrorHandling } from '@/lib/utils/api-response';

/**
 * GET /api/recipes/tags
 * Get all unique tags across all recipes (for autocomplete)
 */
export const GET = withErrorHandling(async () => {
  const tags = await getAllTags();
  return successResponse(tags);
});
