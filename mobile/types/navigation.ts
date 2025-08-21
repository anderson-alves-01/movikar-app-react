export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  VehicleDetail: { vehicleId: number };
  Chat: { bookingId: number; partnerName: string };
  BiometricSetup: undefined;
  Payment: { 
    bookingId?: number; 
    amount?: number; 
    type?: 'booking' | 'subscription' 
  };
};

export type TabParamList = {
  Home: undefined;
  Search: {
    location?: string;
    category?: string;
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      fuelType?: string;
      transmission?: string;
    };
  };
  Bookings: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  images: string[];
  location: string;
  fuelType: string;
  transmission: string;
  features: string[];
  rating: number;
  reviewCount: number;
  ownerId: number;
  available: boolean;
};

export type Booking = {
  id: number;
  vehicleId: number;
  renterId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    images: string[];
  };
  renter?: {
    id: number;
    name: string;
    email: string;
  };
  owner?: {
    id: number;
    name: string;
    email: string;
  };
};

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  ddi: string;
  profileImage?: string;
  role: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  maxVehicleListings?: number;
};