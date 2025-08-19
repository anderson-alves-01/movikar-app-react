import { createContext, useContext, useState, ReactNode } from 'react';
import { SearchFilters } from '@/types';

interface SearchContextType {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  updateFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  // Individual filter access
  location?: string;
  category?: string;
  priceRange?: string;
  fuelType?: string;
  transmission?: string;
  startDate?: string;
  endDate?: string;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [filters, setFilters] = useState<SearchFilters>({});

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <SearchContext.Provider value={{
      filters,
      setFilters,
      updateFilter,
      clearFilters,
      // Individual filter access
      location: filters.location,
      category: filters.category,
      priceRange: (filters as any).priceRange,
      fuelType: (filters as any).fuelType,
      transmission: (filters as any).transmission,
      startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
      endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined
    }}>
      {children}
    </SearchContext.Provider>
  );
}