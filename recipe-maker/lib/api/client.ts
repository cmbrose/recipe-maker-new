// API client for fetching data from the backend

import type { Recipe, RecipeFilters } from '@/types/recipe';
import type { Menu } from '@/types/menu';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

// Recipe API
export const recipeApi = {
  list: async (filters?: RecipeFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.tags) params.append('tags', filters.tags.join(','));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString();
    return fetchAPI<{ recipes: Recipe[]; total: number }>(
      `/api/recipes${query ? `?${query}` : ''}`
    );
  },

  get: async (id: string) => {
    return fetchAPI<Recipe>(`/api/recipes/${id}`);
  },

  create: async (data: Partial<Recipe>) => {
    return fetchAPI<Recipe>(`/api/recipes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Recipe>) => {
    return fetchAPI<Recipe>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<void>(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  createFromUrl: async (url: string) => {
    return fetchAPI<Recipe>(`/api/recipes/from-url`, {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  },
};

// Menu API
export const menuApi = {
  list: async () => {
    return fetchAPI<{ menus: Menu[]; total: number }>(`/api/menus`);
  },

  get: async (id: string) => {
    return fetchAPI<Menu>(`/api/menus/${id}`);
  },

  create: async (data: Partial<Menu>) => {
    return fetchAPI<Menu>(`/api/menus`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<Menu>) => {
    return fetchAPI<Menu>(`/api/menus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchAPI<void>(`/api/menus/${id}`, {
      method: 'DELETE',
    });
  },

  addRecipe: async (menuId: string, recipeId: string) => {
    return fetchAPI<Menu>(`/api/menus/${menuId}/recipes`, {
      method: 'POST',
      body: JSON.stringify({ recipeId }),
    });
  },

  removeRecipe: async (menuId: string, recipeId: string) => {
    return fetchAPI<Menu>(`/api/menus/${menuId}/recipes/${recipeId}`, {
      method: 'DELETE',
    });
  },
};
