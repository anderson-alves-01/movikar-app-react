// Simplified storage for now - we'll implement SecureStore later
const simpleStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    // In a real app, this would be SecureStore or AsyncStorage
    return null;
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    // In a real app, this would be SecureStore or AsyncStorage
    console.log('Storing:', key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    // In a real app, this would be SecureStore or AsyncStorage
    console.log('Deleting:', key);
  },
};
import apiService from './apiService';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  ddi: string;
  profileImage?: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initializeAuth() {
    try {
      const token = await simpleStorage.getItemAsync('auth_token');
      if (token) {
        apiService.setAuthToken(token);
        const user = await apiService.getCurrentUser();
        this.authState = {
          isAuthenticated: true,
          user,
          token,
        };
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.logout();
    }
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const response = await apiService.login(email, password);
      
      await simpleStorage.setItemAsync('auth_token', response.token);
      apiService.setAuthToken(response.token);
      
      this.authState = {
        isAuthenticated: true,
        user: response.user,
        token: response.token,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    ddi: string;
  }): Promise<void> {
    try {
      const response = await apiService.register(userData);
      
      await simpleStorage.setItemAsync('auth_token', response.token);
      apiService.setAuthToken(response.token);
      
      this.authState = {
        isAuthenticated: true,
        user: response.user,
        token: response.token,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await simpleStorage.deleteItemAsync('auth_token');
      apiService.clearAuthToken();
      
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
      };
      
      this.notifyListeners();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async updateProfile(profileData: Partial<User>): Promise<void> {
    try {
      const updatedUser = await apiService.updateProfile(profileData);
      this.authState.user = updatedUser;
      this.notifyListeners();
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  getUser(): User | null {
    return this.authState.user;
  }

  getToken(): string | null {
    return this.authState.token;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }
}

export const authService = AuthService.getInstance();
export default authService;