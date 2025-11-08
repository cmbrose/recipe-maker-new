// Menu type definitions

/**
 * Menu entity - collection of recipes
 */
export interface Menu {
  id: string;
  name: string;
  recipeIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Menu creation input
 */
export interface CreateMenuInput {
  name: string;
  recipeIds?: string[];
}

/**
 * Menu update input
 */
export interface UpdateMenuInput {
  id: string;
  name?: string;
  recipeIds?: string[];
}

/**
 * Add recipe to menu input
 */
export interface AddRecipeToMenuInput {
  menuId: string;
  recipeId: string;
}

/**
 * Remove recipe from menu input
 */
export interface RemoveRecipeFromMenuInput {
  menuId: string;
  recipeId: string;
}
