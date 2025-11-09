'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowUpDown, Search, Tag, Trash2 } from 'lucide-react';
import type { RecipeFilters } from '@/types/recipe';

interface RecipeSearchProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: RecipeFilters) => void;
}

export function RecipeSearch({ filters, onFiltersChange }: RecipeSearchProps) {
  const [newTag, setNewTag] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove);
    onFiltersChange({
      ...filters,
      tags: newTags && newTags.length > 0 ? newTags : undefined
    });
    // Focus back to input after removing tag
    setTimeout(() => tagInputRef.current?.focus(), 0);
  };

  const addTag = () => {
    if (!newTag.trim()) return;

    const currentTags = filters.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      onFiltersChange({
        ...filters,
        tags: [...currentTags, newTag.trim()]
      });
    }
    setNewTag('');
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !newTag.trim() && filters.tags && filters.tags.length > 0) {
      // Delete last tag if input is empty and user hits backspace
      const newTags = filters.tags.slice(0, -1);
      onFiltersChange({
        ...filters,
        tags: newTags.length > 0 ? newTags : undefined
      });
    }
  };

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
    setNewTag('');
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

      {/* Tag Input with Badges Inside */}
      <div className="relative min-w-[180px] max-w-[280px] flex-1">
        <Tag className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <div className="flex flex-wrap gap-1 items-center p-2 pl-8 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[40px]">
          {/* Tag Badges */}
          {filters.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-secondary/80">
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

          {/* Tag Input */}
          <input
            ref={tagInputRef}
            type="text"
            placeholder={filters.tags?.length ? "Add another tag..." : "Add tags to filter..."}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            className="flex-1 min-w-[100px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
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
