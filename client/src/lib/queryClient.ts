import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Sistema de requisições simplificado
 * - Não faz refresh automático de tokens
 * - Evita loops infinitos
 * - Falha de forma limpa
 */

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header as fallback if sessionStorage has token
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('📡 apiRequest - Using Authorization header fallback');
  }

  const fullUrl = url.startsWith('http') ? url : url;
  
  console.log(`📡 apiRequest - ${method} ${fullUrl}`, data ? 'with data' : 'no data');
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`📡 apiRequest - Response: ${res.status} ${res.statusText}`);

  // Para erros 401, tentar refresh token uma vez
  if (res.status === 401) {
    console.log('❌ apiRequest - 401 Unauthorized, attempting token refresh...');
    
    try {
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('✅ apiRequest - Token refreshed, retrying original request');
        
        // Update token in sessionStorage
        if (refreshData.token) {
          sessionStorage.setItem('auth_token', refreshData.token);
          headers['Authorization'] = `Bearer ${refreshData.token}`;
        }
        
        // Retry original request with new token
        const retryRes = await fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        
        console.log(`📡 apiRequest - Retry response: ${retryRes.status} ${retryRes.statusText}`);
        
        if (retryRes.ok) {
          return retryRes;
        }
      }
    } catch (refreshError) {
      console.log('❌ apiRequest - Token refresh failed:', refreshError);
      sessionStorage.removeItem('auth_token');
    }
    
    throw new Error('401: Não autorizado');
  }

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn: QueryFunction = async ({ queryKey }) => {
  const queryUrl = queryKey.join("/") as string;
  
  const res = await fetch(queryUrl, {
    headers: { 'Content-Type': 'application/json' },
    credentials: "include",
  });

  // Para queries, retornar null em erro 401 para evitar loops
  if (res.status === 401) {
    return null;
  }

  await throwIfResNotOk(res);
  return res.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => {
        // Não fazer retry em erros 401
        if (error?.message?.includes('401')) return false;
        return failureCount < 1; // Máximo 1 retry
      },
    },
    mutations: {
      retry: false,
    },
  },
});
