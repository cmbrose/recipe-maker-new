'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { RecipeFilters } from '@/types/recipe';

interface RecipeSearchProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

export function RecipeSearch({ filters, onFiltersChange }: RecipeSearchProps) {
  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove);
    onFiltersChange({
      ...filters,
      tags: newTags && newTags.length > 0 ? newTags : undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = filters.search || (filters.tags && filters.tags.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          type="search"
          placeholder="Search recipes..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="max-w-sm"
        />
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Tag Filters */}
      {filters.tags && filters.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filtered by tags:</span>
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-secondary/80">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
                aria-label={`Remove ${tag} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
