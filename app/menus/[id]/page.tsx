'use client';

import Link from 'next/link';
import { use } from 'react';
import { useMenu } from '@/lib/hooks/useMenus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { AuthTooltipButton } from '@/components/auth/AuthTooltipButton';

export default function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: menu, isLoading, error } = useMenu(id);
  const { status } = useSession();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error?.message || 'Menu not found'}</p>
        </div>
        <Button asChild className="mt-4">
          <Link href="/menus">Back to Menus</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{menu.name}</h1>
          <p className="text-muted-foreground mt-2">
            {menu.recipeIds.length} recipe{menu.recipeIds.length !== 1 ? 's' : ''}
          </p>
        </div>
        {status === 'authenticated' ? (
          <Button asChild variant="outline">
            <Link href={`/menus/${id}/edit`}>Edit</Link>
          </Button>
        ) : (
          <AuthTooltipButton message="Sign in to edit menus" variant="outline">
            Edit
          </AuthTooltipButton>
        )}
      </div>

      {menu.recipeIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No recipes in this menu yet.</p>
            {status === 'authenticated' ? (
              <Button asChild className="mt-4">
                <Link href={`/menus/${id}/edit`}>Add Recipes</Link>
              </Button>
            ) : (
              <div className="mt-4">
                <AuthTooltipButton
                  message="Sign in to add recipes to this menu"
                  className="w-full"
                  containerClassName="items-center"
                >
                  Add Recipes
                </AuthTooltipButton>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {menu.recipeIds.map((recipeId, idx) => (
                <Link
                  key={recipeId}
                  href={`/recipes/${recipeId}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="text-sm text-muted-foreground w-6">{idx + 1}.</span>
                  <span className="text-sm font-medium">Recipe {recipeId}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
