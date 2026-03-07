'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpDown, Search, Trash2 } from 'lucide-react';
import { TagInput } from '@/components/shared/TagInput';
import type { RecipeFilters } from '@/types/recipe';

interface RecipeSearchProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

export function RecipeSearch({ filters, onFiltersChange }: RecipeSearchProps) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sort = e.target.value as RecipeFilters['sort'];
    onFiltersChange({
      ...filters,
      sort
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      sort: 'viewed-desc' // Reset to default sort
    });
  };

  const hasFilters = filters.search ||
    (filters.tags && filters.tags.length > 0) ||
    (filters.sort && filters.sort !== 'viewed-desc');

  return (
    <div className="flex gap-3 items-center flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search recipes..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
      </div>

      {/* Tag Filter Input */}
      <div className="relative min-w-[180px] max-w-[320px] flex-1">
        <TagInput
          value={filters.tags ?? []}
          onChange={(tags) =>
            onFiltersChange({
              ...filters,
              tags: tags.length > 0 ? tags : undefined,
            })
          }
          placeholder="Filter by tags..."
        />
      </div>

      {/* Sort Dropdown */}
      <div className="relative min-w-[180px]">
        <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <select
          value={filters.sort || 'viewed-desc'}
          onChange={handleSortChange}
          className="w-full h-10 pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
        >
          <option value="viewed-desc">Recently viewed</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="created-desc">Newest first</option>
          <option value="created-asc">Oldest first</option>
          <option value="viewed-asc">Least recently viewed</option>
        </select>
      </div>

      {/* Clear All Button - Always Visible */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        disabled={!hasFilters}
        className="p-2"
        aria-label="Clear all filters"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
