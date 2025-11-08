'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller, useWatch, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
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
import type { Recipe } from '@/types/recipe';

// Generic auto-expanding field array hook
function useAutoExpandingFieldArray<T>({
    control,
    name,
    newItemValue,
    isEmpty,
}: {
    control: Control<RecipeFormValues>;
    name: any;
    newItemValue: T;
    isEmpty: (item: T) => boolean;
}) {
    const { fields, append, remove } = useFieldArray({ control, name });
    const items = useWatch({ control, name }) || [];
    const inputRefs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([]);

    useEffect(() => {
        // Ensure at least one field exists
        if (fields.length === 0) {
            append(newItemValue);
            return;
        }

        // Don't do anything if items hasn't caught up with fields yet
        if (items.length === 0 && fields.length > 0) {
            return;
        }

        // Auto-expand when last item has content
        const lastItem = items[items.length - 1];
        if (lastItem !== undefined && !isEmpty(lastItem)) {
            const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
            const wasFieldFocused = inputRefs.current.includes(activeElement);

            append(newItemValue);

            if (wasFieldFocused) {
                requestAnimationFrame(() => {
                    activeElement?.focus();
                });
            }
        }
    }, [items, fields.length, append, newItemValue, isEmpty]);

    return { fields, remove, inputRefs };
}

// Validation schema
// Note: Using unions with empty strings to support HTML input behavior
// The form handles conversion to proper types on submit
// Arrays allow empty strings for auto-expanding UX; empty items are filtered before save
const recipeSchema = z.object({
    name: z.string().min(1, 'Recipe name is required').max(200, 'Name is too long'),
    prepTime: z.union([z.number().int().min(0), z.literal('')]).optional(),
    cookTime: z.union([z.number().int().min(0), z.literal('')]).optional(),
    totalTime: z.union([z.number().int().min(0), z.literal('')]).optional(),
    servings: z.union([z.number().int().min(1), z.literal('')]).optional(),
    previewUrl: z.union([z.string().url(), z.literal('')]).optional(),
    source: z.union([z.string().url(), z.literal('')]).optional(),
    tags: z.array(z.string()),
    notes: z.array(z.string()),
    ingredientGroups: z.array(
        z.object({
            name: z.string().optional(),
            items: z.array(z.string()),
        })
    ).min(1, 'At least one ingredient group is required'),
    directions: z.array(z.string()).min(1, 'At least one direction is required'),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

interface RecipeEditorProps {
    recipe?: Recipe;
    onSave: (data: RecipeFormValues) => Promise<void>;
    onDelete?: () => Promise<void>;
    isLoading?: boolean;
}

// Separate component for ingredient items to avoid Rules of Hooks violation
function IngredientGroupItems({ control, groupIndex }: { control: Control<RecipeFormValues>; groupIndex: number }) {
    const { fields, remove, inputRefs } = useAutoExpandingFieldArray({
        control,
        name: `ingredientGroups.${groupIndex}.items` as any,
        newItemValue: '',
        isEmpty: (item: string) => item.trim() === '',
    });

    return (
        <>
            {fields.map((item, itemIndex) => (
                <div key={item.id} className="flex items-center gap-2">
                    <Controller
                        control={control}
                        name={`ingredientGroups.${groupIndex}.items.${itemIndex}` as any}
                        render={({ field }) => (
                            <Input
                                placeholder="e.g., 2 cups flour"
                                value={field.value || ''}
                                onChange={field.onChange}
                                className="flex-1"
                                ref={(el) => {
                                    inputRefs.current[itemIndex] = el;
                                }}
                            />
                        )}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(itemIndex)}
                        className="shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </>
    );
}

export function RecipeEditor({ recipe, onSave, onDelete, isLoading }: RecipeEditorProps) {
    const [tagInput, setTagInput] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Initialize form with existing recipe data or defaults
    const form = useForm<RecipeFormValues>({
        // Type assertion needed due to React Hook Form + Zod complex type inference limitations
        // See: https://github.com/react-hook-form/resolvers/issues/271
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(recipeSchema) as any,
        defaultValues: recipe
            ? {
                name: recipe.name,
                prepTime: recipe.prepTime || '',
                cookTime: recipe.cookTime || '',
                totalTime: recipe.totalTime || '',
                servings: recipe.servings || '',
                previewUrl: recipe.previewUrl || '',
                source: recipe.source || '',
                tags: recipe.tags || [],
                notes: recipe.notes || [],
                ingredientGroups: recipe.ingredients || [],
                directions: recipe.directions || [],
            }
            : {
                name: '',
                prepTime: '',
                cookTime: '',
                totalTime: '',
                servings: '',
                previewUrl: '',
                source: '',
                tags: [],
                notes: [],
                ingredientGroups: [{ name: '', items: [] }],
                directions: [],
            },
    });

    const { fields: ingredientGroupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
        control: form.control,
        name: 'ingredientGroups',
    });

    // Use useWatch to avoid React Compiler warnings
    const tags = useWatch({ control: form.control, name: 'tags' }) || [];

    const { fields: directionFields, remove: removeDirection, inputRefs: directionInputRefs } = useAutoExpandingFieldArray({
        control: form.control,
        name: 'directions',
        newItemValue: '',
        isEmpty: (item: string) => item.trim() === '',
    });

    const { fields: noteFields, remove: removeNote, inputRefs: noteInputRefs } = useAutoExpandingFieldArray({
        control: form.control,
        name: 'notes',
        newItemValue: '',
        isEmpty: (item: string) => item.trim() === '',
    });

    const handleSubmit = async (data: RecipeFormValues) => {
        // Convert empty strings to undefined for optional numeric fields
        // Filter out empty items from arrays
        const cleanData = {
            ...data,
            prepTime: data.prepTime === '' ? undefined : Number(data.prepTime),
            cookTime: data.cookTime === '' ? undefined : Number(data.cookTime),
            totalTime: data.totalTime === '' ? undefined : Number(data.totalTime),
            servings: data.servings === '' ? undefined : Number(data.servings),
            previewUrl: data.previewUrl === '' ? undefined : data.previewUrl,
            source: data.source === '' ? undefined : data.source,
            ingredientGroups: data.ingredientGroups
                .map(group => ({
                    ...group,
                    items: group.items.filter(item => item.trim() !== ''),
                }))
                .filter(group => group.items.length > 0),
            directions: data.directions.filter(dir => dir.trim() !== ''),
            notes: data.notes.filter(note => note.trim() !== ''),
        };
        await onSave(cleanData);
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !form.getValues('tags').includes(trimmed)) {
            form.setValue('tags', [...form.getValues('tags'), trimmed]);
            setTagInput('');
        }
    };

    const removeTag = (index: number) => {
        const tags = form.getValues('tags');
        form.setValue('tags', tags.filter((_, i) => i !== index));
    };



    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Basic Information</h2>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recipe Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Chocolate Chip Cookies" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="prepTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prep Time (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="15" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="cookTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cook Time (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="30" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="totalTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Total Time (min)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="45" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="servings"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Servings</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="4" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="previewUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/image.jpg" {...field} />
                                    </FormControl>
                                    <FormDescription>Optional URL to an image of the recipe</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Source URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://example.com/recipe" {...field} />
                                    </FormControl>
                                    <FormDescription>Original recipe source (if applicable)</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Ingredients */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Ingredients</h2>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => appendGroup({ name: '', items: [''] })}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Group
                            </Button>
                        </div>

                        {ingredientGroupFields.map((group, groupIndex) => (
                            <div key={group.id} className="border rounded-lg p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Controller
                                        control={form.control}
                                        name={`ingredientGroups.${groupIndex}.name`}
                                        render={({ field }) => (
                                            <Input
                                                placeholder="Group name (optional, e.g., 'For the sauce')"
                                                value={field.value || ''}
                                                onChange={field.onChange}
                                                className="flex-1"
                                            />
                                        )}
                                    />
                                    {ingredientGroupFields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeGroup(groupIndex)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <IngredientGroupItems control={form.control} groupIndex={groupIndex} />
                            </div>
                        ))}
                    </div>

                    {/* Directions */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Directions</h2>

                        {directionFields.map((direction, index) => (
                            <div key={direction.id} className="space-y-2">
                                <FormField
                                    control={form.control}
                                    name={`directions.${index}` as any}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Step {index + 1}</FormLabel>
                                            <div className="flex gap-2">
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe this step..."
                                                        className="flex-1"
                                                        {...field}
                                                        ref={(el) => {
                                                            directionInputRefs.current[index] = el;
                                                        }}
                                                    />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeDirection(index)}
                                                    className="shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Tags */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Tags</h2>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a tag (e.g., dinner, dessert, quick)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addTag} variant="outline">
                                Add
                            </Button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                    <div
                                        key={index}
                                        className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(index)}
                                            className="hover:text-primary/70"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Notes</h2>
                        {noteFields.map((note, index) => (
                            <div key={note.id} className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`notes.${index}` as any}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder="Add a note..."
                                                    {...field}
                                                    ref={(el) => {
                                                        noteInputRefs.current[index] = el;
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeNote(index)}
                                    className="shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
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
                                    Delete Recipe
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
                                {isLoading ? 'Saving...' : recipe ? 'Update Recipe' : 'Create Recipe'}
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
                            This action cannot be undone. This will permanently delete the recipe.
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
