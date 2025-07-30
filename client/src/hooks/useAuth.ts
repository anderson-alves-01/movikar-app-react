import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import type { AuthUser } from '@/types';

// AuthUser interface is now imported from types

export function useAuth() {
  const { user, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const [initializing, setInitializing] = useState(true);

  // Verificar autenticação no carregamento inicial
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        
        // Sempre verificar se existe uma sessão válida no backend
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setAuth(userData, '');
          console.log('✅ Auth restored from server session:', userData.email);
        } else {
          // Não há sessão válida, limpar storage local se existir
          if (user) {
            console.log('🧹 Clearing invalid local auth data');
            clearAuth();
            localStorage.removeItem('auth-storage');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Em caso de erro, limpar dados locais
        if (user) {
          clearAuth();
          localStorage.removeItem('auth-storage');
        }
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      setAuth(data.user, data.token); // Salvar token no Zustand também
      return data;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearAuth();
      localStorage.removeItem('auth-storage');
      window.location.href = '/';
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || initializing,
    initializing,
    login,
    logout,
  };
}