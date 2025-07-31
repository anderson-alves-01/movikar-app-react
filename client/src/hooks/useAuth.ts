import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { handleAuthError, getErrorMessage } from '@/lib/errorHandler';
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
        } else if (response.status === 401) {
          // Tentar refresh automático se token expirou
          try {
            const refreshResponse = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              setAuth(refreshData.user, '');
            } else {
              // Não há sessão válida, limpar storage local sem gerar erro
              clearAuth();
              localStorage.removeItem('auth-storage');
            }
          } catch (refreshError) {
            // Falha silenciosa no refresh
            clearAuth();
            localStorage.removeItem('auth-storage');
          }
        } else {
          // Outros erros, limpar storage local sem gerar erro
          clearAuth();
          localStorage.removeItem('auth-storage');
        }
      } catch (error) {
        // Em caso de erro de rede, limpar dados locais sem gerar erro
        clearAuth();
        localStorage.removeItem('auth-storage');
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
        throw new Error(getErrorMessage(error.message || 'Falha no login'));
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
      // Logout sempre deve limpar dados locais mesmo se falhar
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