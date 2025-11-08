// Love and Lemons recipe scraper
// Handles two different recipe formats (Type1: WPRM plugin, Type2: EasyRecipe plugin)

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  parseTime,
  parseServings,
  cleanText,
  createDirections,
} from './utils';

export async function scrapeLoveAndLemons(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Try Type1 first (WPRM - more common in recent recipes)
  const type1Root = $('.wprm-recipe').first();
  if (type1Root.length) {
    return scrapeType1($, type1Root);
  }

  // Try Type2 (EasyRecipe - older recipes)
  const type2Root = $('.easyrecipe').first();
  if (type2Root.length) {
    return scrapeType2($, type2Root);
  }

  throw new Error('Recipe container not found');
}

/**
 * Type1: WPRM plugin format (newer recipes)
 */
function scrapeType1(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
): RecipeScraperResult {
  // Extract name
  const name = cleanText(root.find('h2.wprm-recipe-name').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTimeText = extractTime($, root, 'prep');
  const cookTimeText = extractTime($, root, 'cook');
  const totalTimeText = extractTime($, root, 'total');

  const prepTime = parseTime(prepTimeText);
  const cookTime = parseTime(cookTimeText);
  const totalTime = parseTime(totalTimeText);

  // Extract servings
  const servingsText = root.find('.wprm-recipe-servings-container .wprm-recipe-servings').text();
  const servings = parseServings(servingsText);

  // Extract preview image
  const imgElement = root.find('.wprm-recipe-image img').first();
  let previewUrl: string | undefined;

  if (imgElement.length) {
    // Try various image source attributes
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
    }
  }

  // Extract ingredients (grouped)
  const ingredients = extractIngredientsType1($, root);

  // Extract directions
  const directions = extractDirectionsType1($, root);

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

/**
 * Type2: EasyRecipe plugin format (older recipes)
 */
function scrapeType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
): RecipeScraperResult {
  // Extract name
  const name = cleanText(root.find('h2.ERSName').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTimeText = root.find('.ERSTimes time[itemprop="prepTime"]').text();
  const cookTimeText = root.find('.ERSTimes time[itemprop="cookTime"]').text();
  const totalTimeText = root.find('.ERSTimes time[itemprop="totalTime"]').text();

  const prepTime = parseTime(prepTimeText);
  const cookTime = parseTime(cookTimeText);
  const totalTime = parseTime(totalTimeText);

  // Extract servings
  const servingsText = root.find('.ERSServes span').text();
  const servings = parseServings(servingsText);

  // Extract preview image
  const previewUrl = root.find('img[itemprop="image"]').attr('src');

  // Extract ingredients (grouped)
  const ingredients = extractIngredientsType2($, root);

  // Extract directions
  const directions = extractDirectionsType2($, root);

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

/**
 * Extract time for Type1 (WPRM format)
 */
function extractTime(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  type: 'prep' | 'cook' | 'total'
): string {
  const container = root.find(
    `.wprm-recipe-times-container .wprm-recipe-${type}-time-container`
  );

  const timeSpans = container.find(`.wprm-recipe-${type}_time`);
  const texts: string[] = [];
  timeSpans.each((_, elem) => {
    texts.push($(elem).text());
  });

  return texts.join(' ').trim();
}

/**
 * Extract ingredients for Type1 (WPRM format)
 */
function extractIngredientsType1(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ name?: string; items: string[] }> {
  const groups: Array<{ name?: string; items: string[] }> = [];

  const groupElems = root.find(
    '.wprm-recipe-ingredients-container .wprm-recipe-ingredient-group'
  );

  groupElems.each((_, groupElem) => {
    const $group = $(groupElem);

    // Get group name
    const groupName = cleanText($group.find('h4').first().text());

    // Get ingredients
    const items: string[] = [];
    const ingredientList = $group.find('ul').first();

    ingredientList.find('li').each((_, li) => {
      const $li = $(li);
      // Try to get text from nested div first
      let text = cleanText($li.find('div').first().text());

      // If no div, try getting parts separately
      if (!text) {
        const amount = cleanText($li.find('.wprm-recipe-ingredient-amount').text());
        const unit = cleanText($li.find('.wprm-recipe-ingredient-unit').text());
        const name = cleanText($li.find('.wprm-recipe-ingredient-name').text());
        text = `${amount} ${unit} ${name}`.trim();
      }

      // Remove leading numbers if any
      text = text.replace(/^\d+\.\s*/, '');

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

/**
 * Extract ingredients for Type2 (EasyRecipe format)
 */
function extractIngredientsType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ name?: string; items: string[] }> {
  const groups: Array<{ name?: string; items: string[] }> = [];
  let currentGroupName: string | undefined;

  const ingredientsBody = root.find('.ERSIngredients').first();

  ingredientsBody.children().each((_, elem) => {
    const $elem = $(elem);

    if (elem.tagName === 'div' && $elem.hasClass('ERSSectionHead')) {
      // This is a group header
      currentGroupName = cleanText($elem.text());
    } else if (elem.tagName === 'ul') {
      // This is a list of ingredients
      const items: string[] = [];
      $elem.find('li').each((_, li) => {
        const text = cleanText($(li).text());
        if (text) {
          items.push(text.charAt(0).toUpperCase() + text.slice(1));
        }
      });

      if (items.length > 0) {
        groups.push({
          name: currentGroupName,
          items,
        });
      }

      currentGroupName = undefined;
    }
  });

  return groups.length > 0 ? groups : [{ items: [] }];
}

/**
 * Extract directions for Type1 (WPRM format)
 */
function extractDirectionsType1(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ step: number; text: string }> {
  const steps: string[] = [];

  // Try both ol and ul
  const listSelectors = [
    '.wprm-recipe-instructions-container .wprm-recipe-instruction-group ol',
    '.wprm-recipe-instructions-container .wprm-recipe-instruction-group ul',
  ];

  for (const selector of listSelectors) {
    const list = root.find(selector).first();
    if (list.length) {
      list.find('li').each((_, li) => {
        const $li = $(li);
        // Look for nested div containing the actual text
        let text = cleanText($li.find('div').first().text());

        // If no div, get the li text directly
        if (!text) {
          text = cleanText($li.text());
        }

        // Remove any leading numbers (e.g., "1. ", "2. ")
        text = text.replace(/^\d+\.\s*/, '');

        if (text) {
          steps.push(text);
        }
      });

      if (steps.length > 0) break;
    }
  }

  return createDirections(steps);
}

/**
 * Extract directions for Type2 (EasyRecipe format)
 */
function extractDirectionsType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ step: number; text: string }> {
  const steps: string[] = [];

  const list = root.find('.ERSInstructions ol').first();

  if (list.length) {
    list.find('li').each((_, li) => {
      const $li = $(li);
      let text = cleanText($li.text());

      // Remove any leading numbers (e.g., "1. ", "2. ")
      text = text.replace(/^\d+\.\s*/, '');

      if (text) {
        steps.push(text);
      }
    });
  }

  return createDirections(steps);
}
