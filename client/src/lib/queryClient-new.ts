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

  const fullUrl = url.startsWith('http') ? url : url;
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Para erros 401, simplesmente falhar sem tentar refresh
  if (res.status === 401) {
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