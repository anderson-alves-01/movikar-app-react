import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthUser } from '@/types';

interface AuthStore extends AuthState {
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setAuth: (user, token) => set({ user, token, isLoading: false }),
      clearAuth: () => set({ user: null, token: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
