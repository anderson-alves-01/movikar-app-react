import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth';
import type { AuthUser } from '@/types';

/**
 * Sistema de autenticação simplificado
 * - Executa apenas uma verificação inicial
 * - Usa cookies httpOnly para segurança
 * - Não faz loops de requisições
 */
export function useAuth() {
  const { user, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();
  const hasCheckedAuth = useRef(false);
  const [initialized, setInitialized] = useState(false);

  // Verificação única de autenticação no mount
  useEffect(() => {
    // Evita múltiplas execuções
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    // Skip em páginas de autenticação
    const isAuthPage = window.location.pathname === '/auth' || 
                       window.location.pathname === '/login' || 
                       window.location.pathname.startsWith('/register');
    
    if (isAuthPage) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Requisição simples sem cache bypass excessivo
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setAuth(userData, '');
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkAuth();
  }, []); // Sem dependências

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
      console.log('💾 useAuth - Token received:', data.token ? 'Yes' : 'No');
      
      // ALWAYS store token in sessionStorage for Authorization header fallback
      if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
        console.log('💾 useAuth - Token stored in sessionStorage');
      }
      
      // Store in auth state
      setAuth(data.user, data.token || '');
      
      // Force page reload to ensure fresh auth state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
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
      console.log('✅ useAuth - Logout successful');
    } catch (error) {
      console.log('❌ useAuth - Logout error:', error);
    } finally {
      // Clear all authentication and checkout related data
      clearAuth();
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('checkoutPlan');
      localStorage.removeItem('pendingSubscription');
      localStorage.removeItem('returnUrl');
      
      console.log('🧹 Cleared all session data on logout');
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