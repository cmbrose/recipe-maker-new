'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import type { Menu } from '@/types/menu';
import type { Recipe } from '@/types/recipe';

// Validation schema
const menuSchema = z.object({
    name: z.string().min(1, 'Menu name is required').max(200, 'Name is too long'),
    recipeIds: z.array(z.string()),
});

export type MenuFormValues = z.infer<typeof menuSchema>;

interface MenuEditorProps {
    menu?: Menu;
    recipes?: Recipe[];
    onSave: (data: MenuFormValues) => Promise<void>;
    onDelete?: () => Promise<void>;
    isLoading?: boolean;
    availableRecipes?: Recipe[];
}

export function MenuEditor({
    menu,
    recipes = [],
    onSave,
    onDelete,
    isLoading,
    availableRecipes = []
}: MenuEditorProps) {
    const [showAddRecipeDialog, setShowAddRecipeDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize form with existing menu data or defaults
    const form = useForm<MenuFormValues>({
        resolver: zodResolver(menuSchema),
        defaultValues: menu
            ? {
                name: menu.name,
                recipeIds: menu.recipeIds || [],
            }
            : {
                name: '',
                recipeIds: [],
            },
    });

    const handleSubmit = async (data: MenuFormValues) => {
        await onSave(data);
    };

    const addRecipe = (recipeId: string) => {
        const currentIds = form.getValues('recipeIds');
        if (!currentIds.includes(recipeId)) {
            form.setValue('recipeIds', [...currentIds, recipeId]);
        }
        setShowAddRecipeDialog(false);
        setSearchQuery('');
    };

    const removeRecipe = (recipeId: string) => {
        const currentIds = form.getValues('recipeIds');
        form.setValue('recipeIds', currentIds.filter(id => id !== recipeId));
    };

    // Get recipe details for selected recipes using useWatch to avoid React Compiler warnings
    const recipeIds = useWatch({ control: form.control, name: 'recipeIds' }) || [];
    const selectedRecipes = recipeIds
        .map(id => recipes.find(r => r.id === id) || availableRecipes.find(r => r.id === id))
        .filter((r): r is Recipe => r !== undefined);

    // Filter available recipes for the dialog
    const filteredAvailableRecipes = availableRecipes.filter(recipe => {
        const alreadyAdded = form.getValues('recipeIds').includes(recipe.id);
        const matchesSearch = searchQuery.trim() === '' ||
            recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
        return !alreadyAdded && matchesSearch;
    });

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    {/* Menu Name */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Menu Details</h2>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Menu Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Weekly Dinner Plan" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Recipes */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Recipes</h2>
                            <Dialog open={showAddRecipeDialog} onOpenChange={setShowAddRecipeDialog}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="outline" size="sm">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Recipe
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Add Recipe to Menu</DialogTitle>
                                        <DialogDescription>
                                            Search and select recipes to add to your menu
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search recipes..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            {filteredAvailableRecipes.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-8">
                                                    {searchQuery ? 'No recipes found matching your search' : 'No recipes available to add'}
                                                </p>
                                            ) : (
                                                filteredAvailableRecipes.map(recipe => (
                                                    <Card
                                                        key={recipe.id}
                                                        className="cursor-pointer hover:bg-accent transition-colors"
                                                        onClick={() => addRecipe(recipe.id)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-4">
                                                                {recipe.previewUrl && (
                                                                    <img
                                                                        src={recipe.previewUrl}
                                                                        alt={recipe.name}
                                                                        className="w-16 h-16 object-cover rounded"
                                                                    />
                                                                )}
                                                                <div className="flex-1">
                                                                    <h3 className="font-medium">{recipe.name}</h3>
                                                                    {recipe.tags.length > 0 && (
                                                                        <div className="flex gap-1 mt-1">
                                                                            {recipe.tags.slice(0, 3).map((tag, i) => (
                                                                                <span
                                                                                    key={i}
                                                                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                                                                                >
                                                                                    {tag}
                                                                                </span>
                                                                            ))}
                                                                            {recipe.tags.length > 3 && (
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    +{recipe.tags.length - 3}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button type="button" size="sm">
                                                                    Add
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {selectedRecipes.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <p className="text-muted-foreground">
                                        No recipes added yet. Click "Add Recipe" to get started.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {selectedRecipes.map((recipe) => (
                                    <Card key={recipe.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-4">
                                                {recipe.previewUrl && (
                                                    <img
                                                        src={recipe.previewUrl}
                                                        alt={recipe.name}
                                                        className="w-20 h-20 object-cover rounded"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-lg">{recipe.name}</h3>
                                                    {recipe.tags.length > 0 && (
                                                        <div className="flex gap-1 mt-1">
                                                            {recipe.tags.slice(0, 5).map((tag, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {recipe.tags.length > 5 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{recipe.tags.length - 5}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(recipe.prepTime || recipe.cookTime || recipe.servings) && (
                                                        <div className="flex gap-3 mt-2 text-sm text-muted-foreground">
                                                            {recipe.prepTime && <span>Prep: {recipe.prepTime}m</span>}
                                                            {recipe.cookTime && <span>Cook: {recipe.cookTime}m</span>}
                                                            {recipe.servings && <span>Servings: {recipe.servings}</span>}
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeRecipe(recipe.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between border-t pt-6">
                        <div>
                            {onDelete && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => setShowDeleteDialog(true)}
                                    disabled={isLoading}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Menu
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Saving...' : menu ? 'Update Menu' : 'Create Menu'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the menu.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setShowDeleteDialog(false);
                                onDelete?.();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
