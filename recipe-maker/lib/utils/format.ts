// Formatting utilities

/**
 * Format time in minutes to human-readable string
 * Examples:
 * - 30 -> "30 mins"
 * - 60 -> "1 hour"
 * - 90 -> "1 hour 30 mins"
 * - 125 -> "2 hours 5 mins"
 */
export function formatTime(minutes?: number): string {
  if (!minutes || minutes === 0) {
    return '';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (mins > 0) {
    parts.push(`${mins} ${mins === 1 ? 'min' : 'mins'}`);
  }

  return parts.join(' ');
}

/**
 * Format servings
 * Examples:
 * - 1 -> "1 serving"
 * - 4 -> "4 servings"
 */
export function formatServings(servings?: number): string {
  if (!servings || servings === 0) {
    return '';
  }

  return `${servings} ${servings === 1 ? 'serving' : 'servings'}`;
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}

/**
 * Format date to relative time (e.g., "2 days ago", "just now")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${pluralize(diffInMinutes, 'minute')} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${pluralize(diffInHours, 'hour')} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${pluralize(diffInDays, 'day')} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${pluralize(diffInMonths, 'month')} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${pluralize(diffInYears, 'year')} ago`;
}

/**
 * Format date to standard string (e.g., "Jan 15, 2025")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Normalize URL (remove trailing slash, convert to lowercase)
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slash from pathname
    parsed.pathname = parsed.pathname.replace(/\/$/, '');
    return parsed.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Extract domain from URL
 */
export function getDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
