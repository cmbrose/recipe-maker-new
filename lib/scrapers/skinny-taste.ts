// Skinny Taste recipe scraper
// Handles two different recipe formats (Type1: older layout, Type2: WPRM plugin)

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  cleanText,
  createDirections,
} from './utils';
import { IngredientGroup } from '@/types/recipe';

export async function scrapeSkinnyTaste(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Try Type2 first (WPRM - more common in recent recipes)
  const type2Root = $('.wprm-recipe').not('.wprm-recipe-snippet').first();
  if (type2Root.length) {
    return scrapeType2($, type2Root);
  }

  // Try Type1 (older custom layout)
  const type1Root = $('.recipe').first();
  if (type1Root.length) {
    return scrapeType1($, type1Root);
  }

  throw new Error('Recipe container not found');
}

/**
 * Type2: WPRM plugin format (newer recipes)
 */
function scrapeType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
): RecipeScraperResult {
  // Extract name
  const name = cleanText(root.find('h2.wprm-recipe-name').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTime = extractTime($, root, 'prep');
  const cookTime = extractTime($, root, 'cook');
  // Extract servings
  const servings = root.find('.wprm-recipe-servings-with-unit').text();

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
  const ingredients = extractIngredientsType2($, root);

  // Extract directions
  const directions = extractDirectionsType2($, root);

  return {
    name,
    prepTime,
    cookTime,
    servings,
    ingredients,
    directions,
    previewUrl,
  };
}

/**
 * Type1: Older custom layout format
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

  // Extract times (Type1 only has total time)
  const totalTime = root.find('.recipe-meta p').text();

  // Extract servings
  const servings = root.find('.nutrition .yield').text();

  // Extract preview image
  let previewUrl: string | undefined;
  const imgSelectors = ['.photo img', 'img.photo'];

  for (const selector of imgSelectors) {
    const img = root.find(selector).first();
    if (img.length) {
      previewUrl = img.attr('src') || img.attr('data-src');
      if (previewUrl && previewUrl.startsWith('http')) {
        break;
      }
    }
  }

  // Extract ingredients (Type1 format)
  const ingredients = extractIngredientsType1($, root);

  // Extract directions (Type1 format)
  const directions = extractDirectionsType1($, root);

  return {
    name,
    prepTime: undefined,
    cookTime: undefined,
    totalTime,
    servings,
    ingredients,
    directions,
    previewUrl,
  };
}

/**
 * Extract time for Type2 (WPRM format)
 */
function extractTime(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  type: 'prep' | 'cook'
): string {
  const container = root.find(
    `.wprm-recipe-times-container .wprm-recipe-${type}-time-container .wprm-recipe-time`
  );

  const time = container.find('.wprm-recipe-details').text();
  const unit = container.find('.wprm-recipe-details-unit').text();

  return `${time} ${unit}`.trim();
}

/**
 * Extract ingredients for Type2 (WPRM format)
 */
function extractIngredientsType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<IngredientGroup> {
  const groups: Array<IngredientGroup> = [];

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
      const amount = cleanText($li.find('.wprm-recipe-ingredient-amount').text());
      const unit = cleanText($li.find('.wprm-recipe-ingredient-unit').text());
      const name = cleanText($li.find('.wprm-recipe-ingredient-name').text());

      const ingredient = `${amount} ${unit} ${name}`.trim();

      if (ingredient.length > 0) {
        items.push(ingredient.charAt(0).toUpperCase() + ingredient.slice(1));
      }
    });

    if (items.length > 0) {
      groups.push({
        name: groupName || undefined,
        ingredients: items,
      });
    }
  });

  return groups.length > 0 ? groups : [{ ingredients: [] }];
}

/**
 * Extract ingredients for Type1 (older format)
 */
function extractIngredientsType1(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<IngredientGroup> {
  const groups: Array<IngredientGroup> = [];
  let currentGroupName: string | undefined;
  let currentItems: string[] = [];

  const ingredientElems = root.find('.ingredients');

  ingredientElems.each((_, elem) => {
    const $elem = $(elem);

    // Check if this is a group header (usually a <p> tag)
    if (elem.tagName === 'p') {
      // Save previous group if exists
      if (currentItems.length > 0) {
        groups.push({
          name: currentGroupName,
          ingredients: currentItems,
        });
      }

      // Start new group
      currentGroupName = cleanText($elem.text());
      currentItems = [];
    } else {
      // Add ingredient to current group
      const text = cleanText($elem.text());
      if (text) {
        currentItems.push(text.charAt(0).toUpperCase() + text.slice(1));
      }
    }
  });

  // Add final group
  if (currentItems.length > 0) {
    groups.push({
      name: currentGroupName,
      ingredients: currentItems,
    });
  }

  return groups.length > 0 ? groups : [{ ingredients: [] }];
}

/**
 * Extract directions for Type2 (WPRM format)
 */
function extractDirectionsType2(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): string[] {
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
        const text = cleanText($(li).text());
        if (text) {
          steps.push(text);
        }
      });
      break;
    }
  }

  return createDirections(steps);
}

/**
 * Extract directions for Type1 (older format)
 */
function extractDirectionsType1(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): string[] {
  const steps: string[] = [];

  // Try multiple selectors for instructions
  const listSelectors = [
    '.instructions span ol',
    '.instructions ol',
    '.instructions',
  ];

  for (const selector of listSelectors) {
    const list = root.find(selector).first();
    if (list.length) {
      list.children().each((_, child) => {
        const text = cleanText($(child).text());
        if (text) {
          steps.push(text);
        }
      });

      if (steps.length > 0) break;
    }
  }

  return createDirections(steps);
}
