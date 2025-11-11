// Scraper utility functions

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { IngredientGroup } from '@/types/recipe';

/**
 * Parse time string to minutes
 * Examples: "30 minutes", "1 hour", "1 hour 30 minutes", "PT30M"
 */
export function parseTime(timeStr: string | null | undefined): string | null | undefined {
  return timeStr;
}

/**
 * Parse servings string to number
 * Examples: "4", "4 servings", "serves 4", "4-6 servings"
 */
export function parseServings(servingsStr: string | null | undefined): string | null | undefined {
  return servingsStr
}

/**
 * Clean text by removing extra whitespace and normalizing
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Extract text from element, handling nested elements
 */
export function extractText($: cheerio.CheerioAPI, element: cheerio.Cheerio<AnyNode>): string {
  return cleanText(element.text());
}

/**
 * Get best image URL from srcset
 * Picks the highest resolution image
 */
export function getBestImageUrl(
  $: cheerio.CheerioAPI,
  imgElement: cheerio.Cheerio<AnyNode>
): string | undefined {
  const srcset = imgElement.attr('srcset');
  const src = imgElement.attr('src');

  if (srcset) {
    // Parse srcset and get highest resolution
    const sources = srcset.split(',').map((s) => {
      const parts = s.trim().split(/\s+/);
      const url = parts[0];
      const width = parts[1]?.replace(/w$/, '');
      return { url, width: width ? parseInt(width) : 0 };
    });

    // Sort by width descending and get first
    sources.sort((a, b) => b.width - a.width);
    return sources[0]?.url;
  }

  return src;
}

/**
 * Convert list of ingredient strings to grouped format
 */
export function groupIngredients(items: string[]): IngredientGroup[] {
  return [{ items }];
}

/**
 * Create directions from list of strings
 */
export function createDirections(steps: string[]): string[] {
  return steps.map((text) => cleanText(text)).filter(Boolean);
}

/**
 * Fetch HTML from URL with proper headers
 */
export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Load HTML with Cheerio
 */
export function loadHtml(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}
