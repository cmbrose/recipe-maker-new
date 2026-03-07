'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTags } from '@/lib/hooks/useRecipes';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInput({ value, onChange, placeholder, disabled, className }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: allTags = [] } = useTags();

  const listboxId = 'tag-suggestions-listbox';

  const filteredSuggestions = allTags.filter(
    (tag) => !value.includes(tag) && tag.toLowerCase().includes(inputValue.toLowerCase().trim())
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredSuggestions[activeIndex]) {
        addTag(filteredSuggestions[activeIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay to allow mousedown on suggestion to fire first
    setTimeout(() => setShowDropdown(false), 150);
  };

  // Scroll active suggestion into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const showSuggestions = showDropdown && filteredSuggestions.length > 0;

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="flex flex-wrap gap-1 items-center p-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 min-h-[40px]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-destructive"
                aria-label={`Remove ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? (placeholder ?? 'Add tags...') : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `tag-suggestion-${activeIndex}` : undefined}
        />
      </div>
      {showSuggestions && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto border border-input rounded-md bg-background shadow-md"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              id={`tag-suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`px-3 py-2 text-sm cursor-pointer ${
                index === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
              onMouseDown={() => addTag(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
