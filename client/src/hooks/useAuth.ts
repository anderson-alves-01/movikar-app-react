import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import type { AuthUser } from '@/types';

/**
 * Sistema de autenticação simplificado e robusto
 * - Evita loops infinitos de requisições
 * - Usa apenas cookies httpOnly para segurança
 * - Não faz requisições automáticas desnecessárias
 */
export function useAuth() {
  const { user, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  // Verificação inicial de autenticação apenas uma vez
  useEffect(() => {
    if (initialized) return;

    const checkAuth = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 useAuth - Checking authentication...');
        
        // Try authentication with cookies first (most reliable)
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('🔍 useAuth - Auth check response:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ useAuth - User authenticated via cookies:', userData.email);
          setAuth(userData, ''); // No token needed since using cookies
        } else {
          console.log('❌ useAuth - Not authenticated, clearing auth');
          sessionStorage.removeItem('auth_token');
          clearAuth();
        }
      } catch (error) {
        console.log('❌ useAuth - Auth check error:', error);
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuth();
  }, [initialized, setAuth, clearAuth, setLoading]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('🔐 useAuth - Login attempt for:', email);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('🔐 useAuth - Login response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no login');
      }

      const data = await response.json();
      console.log('✅ useAuth - Login successful for:', data.user.email);
      
      // Store token temporarily in sessionStorage as fallback
      if (data.token) {
        console.log('💾 Storing token in sessionStorage as fallback');
        sessionStorage.setItem('auth_token', data.token);
      }
      
      setAuth(data.user, data.token || '');
      
      // Force re-initialization to ensure auth state is fresh
      setInitialized(false);
      setLoading(false);
      
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
      // Ignorar erros de logout
    } finally {
      clearAuth();
      window.location.href = '/';
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || !initialized,
    initializing: !initialized,
    login,
    logout,
  };
}