'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

interface CreateFromUrlProps {
    onSuccess?: (recipeId: string) => void;
}

export function CreateFromUrl({ onSuccess }: CreateFromUrlProps) {
    const router = useRouter();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!url.trim()) {
            setError('Please enter a URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            setError('Please enter a valid URL');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/recipes/from-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Failed to fetch recipe' }));
                throw new Error(error.message || error.error || 'Failed to scrape recipe from URL');
            }

            const data = await response.json();
            const recipe = data.data || data;

            // Success! Redirect to the new recipe or call onSuccess callback
            if (onSuccess) {
                onSuccess(recipe.id);
            } else {
                router.push(`/recipes/${recipe.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Recipe from URL</CardTitle>
                <CardDescription>
                    Enter a URL from a supported recipe website to automatically import the recipe
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="url"
                            placeholder="https://example.com/recipe"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">
                            Supported sites: Budget Bytes, Skinny Taste, Half Baked Harvest, Love and Lemons,
                            Yummy Toddler Food, Sally's Baking Addiction, King Arthur Baking, Minimalist Baker
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="flex-1">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importing Recipe...
                                </>
                            ) : (
                                'Import Recipe'
                            )}
                        </Button>
                    </div>
                </form>

                {isLoading && (
                    <div className="mt-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Fetching recipe from website...</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This may take a few seconds depending on the website.
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
