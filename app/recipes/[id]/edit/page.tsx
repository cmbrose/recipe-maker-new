'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeEditor, type RecipeFormValues } from '@/components/recipes/RecipeEditor';
import { recipeApi } from '@/lib/api/client';
import { RequireAuth } from '@/components/auth/RequireAuth';
import type { IngredientGroup } from '@/types/recipe';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditRecipePage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch the recipe
    const { data: recipe, isLoading } = useQuery({
        queryKey: ['recipes', id],
        queryFn: () => recipeApi.get(id),
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: RecipeFormValues) => {
            const recipeData = {
                name: data.name,
                prepTime: data.prepTime || undefined,
                cookTime: data.cookTime || undefined,
                totalTime: data.totalTime || undefined,
                servings: data.servings || undefined,
                ingredients: data.ingredientGroups as IngredientGroup[],
                directions: data.directions,
                previewUrl: data.previewUrl || undefined,
                source: data.source || undefined,
                tags: data.tags || [],
                notes: data.notes || [],
            };
            return recipeApi.update(id, recipeData);
        },
        onSuccess: (updatedRecipe) => {
            // Update the cache
            queryClient.setQueryData(['recipes', id], updatedRecipe);
            queryClient.invalidateQueries({ queryKey: ['recipes'] });

            toast.success('Recipe updated successfully!');

            // Redirect to the recipe detail page
            router.push(`/recipes/${id}`);
        },
        // Remove onError to let RecipeEditor handle errors
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => recipeApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['recipes'] });

            toast.success('Recipe deleted successfully!');

            // Redirect to recipes list
            router.push('/recipes');
        },
        // Remove onError to let RecipeEditor handle errors
    });

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <Skeleton className="h-10 w-64 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <h1 className="text-3xl font-bold">Recipe Not Found</h1>
                <p className="text-muted-foreground mt-2">
                    The recipe you're looking for doesn't exist.
                </p>
            </div>
        );
    }

    return (
        <RequireAuth>
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Edit Recipe</h1>
                    <p className="text-muted-foreground mt-2">
                        Make changes to "{recipe.name}"
                    </p>
                </div>

                <RecipeEditor
                    recipe={recipe}
                    onSave={async (data) => {
                        await updateMutation.mutateAsync(data);
                    }}
                    onDelete={async () => {
                        await deleteMutation.mutateAsync();
                    }}
                    isLoading={updateMutation.isPending || deleteMutation.isPending}
                />
            </div>
        </RequireAuth>
    );
}
