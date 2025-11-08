// Recipe service - handles all recipe CRUD operations and business logic

import { prisma } from '@/lib/db/client';
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeFilters,
  RecipeListResult,
} from '@/types/recipe';

/**
 * List recipes with filtering, sorting, and pagination
 */
export async function listRecipes(filters: RecipeFilters = {}): Promise<RecipeListResult> {
  const {
    search,
    tags,
    sourceKind,
    sort = 'created-desc',
    page = 1,
    limit = 20,
  } = filters;

  // Build where clause
  const where: any = {};

  // Search by name (case-insensitive, word-based matching)
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  // Filter by tags (AND logic - recipe must have all specified tags)
  if (tags && tags.length > 0) {
    where.tags = {
      hasEvery: tags,
    };
  }

  // Filter by source kind
  if (sourceKind) {
    where.sourceKind = sourceKind;
  }

  // Parse sort parameter (format: "field-direction")
  const [sortField, sortDirection] = sort.split('-') as [string, 'asc' | 'desc'];
  const orderBy: any = {};

  switch (sortField) {
    case 'name':
      orderBy.name = sortDirection;
      break;
    case 'viewed':
      orderBy.lastViewed = sortDirection;
      break;
    case 'created':
    default:
      orderBy.createdAt = sortDirection;
      break;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute queries
  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.recipe.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    recipes: recipes as Recipe[],
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get a single recipe by ID
 */
export async function getRecipe(id: string): Promise<Recipe | null> {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
  });

  return recipe as Recipe | null;
}

/**
 * Get a recipe by source URL
 */
export async function getRecipeByUrl(url: string): Promise<Recipe | null> {
  const recipe = await prisma.recipe.findFirst({
    where: { source: url },
  });

  return recipe as Recipe | null;
}

/**
 * Create a new recipe
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const recipe = await prisma.recipe.create({
    data: {
      name: input.name,
      prepTime: input.prepTime,
      cookTime: input.cookTime,
      totalTime: input.totalTime,
      servings: input.servings,
      ingredients: input.ingredients as any,
      directions: input.directions as any,
      previewUrl: input.previewUrl,
      source: input.source,
      sourceKind: input.sourceKind,
      tags: input.tags || [],
      notes: input.notes || [],
    },
  });

  return recipe as Recipe;
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
  const { id, ...data } = input;

  // Remove undefined fields
  const updateData: any = {};
  Object.keys(data).forEach((key) => {
    const value = (data as any)[key];
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  const recipe = await prisma.recipe.update({
    where: { id },
    data: updateData,
  });

  return recipe as Recipe;
}

/**
 * Update the last viewed timestamp for a recipe
 */
export async function markRecipeAsViewed(id: string): Promise<void> {
  await prisma.recipe.update({
    where: { id },
    data: { lastViewed: new Date() },
  });
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(id: string): Promise<void> {
  await prisma.recipe.delete({
    where: { id },
  });
}

/**
 * Get all unique tags across all recipes (for autocomplete)
 */
export async function getAllTags(): Promise<string[]> {
  const recipes = await prisma.recipe.findMany({
    select: { tags: true },
  });

  // Flatten and deduplicate tags
  const allTags = recipes.flatMap((r) => r.tags);
  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.sort();
}

/**
 * Search recipes by advanced query syntax
 * Supports: "tag:dinner tag:quick chicken"
 * Returns recipes matching the query
 */
export async function searchRecipesByQuery(query: string, filters: Omit<RecipeFilters, 'search' | 'tags'> = {}): Promise<RecipeListResult> {
  const parsed = parseSearchQuery(query);

  return listRecipes({
    ...filters,
    search: parsed.search,
    tags: parsed.tags,
  });
}

/**
 * Parse advanced search query
 * Format: "tag:dinner tag:quick chicken soup"
 * Returns: { search: "chicken soup", tags: ["dinner", "quick"] }
 */
export function parseSearchQuery(query: string): { search?: string; tags: string[] } {
  const tags: string[] = [];
  const searchTerms: string[] = [];

  const tokens = query.trim().split(/\s+/);

  for (const token of tokens) {
    if (token.startsWith('tag:')) {
      const tag = token.substring(4);
      if (tag) {
        tags.push(tag);
      }
    } else {
      searchTerms.push(token);
    }
  }

  return {
    search: searchTerms.length > 0 ? searchTerms.join(' ') : undefined,
    tags,
  };
}

/**
 * Get recently viewed recipes
 */
export async function getRecentlyViewedRecipes(limit = 10): Promise<Recipe[]> {
  const recipes = await prisma.recipe.findMany({
    where: {
      lastViewed: { not: null },
    },
    orderBy: {
      lastViewed: 'desc',
    },
    take: limit,
  });

  return recipes as Recipe[];
}

/**
 * Get recently created recipes
 */
export async function getRecentlyCreatedRecipes(limit = 10): Promise<Recipe[]> {
  const recipes = await prisma.recipe.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });

  return recipes as Recipe[];
}
