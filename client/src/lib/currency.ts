export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseCurrency(value: string): number {
  // Remove currency formatting and convert to number
  return parseFloat(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
}