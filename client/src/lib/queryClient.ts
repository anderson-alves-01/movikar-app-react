import { QueryClient, QueryFunction } from "@tanstack/react-query";

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
  // Get token from localStorage with better error handling
  let authToken = null;
  
  try {
    const token = localStorage.getItem('auth-storage');
    if (token) {
      const authData = JSON.parse(token);
      // Try multiple possible token locations
      authToken = authData.state?.token || authData.token || authData.state?.user?.token;
    }
  } catch (error) {
    console.error('Error parsing auth token:', error);
  }

  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Ensure proper baseURL for relative paths
  const fullUrl = url.startsWith('http') ? url : `/api${url.startsWith('/') ? url.slice(4) : url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle 401 errors with automatic retry after token refresh
  if (res.status === 401) {
    try {
      // Try to refresh the session
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        // Retry the original request with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, 0), 5000)));
        return fetch(fullUrl, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
      } else {
        // Refresh failed, redirect to login
        localStorage.removeItem('auth-storage');
        
        // Only redirect if not already on auth page
        if (!window.location.pathname.includes('/auth')) {
          localStorage.setItem('returnUrl', window.location.pathname);
          window.location.href = '/auth';
        }
        
        throw new Error('401: Session expired');
      }
    } catch (refreshError) {
      localStorage.removeItem('auth-storage');
      
      if (!window.location.pathname.includes('/auth')) {
        localStorage.setItem('returnUrl', window.location.pathname);
        window.location.href = '/auth';
      }
      
      throw new Error('401: Session expired');
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get token from localStorage with better error handling
    let authToken = null;
    
    try {
      const token = localStorage.getItem('auth-storage');
      if (token) {
        const authData = JSON.parse(token);
        // Try multiple possible token locations
        authToken = authData.state?.token || authData.token || authData.state?.user?.token;
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }

    const headers: Record<string, string> = {};
    
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    // Ensure proper baseURL for queries
    const queryUrl = queryKey.join("/") as string;
    const fullQueryUrl = queryUrl.startsWith('http') ? queryUrl : queryUrl;
    
    const res = await fetch(fullQueryUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Return null instead of throwing to prevent loops
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: true, // Enable refetch on mount for better UX
      refetchOnReconnect: false, // Disable refetch on reconnect
      staleTime: 1000 * 60 * 2, // 2 minutes stale time
      gcTime: 1000 * 60 * 5, // 5 minutes cache time
      retry: (failureCount, error) => {
        // Don't retry on 401 errors to prevent loops
        if (error?.message?.includes('401')) return false;
        return failureCount < 2;
      },
      enabled: true, // Enable queries by default for better UX
    },
    mutations: {
      retry: false,
    },
  },
});
