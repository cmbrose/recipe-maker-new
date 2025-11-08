// Budget Bytes recipe scraper
// Scrapes recipes from budgetbytes.com using WPRM (WP Recipe Maker) plugin structure

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  parseTime,
  parseServings,
  cleanText,
  getBestImageUrl,
  createDirections,
} from './utils';

export async function scrapeBudgetBytes(
  html: string,
  url: string
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Find the recipe container
  const root = $('.wprm-recipe-container .wprm-recipe').first();

  if (!root.length) {
    throw new Error('Recipe container not found');
  }

  // Extract name
  const name = cleanText(root.find('h2.wprm-recipe-name').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTimeText = getTime($, root, 'prep');
  const cookTimeText = getTime($, root, 'cook');

  const prepTime = parseTime(prepTimeText);
  const cookTime = parseTime(cookTimeText);
  const totalTime = prepTime && cookTime ? prepTime + cookTime : undefined;

  // Extract servings
  const servingsText = root
    .find('.wprm-recipe-servings-container .wprm-recipe-servings-adjustable-text')
    .text();
  const servings = parseServings(servingsText);

  // Extract preview image
  const imgSelectors = [
    '.wprm-recipe-image-container .wprm-recipe-image img',
    '.wprm-container-float-right .wprm-recipe-image img',
  ];

  let previewUrl: string | undefined;
  for (const selector of imgSelectors) {
    const img = root.find(selector).first();
    if (img.length) {
      // Check for lazy-loaded images
      previewUrl =
        img.attr('data-lazy-srcset') ||
        img.attr('data-lazy-src') ||
        img.attr('data-srcset') ||
        img.attr('srcset') ||
        img.attr('src');

      if (previewUrl) {
        // Get highest resolution from srcset
        const sources = previewUrl.split(',').map((s) => {
          const parts = s.trim().split(/\s+/);
          return { url: parts[0], width: parts[1] ? parseInt(parts[1]) : 0 };
        });
        sources.sort((a, b) => b.width - a.width);
        previewUrl = sources[0]?.url;
        break;
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

function getTime(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>,
  type: 'prep' | 'cook'
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
