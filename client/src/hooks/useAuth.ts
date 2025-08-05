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

  // Verificação inicial de autenticação com refresh automático
  useEffect(() => {
    // Check for OAuth success parameter
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    
    // Skip auth check on auth pages to prevent unnecessary 401 errors, unless OAuth success
    const isAuthPage = window.location.pathname === '/auth' || 
                       window.location.pathname === '/login' || 
                       window.location.pathname.startsWith('/register');
    
    if (isAuthPage && !oauthSuccess) {
      console.log('🔍 useAuth - Skipping auth check on auth page');
      setLoading(false);
      setInitialized(true);
      return;
    }

    const checkAuth = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 useAuth - Checking authentication...');
        
        // Force cache bypass with no-cache headers
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        };
        
        // Add Authorization header if token exists
        const token = sessionStorage.getItem('auth_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('🔍 useAuth - Using Authorization header fallback');
        }
        
        // Add timestamp to prevent browser caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/auth/user?_t=${timestamp}`, {
          method: 'GET',
          credentials: 'include',
          headers,
        });

        console.log('🔍 useAuth - Auth check response:', response.status);

        if (response.ok) {
          const userData = await response.json();
          console.log('✅ useAuth - User authenticated:', userData.email);
          // Get token from sessionStorage if available
          const storedToken = sessionStorage.getItem('auth_token');
          setAuth(userData, storedToken || '');
        } else {
          console.log('❌ useAuth - Not authenticated, clearing auth');
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
    
    // Re-check auth periodically to handle cache issues
    const authCheckInterval = setInterval(() => {
      if (!isAuthPage && user) {
        console.log('🔄 useAuth - Periodic auth refresh check');
        checkAuth();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(authCheckInterval);
  }, [setAuth, clearAuth, setLoading, user]);

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