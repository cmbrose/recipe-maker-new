// Recipe service - MongoDB version for Cosmos DB
import { getRecipesCollection, ObjectId } from '@/lib/db/mongo';
import type { Recipe, CreateRecipeInput, UpdateRecipeInput, RecipeFilters, RecipeListResult, SourceKind } from '@/types/recipe';
import type { WithId, Document } from 'mongodb';

type RecipeDoc = {
  _id: ObjectId;
  name: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: any;
  directions: string[];
  previewUrl?: string;
  source?: string;
  sourceKind: string;
  tags: string[];
  notes: string[];
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
};

function toRecipe(doc: WithId<Document>): Recipe {
  return {
    id: doc._id.toString(),
    name: doc.name,
    prepTime: doc.prepTime,
    cookTime: doc.cookTime,
    totalTime: doc.totalTime,
    servings: doc.servings,
    ingredients: doc.ingredients,
    directions: doc.directions,
    previewUrl: doc.previewUrl,
    source: doc.source,
    sourceKind: doc.sourceKind as SourceKind,
    tags: doc.tags,
    notes: doc.notes,
    lastViewed: doc.lastViewed,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
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

  const query: any = {};
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }
  if (tags && tags.length > 0) {
    query.tags = { $all: tags };
  }
  if (sourceKind) {
    query.sourceKind = sourceKind;
  }

  // Sorting
  const [sortField, sortDirection] = sort.split('-') as [string, 'asc' | 'desc'];
  const sortObj: any = {};
  switch (sortField) {
    case 'name':
      sortObj.name = sortDirection === 'asc' ? 1 : -1;
      break;
    case 'viewed':
      sortObj.lastViewed = sortDirection === 'asc' ? 1 : -1;
      break;
    case 'created':
    default:
      sortObj.createdAt = sortDirection === 'asc' ? 1 : -1;
      break;
  }

  const skip = (page - 1) * limit;
  const collection = await getRecipesCollection();
  const [docs, total] = await Promise.all([
    collection.find(query).sort(sortObj).skip(skip).limit(limit).toArray(),
    collection.countDocuments(query),
  ]);
  const totalPages = Math.ceil(total / limit);
  return {
    recipes: docs.map((doc) => toRecipe(doc)),
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
  const collection = await getRecipesCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toRecipe(doc as WithId<Document>) : null;
}

/**
 * Get multiple recipes by IDs
 */
export async function getRecipesByIds(ids: string[]): Promise<Recipe[]> {
  const collection = await getRecipesCollection();
  const objectIds = ids.map((id) => new ObjectId(id));
  const docs = await collection.find({ _id: { $in: objectIds } }).toArray();
  return docs.map((doc) => toRecipe(doc as WithId<Document>));
}

/**
 * Get a recipe by source URL
 */
export async function getRecipeByUrl(url: string): Promise<Recipe | null> {
  const collection = await getRecipesCollection();
  const doc = await collection.findOne({ source: url });
  return doc ? toRecipe(doc as WithId<Document>) : null;
}

/**
 * Create a new recipe
 */
export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
  const collection = await getRecipesCollection();
  const now = new Date();
  const doc: Omit<RecipeDoc, '_id'> = {
    name: input.name,
    prepTime: input.prepTime ?? undefined,
    cookTime: input.cookTime ?? undefined,
    totalTime: input.totalTime ?? undefined,
    servings: input.servings ?? undefined,
    ingredients: input.ingredients,
    directions: input.directions || [],
    previewUrl: input.previewUrl || undefined,
    source: input.source || undefined,
    sourceKind: input.sourceKind,
    tags: input.tags || [],
    notes: input.notes || [],
    lastViewed: undefined,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  const inserted = await collection.findOne({ _id: result.insertedId });
  if (!inserted) throw new Error('Failed to create recipe');
  return toRecipe(inserted as WithId<Document>);
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
  const { id, ...data } = input;
  const collection = await getRecipesCollection();
  const update: any = { ...data, updatedAt: new Date() };
  // Remove undefined fields
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Recipe not found');
  return toRecipe(doc as WithId<Document>);
}

/**
 * Update the last viewed timestamp for a recipe
 */
export async function markRecipeAsViewed(id: string): Promise<void> {
  const collection = await getRecipesCollection();
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: { lastViewed: new Date() } });
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(id: string): Promise<void> {
  const collection = await getRecipesCollection();
  await collection.deleteOne({ _id: new ObjectId(id) });
}

/**
 * Get all unique tags across all recipes (for autocomplete)
 */
export async function getAllTags(): Promise<string[]> {
  const collection = await getRecipesCollection();
  const docs = await collection.find({}, { projection: { tags: 1 } }).toArray();
  const allTags = docs.flatMap((r) => (r.tags ? r.tags : []));
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
  const collection = await getRecipesCollection();
  const docs = await collection.find({ lastViewed: { $ne: null } }).sort({ lastViewed: -1 }).limit(limit).toArray();
  return docs.map((doc) => toRecipe(doc as WithId<Document>));
}

/**
 * Get recently created recipes
 */
export async function getRecentlyCreatedRecipes(limit = 10): Promise<Recipe[]> {
  const collection = await getRecipesCollection();
  const docs = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
  return docs.map((doc) => toRecipe(doc as WithId<Document>));
}
