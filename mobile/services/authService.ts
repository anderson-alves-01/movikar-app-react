import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AuthSession from 'expo-auth-session';
import apiService from './apiService';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  ddi: string;
  profileImage?: string;
  role: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  ddi: string;
}

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  // Initialize auth service
  async initialize() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (token && refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
        
        if (userData) {
          this.user = JSON.parse(userData);
        }

        // Verify token validity
        try {
          const user = await apiService.getCurrentUser();
          this.user = user;
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
        } catch (error) {
          // Token might be expired, try to refresh
          await this.refreshAuthToken();
        }
      }
    } catch (error) {
      console.error('Error initializing auth service:', error);
      await this.logout();
    }
  }

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch('https://alugae.mobi/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no login');
      }

      const data = await response.json();
      
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      // Store tokens and user data
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, this.token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
      ]);

      return this.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData: RegisterData): Promise<User> {
    try {
      const response = await fetch('https://alugae.mobi/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no cadastro');
      }

      const data = await response.json();
      
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      // Store tokens and user data
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, this.token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
      ]);

      return this.user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  // Biometric authentication
  async enableBiometricAuth(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        throw new Error('Dispositivo não suporta autenticação biométrica');
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (supportedTypes.length === 0) {
        throw new Error('Nenhum método biométrico configurado');
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        throw new Error('Configure pelo menos um método biométrico nas configurações do dispositivo');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Biometric auth error:', error);
      throw error;
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      const isBiometricEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      if (isBiometricEnabled !== 'true') {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Faça login com sua biometria',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  // Disable biometric authentication
  async disableBiometricAuth(): Promise<void> {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  }

  // Check if biometric auth is enabled
  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  }

  // Google Sign In
  async loginWithGoogle(): Promise<User> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      
      const request = new AuthSession.AuthRequest({
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        additionalParameters: {},
        extraParams: {},
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
      });

      if (result.type === 'success') {
        // Send auth code to your backend
        const response = await fetch('https://alugae.mobi/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: result.params.code,
            redirectUri,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro na autenticação com Google');
        }

        const data = await response.json();
        
        this.token = data.token;
        this.refreshToken = data.refreshToken;
        this.user = data.user;

        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, this.token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
        ]);

        return this.user;
      }

      throw new Error('Login cancelado');
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  // Apple Sign In (iOS only)
  async loginWithApple(): Promise<User> {
    try {
      // Implementation for Apple Sign In
      // This would require @react-native-apple-authentication package
      throw new Error('Apple Sign In não implementado ainda');
    } catch (error) {
      console.error('Apple login error:', error);
      throw error;
    }
  }

  // Facebook Login
  async loginWithFacebook(): Promise<User> {
    try {
      // Implementation for Facebook Login
      // This would require react-native-fbsdk-next package
      throw new Error('Facebook Login não implementado ainda');
    } catch (error) {
      console.error('Facebook login error:', error);
      throw error;
    }
  }

  // Password recovery
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch('https://alugae.mobi/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao solicitar recuperação de senha');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch('https://alugae.mobi/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao redefinir senha');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Refresh authentication token
  async refreshAuthToken(): Promise<string> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('https://alugae.mobi/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        await this.logout();
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      
      this.token = data.token;
      this.refreshToken = data.refreshToken;

      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, this.token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
      ]);

      return this.token;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      throw error;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);

      // Clear memory
      this.token = null;
      this.refreshToken = null;
      this.user = null;

      // Optional: Notify backend about logout
      if (this.token) {
        try {
          await fetch('https://alugae.mobi/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          // Ignore logout request errors
          console.warn('Logout request failed:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get auth token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiService.updateUserProfile(userData);
      this.user = { ...this.user, ...response };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

export default new AuthService();