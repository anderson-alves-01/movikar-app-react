import apiService from './apiService';

export interface Rating {
  id: number;
  bookingId: number;
  reviewerId: number;
  revieweeId: number;
  rating: number; // 1-5 stars
  comment?: string;
  category: 'vehicle' | 'renter' | 'owner';
  createdAt: Date;
  updatedAt: Date;
}

export interface RatingCreate {
  bookingId: number;
  revieweeId: number;
  rating: number;
  comment?: string;
  category: 'vehicle' | 'renter' | 'owner';
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface VehicleRating extends Rating {
  vehicleId: number;
  renterName: string;
  renterAvatar?: string;
}

export interface UserRating extends Rating {
  raterName: string;
  raterAvatar?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
}

class RatingService {
  async getRatingsByBooking(bookingId: number): Promise<Rating[]> {
    try {
      const response = await apiService.makeRequest<Rating[]>(`/ratings/booking/${bookingId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ratings by booking:', error);
      return [];
    }
  }

  async getRatingsByUser(userId: number, category?: 'vehicle' | 'renter' | 'owner'): Promise<UserRating[]> {
    try {
      const url = category 
        ? `/ratings/user/${userId}?category=${category}`
        : `/ratings/user/${userId}`;
      
      const response = await apiService.makeRequest<UserRating[]>(url);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ratings by user:', error);
      return [];
    }
  }

  async getRatingsByVehicle(vehicleId: number): Promise<VehicleRating[]> {
    try {
      const response = await apiService.makeRequest<VehicleRating[]>(`/ratings/vehicle/${vehicleId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching ratings by vehicle:', error);
      return [];
    }
  }

  async createRating(ratingData: RatingCreate): Promise<Rating | null> {
    try {
      const response = await apiService.makeRequest<Rating>('/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData)
      });
      return response;
    } catch (error) {
      console.error('Error creating rating:', error);
      return null;
    }
  }

  async updateRating(ratingId: number, updateData: Partial<RatingCreate>): Promise<Rating | null> {
    try {
      const response = await apiService.makeRequest<Rating>(`/ratings/${ratingId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return response;
    } catch (error) {
      console.error('Error updating rating:', error);
      return null;
    }
  }

  async deleteRating(ratingId: number): Promise<boolean> {
    try {
      await apiService.makeRequest(`/ratings/${ratingId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error deleting rating:', error);
      return false;
    }
  }

  async getUserRatingStats(userId: number, category?: 'vehicle' | 'renter' | 'owner'): Promise<RatingStats> {
    try {
      const url = category 
        ? `/ratings/user/${userId}/stats?category=${category}`
        : `/ratings/user/${userId}/stats`;
      
      const response = await apiService.makeRequest<RatingStats>(url);
      return response || this.getDefaultStats();
    } catch (error) {
      console.error('Error fetching user rating stats:', error);
      return this.getDefaultStats();
    }
  }

  async getVehicleRatingStats(vehicleId: number): Promise<RatingStats> {
    try {
      const response = await apiService.makeRequest<RatingStats>(`/ratings/vehicle/${vehicleId}/stats`);
      return response || this.getDefaultStats();
    } catch (error) {
      console.error('Error fetching vehicle rating stats:', error);
      return this.getDefaultStats();
    }
  }

  async canUserRateBooking(bookingId: number, category: 'vehicle' | 'renter' | 'owner'): Promise<boolean> {
    try {
      const response = await apiService.makeRequest<{ canRate: boolean }>(`/ratings/can-rate/${bookingId}?category=${category}`);
      return response?.canRate || false;
    } catch (error) {
      console.error('Error checking if user can rate booking:', error);
      return false;
    }
  }

  async getPendingRatings(userId: number): Promise<Array<{
    bookingId: number;
    vehicleId?: number;
    userId?: number;
    category: 'vehicle' | 'renter' | 'owner';
    vehicleBrand?: string;
    vehicleModel?: string;
    userName?: string;
    completedAt: Date;
  }>> {
    try {
      const response = await apiService.makeRequest<Array<{
        bookingId: number;
        vehicleId?: number;
        userId?: number;
        category: 'vehicle' | 'renter' | 'owner';
        vehicleBrand?: string;
        vehicleModel?: string;
        userName?: string;
        completedAt: Date;
      }>>(`/ratings/pending/${userId}`);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching pending ratings:', error);
      return [];
    }
  }

  async reportRating(ratingId: number, reason: string): Promise<boolean> {
    try {
      await apiService.makeRequest('/ratings/report', {
        method: 'POST',
        body: JSON.stringify({
          ratingId,
          reason
        })
      });
      return true;
    } catch (error) {
      console.error('Error reporting rating:', error);
      return false;
    }
  }

  // Helper methods
  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  validateRating(rating: number): boolean {
    return rating >= 1 && rating <= 5 && Number.isInteger(rating);
  }

  validateComment(comment: string): { isValid: boolean; error?: string } {
    if (!comment.trim()) {
      return { isValid: false, error: 'Comentário é obrigatório' };
    }
    
    if (comment.length < 10) {
      return { isValid: false, error: 'Comentário deve ter pelo menos 10 caracteres' };
    }
    
    if (comment.length > 500) {
      return { isValid: false, error: 'Comentário deve ter no máximo 500 caracteres' };
    }
    
    return { isValid: true };
  }

  private getDefaultStats(): RatingStats {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      }
    };
  }

  // Calculate average rating from array of ratings
  calculateAverageRating(ratings: Rating[]): number {
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
    return Number((sum / ratings.length).toFixed(1));
  }

  // Get rating distribution from array of ratings
  getRatingDistribution(ratings: Rating[]): RatingStats['ratingDistribution'] {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach(rating => {
      if (rating.rating >= 1 && rating.rating <= 5) {
        distribution[rating.rating as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  }
}

export default new RatingService();