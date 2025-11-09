/**
 * Utility functions for handling tag-based URL navigation
 */

/**
 * Generate a URL for filtering recipes by a specific tag
 */
export function getTagFilterUrl(tag: string): string {
  const params = new URLSearchParams();
  params.set('tags', tag);
  return `/recipes?${params.toString()}`;
}

/**
 * Generate a URL for filtering recipes by multiple tags
 */
export function getTagsFilterUrl(tags: string[]): string {
  if (tags.length === 0) return '/recipes';
  
  const params = new URLSearchParams();
  tags.forEach(tag => params.append('tags', tag));
  return `/recipes?${params.toString()}`;
}

/**
 * Parse tag filters from URL search params
 */
export function parseTagsFromUrl(searchParams: URLSearchParams): string[] {
  return searchParams.getAll('tags');
}