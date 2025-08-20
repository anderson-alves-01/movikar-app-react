import { useState, useEffect } from 'react';
import authService, { AuthState } from '../services/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.login(email, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    ddi: string;
  }) => {
    setIsLoading(true);
    try {
      await authService.register(userData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: any) => {
    setIsLoading(true);
    try {
      await authService.updateProfile(profileData);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...authState,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };
};