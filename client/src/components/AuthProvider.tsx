import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/ui/loading';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { initializing } = useAuth();

  // Show loading while checking initial authentication
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loading variant="car" className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}