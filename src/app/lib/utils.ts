/**
 * Shared utility functions used across the application
 */

/**
 * Article data type - shared across all article-related components
 */
export type Article = {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  author_name?: string;
  author?: string | null;
  author_avatar?: string | null;
  published_at?: string;
  createdAt?: string | null;
  likes: number;
};

/**
 * Calculate estimated reading time for article content
 * @param content - Article content in markdown/HTML format
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string): number {
  if (!content || !content.trim()) return 0
  const words = content.trim().split(/\s+/).length
  // Average reading speed: 200 words per minute
  return Math.ceil(words / 200)
}

/**
 * Format date string to Indonesian locale
 * @param dateString - ISO date string
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string,
  options: { month?: 'short' | 'long' | 'numeric'; day?: 'numeric'; year?: 'numeric' } = {}
): string {
  const { month = 'long', day = 'numeric', year = 'numeric' } = options
  
  return new Date(dateString).toLocaleDateString('id-ID', {
    day,
    month,
    year,
  })
}

/**
 * Generate slug from title
 * @param title - Article/page title
 * @returns URL-friendly slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Format number to Indonesian locale (e.g., 1.234.567)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('id-ID')
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}
