// Menu service - MongoDB version for Cosmos DB

import { ObjectId } from '@/lib/db/mongo';
import type { Menu, CreateMenuInput, UpdateMenuInput } from '@/types/menu';
import type { Recipe } from '@/types/recipe';
import { getRecipesByIds } from './recipe-service';
import type { WithId, Document } from 'mongodb';

async function getMenusCollection() {
  const { getDb } = await import('@/lib/db/mongo');
  const db = await getDb();
  return db.collection('Menu');
}

function toMenu(doc: WithId<Document>): Menu {
  return {
    id: doc._id.toString(),
    name: doc.name,
    recipeIds: doc.recipeIds,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * List all menus
 */
export async function listMenus(): Promise<Menu[]> {
  const collection = await getMenusCollection();
  const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map(toMenu);
}

/**
 * Get a single menu by ID
 */
export async function getMenu(id: string): Promise<Menu | null> {
  const collection = await getMenusCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  return doc ? toMenu(doc) : null;
}

/**
 * Get a menu with populated recipe details
 */
export async function getMenuWithRecipes(id: string): Promise<(Menu & { recipes: Recipe[] }) | null> {
  const menu = await getMenu(id);
  if (!menu) return null;

  const recipes = await getRecipesByIds(menu.recipeIds);
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const sortedRecipes = menu.recipeIds
    .map((id: string) => recipeMap.get(id))
    .filter((r: Recipe | undefined): r is Recipe => r !== undefined);

  return { ...menu, recipes: sortedRecipes };
}

/**
 * Create a new menu
 */
export async function createMenu(input: CreateMenuInput): Promise<Menu> {
  const collection = await getMenusCollection();
  const now = new Date();
  const doc = {
    name: input.name,
    recipeIds: input.recipeIds || [],
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc);
  const inserted = await collection.findOne({ _id: result.insertedId });
  if (!inserted) throw new Error('Failed to create menu');
  return toMenu(inserted);
}

/**
 * Update an existing menu
 */
export async function updateMenu(input: UpdateMenuInput): Promise<Menu> {
  const { id, ...data } = input;
  const collection = await getMenusCollection();
  const update: any = { ...data, updatedAt: new Date() };
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) throw new Error('Menu not found');
  return toMenu(doc);
}

/**
 * Delete a menu
 */
export async function deleteMenu(id: string): Promise<void> {
  const collection = await getMenusCollection();
  await collection.deleteOne({ _id: new ObjectId(id) });
}

/**
 * Add a recipe to a menu
 */
export async function addRecipeToMenu(menuId: string, recipeId: string): Promise<Menu> {
  const menu = await getMenu(menuId);
  if (!menu) throw new Error('Menu not found');
  if (menu.recipeIds.includes(recipeId)) return menu;
  
  const collection = await getMenusCollection();
  await collection.updateOne(
    { _id: new ObjectId(menuId) },
    { $push: { recipeIds: recipeId } as any, $set: { updatedAt: new Date() } }
  );
  const doc = await collection.findOne({ _id: new ObjectId(menuId) });
  if (!doc) throw new Error('Menu not found');
  return toMenu(doc);
}

/**
 * Remove a recipe from a menu
 */
export async function removeRecipeFromMenu(menuId: string, recipeId: string): Promise<Menu> {
  const collection = await getMenusCollection();
  await collection.updateOne(
    { _id: new ObjectId(menuId) },
    { $pull: { recipeIds: recipeId } as any, $set: { updatedAt: new Date() } }
  );
  const doc = await collection.findOne({ _id: new ObjectId(menuId) });
  if (!doc) throw new Error('Menu not found');
  return toMenu(doc);
}

/**
 * Clear all recipes from a menu
 */
export async function clearMenu(menuId: string): Promise<Menu> {
  const collection = await getMenusCollection();
  await collection.updateOne(
    { _id: new ObjectId(menuId) },
    { $set: { recipeIds: [], updatedAt: new Date() } }
  );
  const doc = await collection.findOne({ _id: new ObjectId(menuId) });
  if (!doc) throw new Error('Menu not found');
  return toMenu(doc);
}

/**
 * Reorder recipes in a menu
 */
export async function reorderMenuRecipes(menuId: string, recipeIds: string[]): Promise<Menu> {
  const collection = await getMenusCollection();
  await collection.updateOne(
    { _id: new ObjectId(menuId) },
    { $set: { recipeIds, updatedAt: new Date() } }
  );
  const doc = await collection.findOne({ _id: new ObjectId(menuId) });
  if (!doc) throw new Error('Menu not found');
  return toMenu(doc);
}

/**
 * Find all menus containing a specific recipe
 */
export async function getMenusContainingRecipe(recipeId: string): Promise<Menu[]> {
  const collection = await getMenusCollection();
  const docs = await collection.find({ recipeIds: recipeId }).toArray();
  return docs.map(toMenu);
}

/**
 * Remove a recipe from all menus (useful when deleting a recipe)
 */
export async function removeRecipeFromAllMenus(recipeId: string): Promise<void> {
  const collection = await getMenusCollection();
  await collection.updateMany(
    { recipeIds: recipeId },
    { $pull: { recipeIds: recipeId } as any, $set: { updatedAt: new Date() } }
  );
}
