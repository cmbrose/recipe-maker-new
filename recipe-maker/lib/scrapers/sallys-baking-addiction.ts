// Sally's Baking Addiction recipe scraper
// Uses Tasty Recipes plugin structure

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import {
  parseTime,
  parseServings,
  cleanText,
  createDirections,
} from './utils';

export async function scrapeSallysBakingAddiction(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Find the recipe container
  const root = $('.tasty-recipes').first();

  if (!root.length) {
    throw new Error('Recipe container not found');
  }

  // Extract name
  const name = cleanText(root.find('h2.tasty-recipes-title').text());
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTimeText = root.find('.tasty-recipes-prep-time').text();
  const cookTimeText = root.find('.tasty-recipes-cook-time').text();

  const prepTime = parseTime(prepTimeText);
  const cookTime = parseTime(cookTimeText);
  const totalTime = prepTime && cookTime ? prepTime + cookTime : undefined;

  // Extract servings
  const servingsText = root.find('.tasty-recipes-yield').text();
  const servings = parseServings(servingsText);

  // Extract preview image
  const imgElement = root.find('.tasty-recipes-image img').first();
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

function extractIngredients(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ name?: string; items: string[] }> {
  const groups: Array<{ name?: string; items: string[] }> = [];
  let currentGroupName: string | undefined;

  const ingredientsBody = root.find('.tasty-recipes-ingredients-body').first();

  ingredientsBody.children().each((_, elem) => {
    const $elem = $(elem);

    if (elem.tagName === 'h4') {
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

function extractDirections(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): Array<{ step: number; text: string }> {
  const steps: string[] = [];

  const list = root.find('.tasty-recipes-instructions-body ol').first();

  if (list.length) {
    list.find('li').each((_, li) => {
      let text = cleanText($(li).text());

      // Remove any leading numbers (e.g., "1. ", "2. ")
      text = text.replace(/^\d+\.\s*/, '');

      if (text) {
        steps.push(text);
      }
    });
  }

  return createDirections(steps);
}
