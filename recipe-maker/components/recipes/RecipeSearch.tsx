'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { RecipeFilters } from '@/types/recipe';

interface RecipeSearchProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

export function RecipeSearch({ filters, onFiltersChange }: RecipeSearchProps) {
  return (
    <div className="flex gap-4">
      <Input
        type="search"
        placeholder="Search recipes..."
        value={filters.search || ''}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="max-w-sm"
      />
      {filters.search && (
        <Button
          variant="ghost"
          onClick={() => onFiltersChange({ ...filters, search: undefined })}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
