export interface SearchFilters {
  location?: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  startDate?: Date;
  endDate?: Date;
  features?: string[];
  transmission?: string;
  fuel?: string;
  rating?: number;
  yearMin?: number;
  yearMax?: number;
  engineMin?: number;
  engineMax?: number;
  seatsMin?: number;
  seatsMax?: number;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isOwner: boolean;
  isRenter: boolean;
  isVerified: boolean;
  rating: string;
  totalRentals: number;
  totalEarnings: string;
  location?: string;
  role?: 'admin' | 'user';
  pix?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

export type UserMode = 'renter' | 'owner';

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type VehicleCategory = 'hatch' | 'sedan' | 'suv' | 'pickup';

export type TransmissionType = 'manual' | 'automatic' | 'cvt';

export type FuelType = 'flex' | 'gasoline' | 'ethanol' | 'diesel' | 'electric' | 'hybrid';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: string;
  location: string;
  imageUrl?: string;
  images: string[];
  isAvailable: boolean;
  rating: string;
  reviewCount?: number;
  description?: string;
  features: string[];
  transmission: string;
  fuel: string;
  seats: number;
  engine?: string;
  mileage?: string;
  owner: {
    id: number;
    name: string;
    rating: string;
    avatar?: string;
  };
}

export interface ComparisonState {
  vehicles: Vehicle[];
  isOpen: boolean;
}
