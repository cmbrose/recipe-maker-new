'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuEditor, MenuFormValues } from '@/components/menus/MenuEditor';
import { menuApi, recipeApi } from '@/lib/api/client';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditMenuPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch the menu
    const { data: menu, isLoading: isLoadingMenu } = useQuery({
        queryKey: ['menus', id],
        queryFn: () => menuApi.get(id),
    });

    // Fetch all recipes for the picker and to show selected recipes
    const { data: recipesData } = useQuery({
        queryKey: ['recipes'],
        queryFn: () => recipeApi.list(),
    });

    // Get recipes that are in this menu
    const menuRecipes = recipesData?.recipes.filter(r =>
        menu?.recipeIds.includes(r.id)
    ) || [];

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: (data: MenuFormValues) => {
            return menuApi.update(id, {
                name: data.name,
                recipeIds: data.recipeIds || [],
            });
        },
        onSuccess: (updatedMenu) => {
            queryClient.setQueryData(['menus', id], updatedMenu);
            queryClient.invalidateQueries({ queryKey: ['menus'] });

            toast.success('Menu updated successfully!');

            router.push(`/menus/${id}`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to update menu: ${error.message}`);
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: () => menuApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });

            toast.success('Menu deleted successfully!');

            router.push('/menus');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete menu: ${error.message}`);
        },
    });

    if (isLoadingMenu) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <Skeleton className="h-10 w-64 mb-6" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            </div>
        );
    }

    if (!menu) {
        return (
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <h1 className="text-3xl font-bold">Menu Not Found</h1>
                <p className="text-muted-foreground mt-2">
                    The menu you're looking for doesn't exist.
                </p>
            </div>
        );
    }

    return (
        <RequireAuth>
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Edit Menu</h1>
                    <p className="text-muted-foreground mt-2">
                        Make changes to "{menu.name}"
                    </p>
                </div>

                <MenuEditor
                    menu={menu}
                    recipes={menuRecipes}
                    availableRecipes={recipesData?.recipes || []}
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
