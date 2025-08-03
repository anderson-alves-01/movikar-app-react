import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthUser } from '@/types';
import { queryClient } from './queryClient';

// Verificar se o usuário está autenticado
export async function checkAuth() {
  try {
    const response = await fetch('/api/auth/check', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.log('Auth check failed:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Auth check success:', data.user?.email);
    return data.user;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

export async function login(email: string, password: string) {
  console.log('Attempting login for:', email);

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Login failed:', error.message);
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  console.log('Login successful for:', data.user?.email);
  queryClient.invalidateQueries();
  return data;
}

interface AuthStore extends AuthState {
  setAuth: (user: AuthUser, token?: string | null) => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  refreshUser: () => Promise<void>;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token = null) => {
        // Store token for subscription flow
        set({ user, token, isLoading: false });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          set({ user: updatedUser });
        }
      },
      refreshUser: async () => {
        try {
          const response = await fetch('/api/auth/user', {
            credentials: 'include'
          });

          if (response.ok) {
            const userData = await response.json();
            set({ user: userData });
          } else if (response.status === 401) {
            // Try to refresh token
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const { user } = await refreshResponse.json();
              set({ user });
            } else {
              get().clearAuth();
            }
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
      clearAuth: () => {
        // Clear Zustand state
        set({ user: null, token: null, isLoading: false });
        
        // Clear any remaining storage data
        try {
          sessionStorage.clear();
          localStorage.removeItem('checkoutPlan');
          localStorage.removeItem('pendingSubscription');
          localStorage.removeItem('returnUrl');
          localStorage.removeItem('auth_token');
        } catch (error) {
          // Ignore storage errors
        }
        
        // Clear query cache
        queryClient.clear();
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export const getAuthHeaders = () => {
  // No longer need to send token in headers since we use httpOnly cookies
  // But keep this for backward compatibility with any existing code
  return {};
};

// Function to make authenticated requests
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle token refresh if needed
  if (response.status === 401) {
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    if (refreshResponse.ok) {
      // Retry original request
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } else {
      // Refresh failed, redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/auth';
    }
  }

  return response;
};