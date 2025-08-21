import { initStripe, useStripe } from '@stripe/stripe-react-native';
import apiService from './apiService';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  vehicleLimit: number;
}

class PaymentService {
  private isInitialized = false;
  private stripePublishableKey: string | null = null;

  async initialize(publishableKey: string): Promise<boolean> {
    try {
      this.stripePublishableKey = publishableKey;
      
      await initStripe({
        publishableKey,
        urlScheme: 'alugae-mobile',
        setUrlSchemeOnAndroid: true,
      });

      this.isInitialized = true;
      console.log('Payment service initialized with Stripe');
      return true;
    } catch (error) {
      console.error('Error initializing payment service:', error);
      return false;
    }
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiService.makeRequest<PaymentMethod[]>('/payments/methods');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  }

  async addPaymentMethod(cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }): Promise<PaymentMethod | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Payment service not initialized');
      }

      // Note: useStripe() needs to be called from a component, not service
      // For now, send card details to backend for processing
      const response = await apiService.makeRequest<PaymentMethod>('/payments/methods', {
        method: 'POST',
        body: JSON.stringify({
          type: 'card',
          cardDetails
        })
      });

      return response;
    } catch (error) {
      console.error('Error adding payment method:', error);
      return null;
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await apiService.makeRequest(`/payments/methods/${paymentMethodId}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await apiService.makeRequest(`/payments/methods/${paymentMethodId}/set-default`, {
        method: 'POST'
      });
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  async createPaymentIntent(amount: number, currency = 'brl'): Promise<PaymentIntent | null> {
    try {
      const response = await apiService.makeRequest<PaymentIntent>('/payments/create-intent', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency,
        })
      });
      return response;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }

  async confirmPayment(paymentIntentId: string, paymentMethodId?: string): Promise<boolean> {
    try {
      // const { confirmPayment } = useStripe();
      
      // const { error } = await confirmPayment(paymentIntentId, {
      //   paymentMethodType: 'Card',
      //   paymentMethodId: paymentMethodId,
      // });

      // if (error) {
      //   throw new Error(error.message);
      // }

      // Confirm with backend
      await apiService.makeRequest(`/payments/confirm/${paymentIntentId}`, {
        method: 'POST',
        body: JSON.stringify({
          paymentMethodId,
        })
      });

      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      return false;
    }
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiService.makeRequest<SubscriptionPlan[]>('/subscription/plans');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  async createSubscription(planId: string, paymentMethodId?: string): Promise<{ success: boolean; subscriptionId?: string; clientSecret?: string }> {
    try {
      const response = await apiService.makeRequest<{ success: boolean; subscriptionId?: string; clientSecret?: string }>('/subscription/create', {
        method: 'POST',
        body: JSON.stringify({
          planId,
          paymentMethodId,
        })
      });
      return response;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false };
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      await apiService.makeRequest('/subscription/cancel', {
        method: 'POST'
      });
      return true;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  async getPaymentHistory(): Promise<any[]> {
    try {
      const response = await apiService.makeRequest<any[]>('/payments/history');
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  async processVehicleRental(vehicleId: number, startDate: string, endDate: string, paymentMethodId?: string): Promise<{ success: boolean; bookingId?: number; clientSecret?: string }> {
    try {
      const response = await apiService.makeRequest<{ success: boolean; bookingId?: number; clientSecret?: string }>('/bookings/create-with-payment', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          startDate,
          endDate,
          paymentMethodId,
        })
      });
      return response;
    } catch (error) {
      console.error('Error processing vehicle rental:', error);
      return { success: false };
    }
  }

  // PIX Payment Methods
  async createPixPayment(amount: number): Promise<{ pixCode: string; qrCode: string } | null> {
    try {
      const response = await apiService.makeRequest<{ pixCode: string; qrCode: string }>('/payments/pix/create', {
        method: 'POST',
        body: JSON.stringify({
          amount,
        })
      });
      return response;
    } catch (error) {
      console.error('Error creating PIX payment:', error);
      return null;
    }
  }

  async checkPixPaymentStatus(paymentId: string): Promise<{ status: string; paid: boolean }> {
    try {
      const response = await apiService.get(`/payments/pix/status/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking PIX payment status:', error);
      return { status: 'unknown', paid: false };
    }
  }

  // Coupon functionality
  async applyCoupon(couponCode: string, planType?: string): Promise<{ valid: boolean; discount?: number; message?: string }> {
    try {
      const response = await apiService.post('/coupons/validate', {
        code: couponCode,
        planType,
      });
      return response.data;
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { valid: false, message: 'Erro ao validar cupom' };
    }
  }

  isPaymentServiceReady(): boolean {
    return this.isInitialized && this.stripePublishableKey !== null;
  }
}

export default new PaymentService();