'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTagFilterUrl } from '@/lib/utils/tag-url';
import type { Recipe } from '@/types/recipe';

interface RecipeCardProps {
    recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
    return (
        <Card className="h-full hover:shadow-lg transition-shadow">
            <Link href={`/recipes/${recipe.id}`}>
                <CardHeader>
                    <CardTitle className="line-clamp-2">{recipe.name}</CardTitle>
                    <CardDescription className="flex gap-2 flex-wrap">
                        {recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
                        {recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
                        {recipe.servings && <span>Serves: {recipe.servings}</span>}
                    </CardDescription>
                </CardHeader>
            </Link>
            {recipe.previewUrl && (
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                        src={recipe.previewUrl}
                        alt={recipe.name}
                        className="object-cover w-full h-full"
                    />
                </div>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
                <CardContent>
                    <div className="flex gap-1 flex-wrap">
                        {recipe.tags.slice(0, 3).map((tag) => (
                            <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs hover:bg-secondary/80 cursor-pointer"
                                asChild
                            >
                                <Link href={getTagFilterUrl(tag)} onClick={(e) => e.stopPropagation()}>
                                    {tag}
                                </Link>
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
    );
}