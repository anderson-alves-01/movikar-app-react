/**
 * Utility functions for search normalization on the frontend
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
  if (!target || !searchTerm) return false;
  
  const normalizedTarget = normalizeString(target);
  const normalizedSearch = normalizeString(searchTerm.trim());
  
  return normalizedTarget.includes(normalizedSearch);
}

/**
 * Builds search query parameters with proper encoding
 */
export function buildSearchParams(filters: Record<string, any>): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        // Trim whitespace from string values
        const trimmedValue = value.trim();
        if (trimmedValue) {
          params.append(key, trimmedValue);
        }
      } else {
        params.append(key, String(value));
      }
    }
  });
  
  return params;
}

/**
 * Filters an array of vehicles by location search term
 */
export function filterVehiclesByLocation(vehicles: any[], locationSearch: string): any[] {
  if (!locationSearch?.trim()) {
    return vehicles;
  }
  
  return vehicles.filter(vehicle => 
    matchesSearch(vehicle.location || '', locationSearch)
  );
}