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
  } else {
    console.warn('No auth token found for API request to:', url);
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log("📊 Query data parsed successfully:", data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }), // Return null instead of throwing to prevent loops
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Disable automatic refetch on mount
      refetchOnReconnect: false, // Disable refetch on reconnect
      staleTime: Infinity, // Never consider data stale to prevent background refetching
      gcTime: 1000 * 60 * 5, // 5 minutes cache time
      retry: false,
      enabled: false, // Disable all queries by default
    },
    mutations: {
      retry: false,
    },
  },
});
