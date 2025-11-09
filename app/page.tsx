'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { useRecipes } from '@/lib/hooks/useRecipes';
import { Plus, Link as LinkIcon } from 'lucide-react';
import type { Recipe } from '@/types/recipe';

export default function Home() {
  // Fetch recent recipes (limit 6, sorted by creation date desc)
  const { data: recentRecipes, isLoading } = useRecipes({
    sort: 'created-desc',
    limit: 6
  });

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome!</h1>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3 w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Recipe
            </CardTitle>
            <CardDescription>Start with a blank recipe and add your own details</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recipes/new">Create Recipe</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Import from URL
            </CardTitle>
            <CardDescription>Scrape recipes from supported food blogs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recipes/new/from-url">Import Recipe</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browse All</CardTitle>
            <CardDescription>View and search your recipe collection</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/recipes">View All Recipes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Recipes */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent Recipes</h2>
          <Button asChild variant="ghost">
            <Link href="/recipes">View All</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : recentRecipes?.recipes?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentRecipes.recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No recipes yet! Get started by creating or importing your first recipe.</p>
              <div className="flex gap-4 justify-center">
                <Button asChild>
                  <Link href="/recipes/new">Create Recipe</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/recipes/new/from-url">Import Recipe</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Supported Sites */}
      <section className="bg-muted/30 rounded-lg p-6 max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Supported Recipe Sites</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Import recipes directly from these popular food blogs:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>• Budget Bytes</div>
          <div>• Skinny Taste</div>
          <div>• Half Baked Harvest</div>
          <div>• Love and Lemons</div>
          <div>• Sally's Baking Addiction</div>
          <div>• King Arthur Baking</div>
          <div>• Minimalist Baker</div>
          <div>• Yummy Toddler Food</div>
        </div>
      </section>
    </div>
  );
}
