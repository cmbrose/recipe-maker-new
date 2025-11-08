'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeEditor, type RecipeFormValues } from '@/components/recipes/RecipeEditor';
import { recipeApi } from '@/lib/api/client';
import type { IngredientGroup } from '@/types/recipe';
import { toast } from 'sonner';

export default function NewRecipePage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: (data: RecipeFormValues) => {
            // Transform form data to match API structure
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
                sourceKind: 'manual' as const,
                tags: data.tags || [],
                notes: data.notes || [],
            };
            return recipeApi.create(recipeData);
        },
        onSuccess: (recipe) => {
            // Invalidate queries to refresh lists
            queryClient.invalidateQueries({ queryKey: ['recipes'] });

            toast.success('Recipe created successfully!');

            // Redirect to the new recipe
            router.push(`/recipes/${recipe.id}`);
        },
        // Remove onError to let RecipeEditor handle errors
    });

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Create New Recipe</h1>
                <p className="text-muted-foreground mt-2">
                    Enter the details of your recipe manually
                </p>
            </div>

            <RecipeEditor
                onSave={async (data) => {
                    await createMutation.mutateAsync(data);
                }}
                isLoading={createMutation.isPending}
            />
        </div>
    );
}
