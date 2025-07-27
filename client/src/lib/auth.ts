import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthUser } from '@/types';

interface AuthStore extends AuthState {
  setAuth: (user: AuthUser, token: string) => void;
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
      setAuth: (user, token) => {
        console.log('🔐 Setting auth - PIX field:', user.pix);
        set({ user, token, isLoading: false });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          console.log('👤 Updating user - PIX field:', updatedUser.pix);
          set({ user: updatedUser });
        }
      },
      refreshUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          const response = await fetch('/api/auth/user', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('🔄 Refreshed user data - PIX field:', userData.pix);
            set({ user: userData });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      },
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
