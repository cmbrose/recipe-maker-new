// Recipe scraper registry
// Maps domains to their respective scrapers

import type { ScraperConfig } from '@/types/scraper';
import { scrapeAllRecipes } from './allrecipes';
import { scrapeBudgetBytes } from './budget-bytes';
import { scrapeSkinnyTaste } from './skinny-taste';
import { scrapeHalfBakedHarvest } from './half-baked-harvest';
import { scrapeLoveAndLemons } from './love-and-lemons';
import { scrapeSallysBakingAddiction } from './sallys-baking-addiction';
import { scrapeKingArthur } from './king-arthur';
import { scrapeMinimalistBaker } from './minimalist-baker';
import { scrapeYummyToddlerFood } from './yummy-toddler-food';

/**
 * Registry of all supported recipe scrapers
 */
export const SCRAPERS: ScraperConfig[] = [
  {
    domain: 'allrecipes.com',
    name: 'AllRecipes',
    parser: scrapeAllRecipes,
  },
  {
    domain: 'budgetbytes.com',
    name: 'Budget Bytes',
    parser: scrapeBudgetBytes,
  },
  {
    domain: 'skinnytaste.com',
    name: 'Skinny Taste',
    parser: scrapeSkinnyTaste,
  },
  {
    domain: 'halfbakedharvest.com',
    name: 'Half Baked Harvest',
    parser: scrapeHalfBakedHarvest,
  },
  {
    domain: 'loveandlemons.com',
    name: 'Love and Lemons',
    parser: scrapeLoveAndLemons,
  },
  {
    domain: 'sallysbakingaddiction.com',
    name: "Sally's Baking Addiction",
    parser: scrapeSallysBakingAddiction,
  },
  {
    domain: 'kingarthurbaking.com',
    name: 'King Arthur Baking',
    parser: scrapeKingArthur,
  },
  {
    domain: 'minimalistbaker.com',
    name: 'Minimalist Baker',
    parser: scrapeMinimalistBaker,
  },
  {
    domain: 'yummytoddlerfood.com',
    name: 'Yummy Toddler Food',
    parser: scrapeYummyToddlerFood,
  },
];

/**
 * Get scraper for a given URL
 */
export function getScraperForUrl(url: string): ScraperConfig | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    return SCRAPERS.find((scraper) => hostname.includes(scraper.domain)) || null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is supported
 */
export function isUrlSupported(url: string): boolean {
  return getScraperForUrl(url) !== null;
}

/**
 * Get list of supported domains
 */
export function getSupportedDomains(): string[] {
  return SCRAPERS.map((s) => s.domain);
}
