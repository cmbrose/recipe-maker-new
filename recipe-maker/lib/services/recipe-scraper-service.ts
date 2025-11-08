// Recipe scraper service
// Handles fetching and parsing recipes from URLs

import { createRecipe, getRecipeByUrl } from './recipe-service';
import { getScraperForUrl } from '../scrapers';
import { fetchHtml } from '../scrapers/utils';
import { UnsupportedSiteError, ParsingError, ScraperError } from '@/types/scraper';
import type { Recipe } from '@/types/recipe';

/**
 * Create a recipe from a URL by scraping it
 * Throws error if URL is already in database or scraping fails
 */
export async function createRecipeFromUrl(url: string): Promise<Recipe> {
  // Normalize URL
  const normalizedUrl = normalizeUrl(url);

  // Check if recipe already exists
  const existing = await getRecipeByUrl(normalizedUrl);
  if (existing) {
    throw new Error(`Recipe from this URL already exists (ID: ${existing.id})`);
  }

  // Get scraper for this URL
  const scraper = getScraperForUrl(normalizedUrl);
  if (!scraper) {
    throw new UnsupportedSiteError(normalizedUrl);
  }

  try {
    // Fetch HTML
    const html = await fetchHtml(normalizedUrl);

    // Parse recipe
    const scraped = await scraper.parser(html, normalizedUrl);

    // Validate required fields
    if (!scraped.name) {
      throw new ParsingError(normalizedUrl, scraper.name, 'Recipe name not found');
    }

    if (!scraped.ingredients || scraped.ingredients.length === 0) {
      throw new ParsingError(normalizedUrl, scraper.name, 'No ingredients found');
    }

    if (!scraped.directions || scraped.directions.length === 0) {
      throw new ParsingError(normalizedUrl, scraper.name, 'No directions found');
    }

    // Create recipe in database
    const recipe = await createRecipe({
      name: scraped.name,
      prepTime: scraped.prepTime,
      cookTime: scraped.cookTime,
      totalTime: scraped.totalTime,
      servings: scraped.servings,
      ingredients: scraped.ingredients,
      directions: scraped.directions,
      previewUrl: scraped.previewUrl,
      source: normalizedUrl,
      sourceKind: 'url',
      tags: [],
      notes: [],
    });

    return recipe;
  } catch (error) {
    if (error instanceof ScraperError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ParsingError(
        normalizedUrl,
        scraper.name,
        `Scraping failed: ${error.message}`
      );
    }

    throw new ParsingError(normalizedUrl, scraper.name, 'Unknown error occurred');
  }
}

/**
 * Normalize URL for consistent storage
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash and hash
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}
