import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, initializing } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !initializing && requireAuth && !isAuthenticated) {
      // REMOVIDO: Não salvar URL para redirecionamento
      // REMOVIDO: Não redirecionar automaticamente
      // Apenas mostrar componente de login quando necessário
      setLocation(redirectTo);
    }
  }, [isAuthenticated, isLoading, initializing, requireAuth, redirectTo, setLocation]);

  // Show loading while checking authentication
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loading variant="car" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
}