// POST /api/recipes/from-url - Create recipe from URL (scraping)

import { NextRequest } from 'next/server';
import { createRecipeFromUrl } from '@/lib/services/recipe-scraper-service';
import { getSupportedDomains } from '@/lib/scrapers';
import { UrlSchema } from '@/lib/utils/validation';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  withErrorHandling,
} from '@/lib/utils/api-response';
import { UnsupportedSiteError, ParsingError, ScraperError } from '@/types/scraper';

/**
 * POST /api/recipes/from-url
 * Create a recipe by scraping a URL
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  // Validate URL
  const validation = UrlSchema.safeParse(body.url);
  if (!validation.success) {
    return validationErrorResponse(validation.error);
  }

  const url = validation.data;

  try {
    // Scrape and create recipe
    const recipe = await createRecipeFromUrl(url);

    return successResponse(recipe, 201);
  } catch (error) {
    // Handle scraper-specific errors
    if (error instanceof UnsupportedSiteError) {
      return errorResponse(
        'Unsupported Site',
        'This recipe site is not yet supported',
        400,
        {
          url,
          supportedSites: getSupportedDomains(),
        }
      );
    }

    if (error instanceof ParsingError) {
      return errorResponse(
        'Parsing Error',
        error.message,
        400,
        {
          url,
          site: error.scraperName,
        }
      );
    }

    if (error instanceof ScraperError) {
      return errorResponse('Scraper Error', error.message, 400, { url });
    }

    // Handle duplicate recipe error
    if (error instanceof Error && error.message.includes('already exists')) {
      const match = error.message.match(/ID: ([a-f0-9]+)/);
      const recipeId = match?.[1];

      return errorResponse(
        'Duplicate Recipe',
        'A recipe from this URL already exists',
        409,
        { recipeId }
      );
    }

    // Re-throw for general error handler
    throw error;
  }
});
