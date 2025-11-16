'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MenuEditor, type MenuFormValues } from '@/components/menus/MenuEditor';
import { menuApi, recipeApi } from '@/lib/api/client';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function NewMenuPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    // Fetch all recipes for the picker
    const { data: recipesData } = useQuery({
        queryKey: ['recipes'],
        queryFn: () => recipeApi.list(),
    });

    const createMutation = useMutation({
        mutationFn: (data: MenuFormValues) => {
            return menuApi.create({
                name: data.name,
                recipeIds: data.recipeIds || [],
            });
        },
        onSuccess: (menu) => {
            queryClient.invalidateQueries({ queryKey: ['menus'] });

            toast.success('Menu created successfully!');

            router.push(`/menus/${menu.id}`);
        },
        onError: (error: Error) => {
            toast.error(`Failed to create menu: ${error.message}`);
        },
    });

    return (
        <AuthGuard action="create menus">
            <div className="container mx-auto py-8 px-4 max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold">Create New Menu</h1>
                    <p className="text-muted-foreground mt-2">
                        Create a collection of recipes for meal planning
                    </p>
                </div>

                <MenuEditor
                    availableRecipes={recipesData?.recipes || []}
                    onSave={async (data) => {
                        await createMutation.mutateAsync(data);
                    }}
                    isLoading={createMutation.isPending}
                />
            </div>
        </AuthGuard>
    );
}
