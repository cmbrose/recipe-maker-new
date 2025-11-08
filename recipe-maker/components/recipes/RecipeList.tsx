'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Recipe } from '@/types/recipe';

interface RecipeListProps {
  recipes: Recipe[];
  isLoading: boolean;
}

export function RecipeList({ recipes, isLoading }: RecipeListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No recipes found.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Try adjusting your search or{' '}
          <Link href="/recipes/new" className="text-primary hover:underline">
            create a new recipe
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            {recipe.previewUrl && (
              <div className="aspect-video relative overflow-hidden rounded-t-lg">
                <img
                  src={recipe.previewUrl}
                  alt={recipe.name}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="line-clamp-2">{recipe.name}</CardTitle>
              <CardDescription className="flex gap-2 flex-wrap">
                {recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
                {recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
                {recipe.servings && <span>Serves: {recipe.servings}</span>}
              </CardDescription>
            </CardHeader>
            {recipe.tags && recipe.tags.length > 0 && (
              <CardContent>
                <div className="flex gap-1 flex-wrap">
                  {recipe.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {recipe.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{recipe.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}
