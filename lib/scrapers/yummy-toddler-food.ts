// Yummy Toddler Food recipe scraper
// Uses WPRM (WP Recipe Maker) plugin structure

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  cleanText,
  createDirections,
} from './utils';
import { IngredientGroup } from '@/types/recipe';

export async function scrapeYummyToddlerFood(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Find the recipe container
  const root = $('.wprm-recipe').first();

  if (!root.length) {
    throw new Error('Recipe container not found');
  }

  // Extract name
  const name = cleanText(root.find('h2.wprm-recipe-name').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTime = getTime($, root, 'prep');
  const cookTime = getTime($, root, 'cook');
  const totalTime = getTime($, root, 'total');

  // Extract servings
  const servings = root
    .find('.wprm-recipe-servings-container .wprm-recipe-servings')
    .text();

  // Extract preview image
  const imgElement = root.find('.wprm-recipe-image img').first();
  let previewUrl: string | undefined;

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

function getTime(
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

function extractIngredients(
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

function extractDirections(
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
