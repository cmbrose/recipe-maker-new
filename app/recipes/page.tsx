'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { RecipeList } from '@/components/recipes/RecipeList';
import { RecipeSearch } from '@/components/recipes/RecipeSearch';
import { useInfiniteRecipes, recipeKeys } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/button';
import { AuthButton } from '@/components/auth/AuthButton';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { parseTagsFromUrl } from '@/lib/utils/tag-url';
import type { RecipeFilters } from '@/types/recipe';

function RecipesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RecipeFilters>({});
  const { 
    data, 
    isLoading, 
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteRecipes(filters, 20);

  // Flatten the paginated data
  const recipes = useMemo(() => {
    return data?.pages.flatMap(page => page.recipes) || [];
  }, [data]);

  const totalRecipes = data?.pages[0]?.total || 0;

  // Invalidate recipe lists cache when component mounts to ensure fresh data
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
  }, [queryClient]);

  // Parse URL parameters and set initial filters
  useEffect(() => {
    const tagsFromUrl = parseTagsFromUrl(searchParams);
    const searchFromUrl = searchParams.get('search');
    const sortFromUrl = searchParams.get('sort') as RecipeFilters['sort'];

    setFilters({
      tags: tagsFromUrl.length > 0 ? tagsFromUrl : undefined,
      search: searchFromUrl || undefined,
      sort: sortFromUrl || 'viewed-desc', // Default to recently viewed
    });
  }, [searchParams]);

  // Update URL when filters change
  const handleFiltersChange = (newFilters: RecipeFilters) => {
    setFilters(newFilters);

    const params = new URLSearchParams();
    if (newFilters.search) {
      params.set('search', newFilters.search);
    }
    if (newFilters.tags && newFilters.tags.length > 0) {
      newFilters.tags.forEach(tag => params.append('tags', tag));
    }
    if (newFilters.sort && newFilters.sort !== 'viewed-desc') {
      params.set('sort', newFilters.sort);
    }

    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            {totalRecipes ? `${totalRecipes} recipe${totalRecipes !== 1 ? 's' : ''}` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/recipes/new/from-url">
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </Link>
          </Button>
          <AuthButton href="/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </AuthButton>
        </div>
      </div>

      <RecipeSearch filters={filters} onFiltersChange={handleFiltersChange} />

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            Error loading recipes: {error.message}
          </p>
        </div>
      )}

      <RecipeList 
        recipes={recipes} 
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
      />
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}
