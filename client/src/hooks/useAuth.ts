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
        
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        // Add Authorization header from auth store or sessionStorage
        let token = sessionStorage.getItem('auth_token');
        
        // Fallback: try to get token from Zustand auth store
        if (!token) {
          try {
            const authStore = localStorage.getItem('auth-storage');
            if (authStore) {
              const parsed = JSON.parse(authStore);
              token = parsed?.state?.token;
            }
          } catch (e) {
            console.log('Failed to parse auth storage');
          }
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔍 useAuth - Using stored token for auth check');
        }
        
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        console.log('🔍 useAuth - Auth check response:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ useAuth - User authenticated:', userData.email);
          setAuth(userData, token || '');
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
    login,
    logout,
  };
}