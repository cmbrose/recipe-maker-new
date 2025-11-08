'use client';

import { useState } from 'react';
import { RecipeList } from '@/components/recipes/RecipeList';
import { RecipeSearch } from '@/components/recipes/RecipeSearch';
import { useRecipes } from '@/lib/hooks/useRecipes';
import type { RecipeFilters } from '@/types/recipe';

export default function RecipesPage() {
  const [filters, setFilters] = useState<RecipeFilters>({});
  const { data, isLoading, error } = useRecipes(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            {data?.total ? `${data.total} recipe${data.total !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
      </div>

      <RecipeSearch filters={filters} onFiltersChange={setFilters} />

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error loading recipes: {error.message}
          </p>
        </div>
      )}

      <RecipeList recipes={data?.recipes || []} isLoading={isLoading} />
    </div>
  );
}
