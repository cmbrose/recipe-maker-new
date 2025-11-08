// King Arthur Baking recipe scraper
// Uses custom King Arthur structure

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  parseTime,
  parseServings,
  cleanText,
  createDirections,
} from './utils';

export async function scrapeKingArthur(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Find the main content
  const root = $('.page main').first();

  if (!root.length) {
    throw new Error('Recipe container not found');
  }

  const quickviewContent = root.find('.page-content-header .quickview__content').first();

  // Extract name
  const name = cleanText(quickviewContent.find('h1 span').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTimeText = quickviewContent.find('.stat__item--prep span').text();
  const cookTimeText = quickviewContent.find('.stat__item--bake span').text();
  const totalTimeText = quickviewContent.find('.stat__item--total span').text();

  const prepTime = parseTime(prepTimeText);
  const cookTime = parseTime(cookTimeText);
  const totalTime = parseTime(totalTimeText);

  // Extract servings
  const servingsText = quickviewContent.find('.stat__item--yield span').text();
  const servings = parseServings(servingsText);

  // Extract preview image
  let previewUrl: string | undefined;
  const imgElement = root.find('.page-content-header .quickview__media img').first();

  if (imgElement.length) {
    previewUrl =
      imgElement.attr('data-lazy-srcset') ||
      imgElement.attr('data-lazy-src') ||
      imgElement.attr('data-srcset') ||
      imgElement.attr('srcset') ||
      imgElement.attr('src');

    if (previewUrl) {
      // Parse srcset and get highest resolution
      const sources = previewUrl.split(',').map((s) => {
        const parts = s.trim().split(/\s+/);
        return { url: parts[0], width: parts[1] ? parseInt(parts[1]) : 0 };
      });
      sources.sort((a, b) => b.width - a.width);
      previewUrl = sources[0]?.url;

      // Ensure URL is absolute
      if (previewUrl && !previewUrl.startsWith('http')) {
        previewUrl = `https://www.kingarthurbaking.com${previewUrl}`;
      }
    }
  }

  // Extract ingredients (grouped)
  const ingredients = extractIngredients($, root);

  // Extract directions
  const directions = extractDirections($, root);

  return {
    name,
    prepTime,
    cookTime,
    totalTime,
    servings,
    ingredients,
    directions,
    previewUrl,
  };
}

function extractIngredients(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ name?: string; items: string[] }> {
  const groups: Array<{ name?: string; items: string[] }> = [];

  const groupElems = root.find('.recipe__ingredients .ingredients-list .ingredient-section');

  groupElems.each((_, groupElem) => {
    const $group = $(groupElem);

    // Get group name
    const groupName = cleanText($group.find('p').first().text());

    // Get ingredients
    const items: string[] = [];
    const ingredientList = $group.find('ul').first();

    ingredientList.find('li').each((_, li) => {
      const text = cleanText($(li).text());

      if (text.length > 0) {
        items.push(text.charAt(0).toUpperCase() + text.slice(1));
      }
    });

    if (items.length > 0) {
      groups.push({
        name: groupName || undefined,
        items,
      });
    }
  });

  return groups.length > 0 ? groups : [{ items: [] }];
}

function extractDirections(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ step: number; text: string }> {
  const steps: string[] = [];

  const list = root.find('.recipe__instructions .field--recipe-steps ol').first();

  if (list.length) {
    list.find('li').each((_, li) => {
      // Get text from nested p tag
      const text = cleanText($(li).find('p').first().text());

      if (text) {
        steps.push(text);
      }
    });
  }

  return createDirections(steps);
}
