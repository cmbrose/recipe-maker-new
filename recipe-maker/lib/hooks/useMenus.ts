import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '@/lib/api/client';
import type { Menu } from '@/types/menu';

// Query keys
export const menuKeys = {
  all: ['menus'] as const,
  lists: () => [...menuKeys.all, 'list'] as const,
  list: () => [...menuKeys.lists()] as const,
  details: () => [...menuKeys.all, 'detail'] as const,
  detail: (id: string) => [...menuKeys.details(), id] as const,
};

// Queries
export function useMenus() {
  return useQuery({
    queryKey: menuKeys.list(),
    queryFn: () => menuApi.list(),
  });
}

export function useMenu(id: string) {
  return useQuery({
    queryKey: menuKeys.detail(id),
    queryFn: () => menuApi.get(id),
    enabled: !!id,
  });
}

// Mutations
export function useCreateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Menu>) => menuApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Menu> }) =>
      menuApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => menuApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: menuKeys.lists() });
    },
  });
}

export function useAddRecipeToMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuId, recipeId }: { menuId: string; recipeId: string }) =>
      menuApi.addRecipe(menuId, recipeId),
    onSuccess: (_, { menuId }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(menuId) });
    },
  });
}

export function useRemoveRecipeFromMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ menuId, recipeId }: { menuId: string; recipeId: string }) =>
      menuApi.removeRecipe(menuId, recipeId),
    onSuccess: (_, { menuId }) => {
      queryClient.invalidateQueries({ queryKey: menuKeys.detail(menuId) });
    },
  });
}
