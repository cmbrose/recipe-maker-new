// Core type definitions for Recipe Maker

/**
 * Ingredient group - allows organizing ingredients by section
 * e.g., "For the sauce", "For the dough"
 */
export interface IngredientGroup {
  name?: string;  // Optional group name
  items: string[]; // List of ingredients
}

/**
 * Direction/step in the recipe
 */
export interface Direction {
  step: number;
  text: string;
}

/**
 * Source kind for recipe creation
 */
export type SourceKind = 'url' | 'manual';

/**
 * Complete recipe entity
 */
export interface Recipe {
  id: string;
  name: string;
  prepTime?: number;        // minutes
  cookTime?: number;        // minutes
  totalTime?: number;       // minutes
  servings?: number;
  ingredients: IngredientGroup[];
  directions: Direction[];
  previewUrl?: string;
  source?: string;          // Original URL
  sourceKind: SourceKind;
  tags: string[];
  notes: string[];
  lastViewed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recipe creation input (without generated fields)
 */
export interface CreateRecipeInput {
  name: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients: IngredientGroup[];
  directions: Direction[];
  previewUrl?: string;
  source?: string;
  sourceKind: SourceKind;
  tags?: string[];
  notes?: string[];
}

/**
 * Recipe update input (all fields optional except id)
 */
export interface UpdateRecipeInput {
  id: string;
  name?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  servings?: number;
  ingredients?: IngredientGroup[];
  directions?: Direction[];
  previewUrl?: string;
  source?: string;
  sourceKind?: SourceKind;
  tags?: string[];
  notes?: string[];
  lastViewed?: Date;
}

/**
 * Recipe filter options
 */
export interface RecipeFilters {
  search?: string;     // Search in name
  tags?: string[];     // Filter by tags (AND logic)
  sourceKind?: SourceKind;
  sort?: 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc' | 'viewed-asc' | 'viewed-desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated recipe result
 */
export interface RecipeListResult {
  recipes: Recipe[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
