/**
 * Utilitários para tratamento centralizado de erros
 */

export interface AppError {
  message: string;
  status?: number;
  code?: string;
}

export function createError(message: string, status?: number, code?: string): AppError {
  return { message, status, code };
}

export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('401') || error.message.includes('Unauthorized');
  }
  return false;
}

export function isForbiddenError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('403') || error.message.includes('Forbidden');
  }
  return false;
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('NetworkError') || 
           error.message.includes('Failed to fetch') ||
           error.message.includes('ERR_NETWORK');
  }
  return false;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Extract message from API error format: "400: Error message"
    const match = error.message.match(/^\d+:\s*(.+)$/);
    return match ? match[1] : error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erro inesperado. Tente novamente.';
}

export function handleAuthError(error: unknown): void {
  if (isUnauthorizedError(error)) {
    // Clear local storage and redirect to login
    localStorage.removeItem('auth-storage');
    
    if (!window.location.pathname.includes('/auth')) {
      localStorage.setItem('returnUrl', window.location.pathname);
      window.location.href = '/auth';
    }
  }
}

export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  onError?: (error: unknown) => void
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        console.error('Unhandled error:', error);
      }
      throw error;
    }
  }) as T;
}