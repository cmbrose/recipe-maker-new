'use client';

import Link from 'next/link';
import { useRecipe } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ClickableTag } from '@/components/shared/ClickableTag';
import { useSession } from 'next-auth/react';
import { AuthTooltipButton } from '@/components/auth/AuthTooltipButton';

interface RecipeDetailProps {
  id: string;
}

export function RecipeDetail({ id }: RecipeDetailProps) {
  const { data: recipe, isLoading, error } = useRecipe(id);
  const { status } = useSession();

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title with Tags and Edit Button Inline */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h1 className="text-4xl font-bold tracking-tight flex-1">{recipe.name}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {recipe.tags && recipe.tags.length > 0 ? (
              recipe.tags.map((tag) => (
                <ClickableTag key={tag} tag={tag} />
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No tags</span>
            )}
          </div>
          {status === 'authenticated' ? (
            <Button asChild variant="outline">
              <Link href={`/recipes/${id}/edit`}>Edit</Link>
            </Button>
          ) : (
            <AuthTooltipButton message="Sign in to edit recipes" variant="outline">
              Edit
            </AuthTooltipButton>
          )}
        </div>
      </div>

      {/* Two Column Layout - 5/12 and 7/12 split */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Ingredients (5/12) */}
        <div className="md:col-span-5 space-y-6">
          {/* Preview Image (only above ingredients) */}
          {recipe.previewUrl && (
            <img
              src={recipe.previewUrl}
              alt={recipe.name}
              className="w-full h-auto rounded-lg mb-4"
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              {recipe.servings && (
                <p className="text-sm text-muted-foreground">
                  Servings: {recipe.servings}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {recipe.ingredients.map((group, idx) => (
                <div key={idx}>
                  {group.name && (
                    <h3 className="font-semibold mb-2">{group.name}</h3>
                  )}
                  <ul className="space-y-1">
                    {group.ingredients.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-sm">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Directions and Notes (7/12) */}
        <div className="md:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Directions</CardTitle>
              <div className="flex gap-4 text-sm text-muted-foreground">
                {recipe.prepTime && <span>Prep: {recipe.prepTime}</span>}
                {recipe.cookTime && <span>Cook: {recipe.cookTime}</span>}
                {recipe.totalTime && <span>Total: {recipe.totalTime}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {recipe.directions.map((direction, idx) => (
                  <li key={idx} className="text-sm">
                    <span className="font-semibold">{idx + 1}. </span>
                    {direction}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {recipe.notes && recipe.notes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.notes.map((note, idx) => (
                    <li key={idx} className="text-sm">
                      • {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Source URL at bottom */}
      {recipe.source && (
        <div className="text-xs italic text-muted-foreground/60 pt-4">
          {recipe.sourceKind === 'url' ? (
            <a
              href={recipe.source}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground/80"
            >
              Source: {recipe.source}
            </a>
          ) : (
            <span>Source: {recipe.source}</span>
          )}
        </div>
      )}
    </div>
  );
}
