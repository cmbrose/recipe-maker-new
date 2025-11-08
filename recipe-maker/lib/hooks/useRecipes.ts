import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeApi } from '@/lib/api/client';
import type { Recipe, RecipeFilters } from '@/types/recipe';

// Query keys
export const recipeKeys = {
  all: ['recipes'] as const,
  lists: () => [...recipeKeys.all, 'list'] as const,
  list: (filters: RecipeFilters) => [...recipeKeys.lists(), filters] as const,
  details: () => [...recipeKeys.all, 'detail'] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
};

// Queries
export function useRecipes(filters: RecipeFilters = {}) {
  return useQuery({
    queryKey: recipeKeys.list(filters),
    queryFn: () => recipeApi.list(filters),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => recipeApi.get(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Recipe>) => recipeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Recipe> }) =>
      recipeApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recipeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}

export function useCreateRecipeFromUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => recipeApi.createFromUrl(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    },
  });
}
