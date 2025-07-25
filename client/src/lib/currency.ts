// Centralized currency formatting utility
export const formatCurrency = (value: string | number | null | undefined): string => {
  // Handle null, undefined, or empty values
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }

  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Handle NaN values
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  // Format as Brazilian currency
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

// Format percentage values
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

// Parse currency string back to number
export const parseCurrency = (value: string): number => {
  // Remove currency symbols and convert commas to dots
  const cleanValue = value
    .replace(/[R$\s]/g, '')
    .replace(',', '.');
  
  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};