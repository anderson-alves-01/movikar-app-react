/**
 * String utilities for search normalization
 */

/**
 * Normalizes a string by removing accents and converting to lowercase
 * for better search comparison
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents
}

/**
 * Checks if a search term matches a target string
 * using normalized comparison (case-insensitive, accent-insensitive)
 */
export function matchesSearch(target: string, searchTerm: string): boolean {
  const normalizedTarget = normalizeString(target);
  const normalizedSearch = normalizeString(searchTerm);
  return normalizedTarget.includes(normalizedSearch);
}

/**
 * Filters an array of objects by a search term on a specific field
 */
export function filterBySearch<T>(
  items: T[], 
  searchTerm: string, 
  getFieldValue: (item: T) => string
): T[] {
  if (!searchTerm.trim()) {
    return items;
  }
  
  return items.filter(item => 
    matchesSearch(getFieldValue(item), searchTerm)
  );
}