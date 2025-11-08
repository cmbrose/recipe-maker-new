// Menu service - handles all menu CRUD operations and business logic

import { prisma } from '@/lib/db/client';
import type {
  Menu,
  CreateMenuInput,
  UpdateMenuInput,
} from '@/types/menu';
import type { Recipe } from '@/types/recipe';

/**
 * List all menus
 */
export async function listMenus(): Promise<Menu[]> {
  const menus = await prisma.menu.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return menus as Menu[];
}

/**
 * Get a single menu by ID
 */
export async function getMenu(id: string): Promise<Menu | null> {
  const menu = await prisma.menu.findUnique({
    where: { id },
  });

  return menu as Menu | null;
}

/**
 * Get a menu with populated recipe details
 */
export async function getMenuWithRecipes(id: string): Promise<(Menu & { recipes: Recipe[] }) | null> {
  const menu = await prisma.menu.findUnique({
    where: { id },
  });

  if (!menu) {
    return null;
  }

  // Fetch all recipes in the menu
  const recipes = await prisma.recipe.findMany({
    where: {
      id: { in: menu.recipeIds },
    },
  });

  // Sort recipes in the order they appear in the menu
  const sortedRecipes = menu.recipeIds
    .map((id) => recipes.find((r) => r.id === id))
    .filter((r): r is Recipe => r !== undefined) as Recipe[];

  return {
    ...(menu as Menu),
    recipes: sortedRecipes,
  };
}

/**
 * Create a new menu
 */
export async function createMenu(input: CreateMenuInput): Promise<Menu> {
  const menu = await prisma.menu.create({
    data: {
      name: input.name,
      recipeIds: input.recipeIds || [],
    },
  });

  return menu as Menu;
}

/**
 * Update an existing menu
 */
export async function updateMenu(input: UpdateMenuInput): Promise<Menu> {
  const { id, ...data } = input;

  // Remove undefined fields
  const updateData: any = {};
  Object.keys(data).forEach((key) => {
    const value = (data as any)[key];
    if (value !== undefined) {
      updateData[key] = value;
    }
  });

  const menu = await prisma.menu.update({
    where: { id },
    data: updateData,
  });

  return menu as Menu;
}

/**
 * Delete a menu
 */
export async function deleteMenu(id: string): Promise<void> {
  await prisma.menu.delete({
    where: { id },
  });
}

/**
 * Add a recipe to a menu
 */
export async function addRecipeToMenu(menuId: string, recipeId: string): Promise<Menu> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Check if recipe already exists in menu
  if (menu.recipeIds.includes(recipeId)) {
    return menu as Menu;
  }

  // Add recipe to menu
  const updatedMenu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      recipeIds: [...menu.recipeIds, recipeId],
    },
  });

  return updatedMenu as Menu;
}

/**
 * Remove a recipe from a menu
 */
export async function removeRecipeFromMenu(menuId: string, recipeId: string): Promise<Menu> {
  const menu = await prisma.menu.findUnique({
    where: { id: menuId },
  });

  if (!menu) {
    throw new Error('Menu not found');
  }

  // Remove recipe from menu
  const updatedMenu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      recipeIds: menu.recipeIds.filter((id) => id !== recipeId),
    },
  });

  return updatedMenu as Menu;
}

/**
 * Clear all recipes from a menu
 */
export async function clearMenu(menuId: string): Promise<Menu> {
  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      recipeIds: [],
    },
  });

  return menu as Menu;
}

/**
 * Reorder recipes in a menu
 */
export async function reorderMenuRecipes(menuId: string, recipeIds: string[]): Promise<Menu> {
  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: {
      recipeIds,
    },
  });

  return menu as Menu;
}

/**
 * Find all menus containing a specific recipe
 */
export async function getMenusContainingRecipe(recipeId: string): Promise<Menu[]> {
  const menus = await prisma.menu.findMany({
    where: {
      recipeIds: {
        has: recipeId,
      },
    },
  });

  return menus as Menu[];
}

/**
 * Remove a recipe from all menus (useful when deleting a recipe)
 */
export async function removeRecipeFromAllMenus(recipeId: string): Promise<void> {
  const menus = await getMenusContainingRecipe(recipeId);

  await Promise.all(
    menus.map((menu) =>
      prisma.menu.update({
        where: { id: menu.id },
        data: {
          recipeIds: menu.recipeIds.filter((id) => id !== recipeId),
        },
      })
    )
  );
}
