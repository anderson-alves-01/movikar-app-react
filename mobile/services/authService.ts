// Real imports - dependency conflicts resolved with .npmrc
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AuthSession from 'expo-auth-session';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
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
    // Configure Google Sign In
    try {
      GoogleSignin.configure({
        webClientId: '474421653647-n4d2bdc4ca8bh4vvjl4bqn8e5t8lv0il.apps.googleusercontent.com', // Your web client ID from Google Console
        iosClientId: '474421653647-your_ios_client_id_here.apps.googleusercontent.com', // Your iOS client ID
        offlineAccess: true,
        hostedDomain: '',
        accountName: '',
      });
    } catch (error) {
      console.error('Google Sign In configuration error:', error);
    }
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
      if (this.token && this.refreshToken && this.user) {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, this.token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
        ]);

        return this.user;
      } else {
        throw new Error('Dados de autenticação inválidos');
      }
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
      if (this.token && this.refreshToken && this.user) {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, this.token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
        ]);

        return this.user;
      } else {
        throw new Error('Dados de registro inválidos');
      }
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
      // Check Google Play Services (Android)
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get user info from Google
      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo.data?.user) {
        const { user } = userInfo.data;
        
        // Send Google user data to your backend for verification and JWT token generation
        const response = await fetch('https://alugae.mobi/api/auth/google-mobile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            googleId: user.id,
            email: user.email,
            name: user.name,
            photo: user.photo,
            idToken: userInfo.data.idToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Falha na autenticação com Google');
        }

        const data = await response.json();
        
        // Store tokens and user data
        this.token = data.token;
        this.refreshToken = data.refreshToken;
        this.user = data.user;

        if (this.token && this.user) {
          await Promise.all([
            AsyncStorage.setItem(TOKEN_KEY, this.token),
            this.refreshToken && AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
            AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
          ].filter(Boolean));

          return this.user;
        } else {
          throw new Error('Dados de autenticação Google inválidos');
        }
      }

      throw new Error('Login cancelado');
    } catch (error: any) {
      console.error('Google login error:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Login cancelado pelo usuário');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Login em andamento');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services não disponível');
      } else {
        throw error;
      }
    }
  }

  // Apple Sign In (iOS only)
  async loginWithApple(): Promise<User> {
    try {
      // Check if Apple Authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In não está disponível neste dispositivo');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send Apple user data to your backend for verification and JWT token generation
      const response = await fetch('https://alugae.mobi/api/auth/apple-mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appleId: credential.user,
          email: credential.email,
          fullName: credential.fullName,
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na autenticação com Apple');
      }

      const data = await response.json();
      
      // Store tokens and user data
      this.token = data.token;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      if (this.token && this.user) {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, this.token),
          this.refreshToken && AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user)),
        ].filter(Boolean));

        return this.user;
      } else {
        throw new Error('Dados de autenticação Apple inválidos');
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
      
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Login cancelado pelo usuário');
      } else {
        throw error;
      }
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

      if (this.token && this.refreshToken) {
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, this.token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken),
        ]);

        return this.token;
      } else {
        throw new Error('Token refresh failed');
      }
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
      const response = await apiService.updateProfile(userData);
      if (this.user) {
        const updatedUser = { ...this.user, ...response };
        this.user = updatedUser;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        throw new Error('User not authenticated');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
}

export default new AuthService();