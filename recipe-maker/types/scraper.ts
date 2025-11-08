// Recipe scraper type definitions

import { IngredientGroup, Direction } from './recipe';

/**
 * Result from scraping a recipe URL
 */
export interface RecipeScraperResult {
  name: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: IngredientGroup[];
  directions: Direction[];
  previewUrl?: string;
}

/**
 * Recipe scraper configuration
 */
export interface ScraperConfig {
  domain: string;           // Domain this scraper handles (e.g., "budgetbytes.com")
  name: string;             // Display name (e.g., "Budget Bytes")
  parser: (html: string, url: string) => Promise<RecipeScraperResult>;
}

/**
 * Scraping error types
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly scraperName?: string
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

export class UnsupportedSiteError extends ScraperError {
  constructor(url: string) {
    super(`No scraper available for this URL`, url);
    this.name = 'UnsupportedSiteError';
  }
}

export class ParsingError extends ScraperError {
  constructor(url: string, scraperName: string, details?: string) {
    super(
      `Failed to parse recipe${details ? `: ${details}` : ''}`,
      url,
      scraperName
    );
    this.name = 'ParsingError';
  }
}
