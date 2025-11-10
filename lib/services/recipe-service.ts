// Recipe service - handles all recipe CRUD operations and business logic

import { prisma } from '@/lib/db/client';
import { Prisma, type Recipe as PrismaRecipe } from '@prisma/client';
import type {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  RecipeFilters,
  RecipeListResult,
  IngredientGroup,
} from '@/types/recipe';

/**
 * Transform Prisma recipe to our Recipe type
 * 
 * Prisma's MongoDB connector uses JsonValue for complex nested structures (ingredients, directions).
 * This is a limitation of MongoDB support - typed composite types are only available for SQL databases.
 * 
 * This function provides type-safe transformation from Prisma's database model to our application model.
 * The cast is safe because:
 * 1. We control all writes through createRecipe/updateRecipe which enforce the correct structure
 * 2. The database schema validation ensures data integrity
 * 3. Runtime validation could be added here if needed (e.g., with Zod)
 */
function toRecipe(dbRecipe: PrismaRecipe): Recipe {
  return {
    id: dbRecipe.id,
    name: dbRecipe.name,
    prepTime: dbRecipe.prepTime ?? undefined,
    cookTime: dbRecipe.cookTime ?? undefined,
    totalTime: dbRecipe.totalTime ?? undefined,
    servings: dbRecipe.servings ?? undefined,
    // Safe cast: we control all writes and ensure correct structure
    ingredients: dbRecipe.ingredients as unknown as IngredientGroup[],
    directions: dbRecipe.directions,
    previewUrl: dbRecipe.previewUrl ?? undefined,
    source: dbRecipe.source ?? undefined,
    sourceKind: dbRecipe.sourceKind as 'url' | 'manual',
    tags: dbRecipe.tags,
    notes: dbRecipe.notes,
    lastViewed: dbRecipe.lastViewed ?? undefined,
    createdAt: dbRecipe.createdAt,
    updatedAt: dbRecipe.updatedAt,
  };
}

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
  const where: Prisma.RecipeWhereInput = {};

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
  const orderBy: Prisma.RecipeOrderByWithRelationInput = {};

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
    recipes: recipes.map(toRecipe),
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

  return recipe ? toRecipe(recipe) : null;
}

/**
 * Get multiple recipes by IDs
 */
export async function getRecipesByIds(ids: string[]): Promise<Recipe[]> {
  const recipes = await prisma.recipe.findMany({
    where: { id: { in: ids } },
  });
  
  return recipes.map(toRecipe);
}

/**
 * Get a recipe by source URL
 */
export async function getRecipeByUrl(url: string): Promise<Recipe | null> {
  const recipe = await prisma.recipe.findFirst({
    where: { source: url },
  });

  return recipe ? toRecipe(recipe) : null;
}

/**
 * Create a new recipe
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  // Sanitize optional string fields (convert empty strings to null)
  const previewUrl = input.previewUrl && input.previewUrl.trim() !== '' ? input.previewUrl : null;
  const source = input.source && input.source.trim() !== '' ? input.source : null;

  // Explicitly set ALL fields (including optional ones as null) to avoid Cosmos DB $$REMOVE issue
  const recipe = await prisma.recipe.create({
    data: {
      name: input.name,
      prepTime: input.prepTime ?? null,
      cookTime: input.cookTime ?? null,
      totalTime: input.totalTime ?? null,
      servings: input.servings ?? null,
      ingredients: input.ingredients as unknown as Prisma.InputJsonValue,
      directions: input.directions || [],
      previewUrl,
      source,
      sourceKind: input.sourceKind,
      tags: input.tags || [],
      notes: input.notes || [],
      lastViewed: null,
    },
  });

  return toRecipe(recipe);
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
  const { id, ...data } = input;

  // Build update data, converting undefined to null (Cosmos DB requirement)
  const updateData: Prisma.RecipeUpdateInput = {};
  Object.keys(data).forEach((key) => {
    const value = (data as Record<string, unknown>)[key];
    if (value !== undefined) {
      // Handle Json fields that need special casting
      if (key === 'ingredients') {
        (updateData as Record<string, unknown>)[key] = value as unknown as Prisma.InputJsonValue;
      } 
      // Handle optional string fields (convert empty strings to null)
      else if ((key === 'previewUrl' || key === 'source') && typeof value === 'string' && value.trim() === '') {
        (updateData as Record<string, unknown>)[key] = null;
      }
      else {
        (updateData as Record<string, unknown>)[key] = value;
      }
    }
  });

  // If updateData is empty, just fetch and return the recipe
  if (Object.keys(updateData).length === 0) {
    const recipe = await prisma.recipe.findUnique({ where: { id } });
    if (!recipe) {
      throw new Error(`Recipe not found: ${id}`);
    }
    return toRecipe(recipe);
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: updateData,
  });

  return toRecipe(recipe);
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

  return recipes.map(toRecipe);
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

  return recipes.map(toRecipe);
}
