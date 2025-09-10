/**
 * Safely formats currency values for the Brazilian market
 * Handles undefined, null, string, and number values gracefully
 */

export function formatCurrencyBRL(value: unknown, suffix = '/dia'): string {
  // Handle undefined, null, or empty values
  if (value === undefined || value === null || value === '') {
    return 'Preço indisponível';
  }

  // Try to convert to number
  let numericValue: number;
  
  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    numericValue = parseFloat(cleanValue);
  } else {
    return 'Preço indisponível';
  }

  // Check if the conversion resulted in a valid number
  if (!isFinite(numericValue) || isNaN(numericValue)) {
    return 'Preço indisponível';
  }

  // Format the currency
  const formatted = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `R$ ${formatted}${suffix}`;
}

/**
 * Format currency without suffix (for totals)
 */
export function formatCurrencyBRLTotal(value: unknown): string {
  return formatCurrencyBRL(value, '');
}

/**
 * Parse price value safely to number
 */
export function parsePriceToNumber(value: unknown): number {
  if (typeof value === 'number' && isFinite(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : 0;
  }
  
  return 0;
}