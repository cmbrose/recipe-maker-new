'use client';

import Link from 'next/link';
import { useMenus } from '@/lib/hooks/useMenus';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';

export default function MenusPage() {
  const { data, isLoading, error } = useMenus();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Error loading menus: {error.message}</p>
      </div>
    );
  }

  const menus = data?.menus || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menus</h1>
          <p className="text-muted-foreground">
            {menus.length} menu{menus.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/menus/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Menu
          </Button>
        </Link>
      </div>

      {menus.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No menus yet.</p>
          <Button asChild className="mt-4">
            <Link href="/menus/new">Create your first menu</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.map((menu) => (
            <Link key={menu.id} href={`/menus/${menu.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{menu.name}</CardTitle>
                  <CardDescription>
                    {menu.recipeIds.length} recipe{menu.recipeIds.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
