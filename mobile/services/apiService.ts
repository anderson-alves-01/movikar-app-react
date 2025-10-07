// API Service for alugae mobile app
import loggerService from './loggerService';

const API_BASE_URL = 'https://644ab8d0-655e-4dd9-989a-218db554bb65-00-rwokssygfm5r.picard.replit.dev/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private baseURL: string;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      defaultHeaders.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      // Log API call com sucesso
      loggerService.logApiCall(
        options.method || 'GET',
        endpoint,
        response.status,
        duration
      );

      if (!response.ok) {
        const errorData = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorData}`);
        
        // Log erro da API
        loggerService.logApiCall(
          options.method || 'GET',
          endpoint,
          response.status,
          duration,
          error
        );
        
        throw error;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log erro de rede/timeout
      loggerService.logApiCall(
        options.method || 'GET',
        endpoint,
        undefined,
        duration,
        error
      );
      
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.makeRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    ddi: string;
  }) {
    return this.makeRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.makeRequest<any>('/auth/user');
  }

  // Vehicle endpoints
  async getVehicles(params: {
    limit?: number;
    page?: number;
    location?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    features?: string[];
    startDate?: string;
    endDate?: string;
    highlighted?: boolean;
  } = {}) {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(key, item));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/vehicles?${queryString}` : '/vehicles';
    
    const response = await this.makeRequest<{ vehicles: any[]; total?: number; hasMore?: boolean }>(endpoint);
    
    // Handle both array response and object response with vehicles property
    if (Array.isArray(response)) {
      return response;
    } else {
      return response.vehicles || [];
    }
  }

  async getVehicle(vehicleId: number) {
    return this.makeRequest<any>(`/vehicles/${vehicleId}`);
  }

  async getFeaturedVehicles() {
    const response = await this.makeRequest<{ vehicles: any[] } | any[]>('/vehicles?highlighted=true&limit=10');
    
    // Handle both array response and object response with vehicles property
    if (Array.isArray(response)) {
      return response;
    } else {
      return response.vehicles || [];
    }
  }

  // Booking endpoints
  async getBookings(type?: 'renter' | 'owner') {
    const endpoint = type ? `/bookings?type=${type}` : '/bookings';
    return this.makeRequest<any[]>(endpoint);
  }

  async getBooking(bookingId: number) {
    return this.makeRequest<any>(`/bookings/${bookingId}`);
  }

  async createBooking(bookingData: {
    vehicleId: number;
    startDate: string;
    endDate: string;
    totalPrice: number;
  }) {
    return this.makeRequest<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Search endpoints
  async searchVehicles(query: string, filters: any = {}) {
    const params = {
      search: query,
      ...filters,
    };

    return this.getVehicles(params);
  }

  // User profile endpoints
  async updateProfile(profileData: any) {
    return this.makeRequest<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadProfileImage(imageUri: string) {
    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    return this.makeRequest<{ imageUrl: string }>('/auth/profile/image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiService = new ApiService();
export default apiService;