'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RecipeList } from '@/components/recipes/RecipeList';
import { RecipeSearch } from '@/components/recipes/RecipeSearch';
import { useRecipes } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/button';
import { Plus, Link as LinkIcon } from 'lucide-react';
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
        <div className="flex gap-2">
          <Link href="/recipes/new/from-url">
            <Button variant="outline">
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </Button>
          </Link>
          <Link href="/recipes/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </Link>
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
