'use client';

import Link from 'next/link';
import { useRecipe } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface RecipeDetailProps {
  id: string;
}

export function RecipeDetail({ id }: RecipeDetailProps) {
  const { data: recipe, isLoading, error } = useRecipe(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {error?.message || 'Recipe not found'}
          </p>
        </div>
        <Button asChild className="mt-4">
          <Link href="/recipes">Back to Recipes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{recipe.name}</h1>
          <div className="flex gap-4 text-sm text-muted-foreground">
            {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
            {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
            {recipe.totalTime && <span>Total: {recipe.totalTime} min</span>}
            {recipe.servings && <span>Servings: {recipe.servings}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/recipes/${id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {recipe.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      {recipe.source && (
        <div className="text-sm">
          <span className="text-muted-foreground">Source: </span>
          {recipe.sourceKind === 'url' ? (
            <a
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {recipe.source}
            </a>
          ) : (
            <span>{recipe.source}</span>
          )}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipe.ingredients.map((group, idx) => (
              <div key={idx}>
                {group.name && (
                  <h3 className="font-semibold mb-2">{group.name}</h3>
                )}
                <ul className="space-y-1">
                  {group.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {recipe.directions.map((direction) => (
                <li key={direction.step} className="text-sm">
                  <span className="font-semibold">{direction.step}. </span>
                  {direction.text}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {recipe.previewUrl && (
        <Card>
          <CardContent className="p-0">
            <img
              src={recipe.previewUrl}
              alt={recipe.name}
              className="w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      )}

      {recipe.notes && recipe.notes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.notes.map((note, idx) => (
                <li key={idx} className="text-sm">
                  {note}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
