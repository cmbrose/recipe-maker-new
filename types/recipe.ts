// Core type definitions for Recipe Maker

/**
 * Ingredient group - allows organizing ingredients by section
 * e.g., "For the sauce", "For the dough"
 */
export interface IngredientGroup {
  name?: string;  // Optional group name
  ingredients: string[]; // List of ingredients
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
  prepTime?: string;        // minutes
  cookTime?: string;        // minutes
  totalTime?: string;       // minutes
  servings?: string;
  ingredients: IngredientGroup[];
  directions: string[];
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
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: IngredientGroup[];
  directions: string[];
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
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients?: IngredientGroup[];
  directions?: string[];
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
