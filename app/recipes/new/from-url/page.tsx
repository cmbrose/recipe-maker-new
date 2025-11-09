'use client';

import { CreateFromUrl } from '@/components/recipes/CreateFromUrl';

export default function NewFromUrlPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Import Recipe from URL</h1>
                <p className="text-muted-foreground mt-2">
                    Automatically extract recipe details from supported websites
                </p>
            </div>

            <CreateFromUrl />
        </div>
    );
}
