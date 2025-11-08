import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Recipe Maker</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Organize your recipes, plan your meals, and import recipes from your favorite food blogs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Browse Recipes</CardTitle>
            <CardDescription>View and search your recipe collection</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recipes">View Recipes</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import from URL</CardTitle>
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
            <CardTitle>Plan Menus</CardTitle>
            <CardDescription>Create and manage meal plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/menus">View Menus</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg max-w-2xl">
        <h2 className="text-lg font-semibold mb-2">Supported Recipe Sites</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Import recipes directly from these popular food blogs:
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>• Budget Bytes</div>
          <div>• Skinny Taste</div>
          <div>• Half Baked Harvest</div>
          <div>• Love and Lemons</div>
          <div>• Sally's Baking Addiction</div>
          <div>• King Arthur Baking</div>
          <div>• Minimalist Baker</div>
          <div>• Yummy Toddler Food</div>
        </div>
      </div>
    </div>
  );
}
