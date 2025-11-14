// AllRecipes recipe scraper
// Handles recipes from allrecipes.com

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { RecipeScraperResult } from '@/types/scraper';
import type { IngredientGroup } from '@/types/recipe';
import { cleanText, createDirections } from './utils';

export async function scrapeAllRecipes(
  html: string,
): Promise<RecipeScraperResult> {
  const $ = cheerio.load(html);

  // Extract name
  const name = extractName($);
  if (!name) {
    throw new Error('Recipe name not found');
  }

  // Extract times
  const prepTime = extractTime($, 'Prep Time');
  const cookTime = extractTime($, 'Cook Time');
  const totalTime = extractTime($, 'Total Time');

  // Extract servings
  const servings = extractServings($);

  // Extract preview image
  const previewUrl = extractPreviewImage($);

  // Extract ingredients (grouped)
  const ingredients = extractIngredients($);

  // Extract directions
  const directions = extractDirections($);

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

function extractName($: cheerio.CheerioAPI): string {
  // Try multiple selectors for the recipe title
  const selectors = [
    'h1.article-heading',
    'h1.heading-content',
    'h1',
  ];

  for (const selector of selectors) {
    const name = cleanText($(selector).first().text());
    if (name) {
      return name;
    }
  }

  // Try meta tag as fallback
  const metaTitle = $('meta[property="og:title"]').attr('content');
  if (metaTitle) {
    return cleanText(metaTitle);
  }

  return '';
}

function extractIngredients($: cheerio.CheerioAPI): IngredientGroup[] {
  const ingredientGroups: IngredientGroup[] = [];

  // Find the main ingredients container
  const $container = $('.mm-recipes-structured-ingredients');

  if ($container.length > 0) {
    // Process each section - headings followed by lists
    $container.find('.mm-recipes-structured-ingredients__list-heading, .mm-recipes-structured-ingredients__list').each((_, elem) => {
      const $elem = $(elem);

      // If this is a heading, start a new group
      if ($elem.hasClass('mm-recipes-structured-ingredients__list-heading')) {
        const groupName = cleanText($elem.text()).replace(':', '').trim();
        ingredientGroups.push({
          name: groupName || undefined,
          ingredients: []
        });
      }
      // If this is a list, add ingredients to the current or new group
      else if ($elem.hasClass('mm-recipes-structured-ingredients__list')) {
        // Ensure we have at least one group
        if (ingredientGroups.length === 0) {
          ingredientGroups.push({ ingredients: [] });
        }

        const currentGroup = ingredientGroups[ingredientGroups.length - 1];

        // Process ingredients in this list
        $elem.find('.mm-recipes-structured-ingredients__list-item').each((_, itemElem) => {
          const $item = $(itemElem);

          // Get quantity, unit, and name separately
          const quantity = cleanText($item.find('[data-ingredient-quantity="true"]').text());
          const unit = cleanText($item.find('[data-ingredient-unit="true"]').text());
          const name = cleanText($item.find('[data-ingredient-name="true"]').text());

          if (name) {
            // Combine quantity, unit, and name
            const parts = [quantity, unit, name].filter(p => p).join(' ');
            currentGroup.ingredients.push(parts.charAt(0).toUpperCase() + parts.slice(1));
          }
        });
      }
    });
  }

  // Fallback: try to get ingredients from paragraphs if structured data not found
  if (ingredientGroups.length === 0 || ingredientGroups.every(group => group.ingredients.length === 0)) {
    const fallbackIngredients: string[] = [];
    $('.mm-recipes-structured-ingredients__list li p, .mntl-structured-ingredients__list li p').each((_, elem) => {
      const text = cleanText($(elem).text());
      if (text) {
        fallbackIngredients.push(text.charAt(0).toUpperCase() + text.slice(1));
      }
    });

    if (fallbackIngredients.length > 0) {
      return [{ ingredients: fallbackIngredients }];
    }
  }

  return ingredientGroups.length > 0 ? ingredientGroups : [{ ingredients: [] }];
}

function extractDirections($: cheerio.CheerioAPI): string[] {
  const steps: string[] = [];

  // Allrecipes uses ordered list for directions
  // Use > p to only get direct child paragraphs, not nested ones in figcaptions
  $('.mm-recipes-steps__content ol li').each((_, elem) => {
    const $li = $(elem);
    // Get only the direct child p tag, not nested ones in figcaption
    const text = cleanText($li.children('p').first().text());
    steps.push(text);
  });

  // Fallback: try numbered paragraphs
  if (steps.length === 0) {
    $('.recipe-directions__list li, .instructions li').each((_, elem) => {
      const text = cleanText($(elem).text());
      if (text) {
        steps.push(text);
      }
    });
  }

  return createDirections(steps);
}

function extractTime($: cheerio.CheerioAPI, label: string): string | undefined {
  // Find time by label in the details section
  let time: string | undefined;

  $('.mm-recipes-details__item').each((_, elem) => {
    const $elem = $(elem);
    const itemLabel = cleanText($elem.find('.mm-recipes-details__label').text());

    if (itemLabel.includes(label)) {
      time = cleanText($elem.find('.mm-recipes-details__value').text());
      return false; // break
    }
  });

  return time;
}

function extractServings($: cheerio.CheerioAPI): string | undefined {
  // Look for servings in recipe details
  let servings: string | undefined;

  $('.mm-recipes-details__item').each((_, elem) => {
    const $elem = $(elem);
    const label = cleanText($elem.find('.mm-recipes-details__label').text());

    if (label.includes('Servings') || label.includes('Yield')) {
      servings = cleanText($elem.find('.mm-recipes-details__value').text());
      return false; // break
    }
  });

  // Fallback: try the serving size adjuster
  if (!servings) {
    servings = $('#mm-recipes-serving-size-adjuster__serving-value_1-0').attr('value');
  }

  return servings;
}

function extractPreviewImage($: cheerio.CheerioAPI): string | undefined {
  // Try Open Graph image first
  let imageUrl = $('meta[property="og:image"]').attr('content');

  // Fallback: try the main recipe image
  if (!imageUrl) {
    const imgElement = $('.primary-image img, .mm-recipes-structured-ingredients__image img').first();
    imageUrl = imgElement.attr('src') || imgElement.attr('data-src');
  }

  return imageUrl;
}
