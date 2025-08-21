import { StripeProvider, useStripe, usePaymentSheet } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from './authService';

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface BookingPayment {
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  serviceFee?: number;
  insuranceFee?: number;
  discountAmount?: number;
  couponCode?: string;
}

export interface SubscriptionPayment {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

class PaymentService {
  private stripe: any = null;

  // Initialize Stripe
  initializeStripe(publishableKey: string) {
    // This should be called in your App component with StripeProvider
    console.log('Stripe initialized with key:', publishableKey.substring(0, 20) + '...');
  }

  // Set Stripe instance (called from component using useStripe hook)
  setStripeInstance(stripeInstance: any) {
    this.stripe = stripeInstance;
  }

  // Create payment intent for booking
  async createBookingPaymentIntent(bookingData: BookingPayment): Promise<PaymentIntent> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/create-booking-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar intenção de pagamento');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating booking payment intent:', error);
      throw error;
    }
  }

  // Create payment intent for subscription
  async createSubscriptionPaymentIntent(subscriptionData: SubscriptionPayment): Promise<PaymentIntent> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/create-subscription-intent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar intenção de pagamento da assinatura');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating subscription payment intent:', error);
      throw error;
    }
  }

  // Process payment with card
  async processCardPayment(
    paymentIntentClientSecret: string,
    paymentMethodData?: any
  ): Promise<{ success: boolean; paymentIntent?: any; error?: string }> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe não inicializado');
      }

      const { error, paymentIntent } = await this.stripe.confirmPayment(
        paymentIntentClientSecret,
        paymentMethodData || {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, paymentIntent };
    } catch (error) {
      console.error('Error processing card payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Process PIX payment
  async processPixPayment(bookingData: BookingPayment): Promise<{
    success: boolean;
    pixCode?: string;
    pixQrCode?: string;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/create-pix-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar pagamento PIX');
      }

      const data = await response.json();
      return {
        success: true,
        pixCode: data.pixCode,
        pixQrCode: data.pixQrCode,
        paymentId: data.paymentId,
      };
    } catch (error) {
      console.error('Error processing PIX payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Check PIX payment status
  async checkPixPaymentStatus(paymentId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    transactionId?: string;
  }> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`https://alugae.mobi/api/payments/pix-status/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao verificar status do pagamento PIX');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking PIX payment status:', error);
      throw error;
    }
  }

  // Get payment methods
  async getPaymentMethods(): Promise<any[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/methods', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar métodos de pagamento');
      }

      const data = await response.json();
      return data.paymentMethods || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // Save payment method
  async savePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/save-method', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar método de pagamento');
      }
    } catch (error) {
      console.error('Error saving payment method:', error);
      throw error;
    }
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`https://alugae.mobi/api/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao deletar método de pagamento');
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
      throw error;
    }
  }

  // Get payment history
  async getPaymentHistory(page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`https://alugae.mobi/api/payments/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao buscar histórico de pagamentos');
      }

      const data = await response.json();
      return data.payments || [];
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number, reason?: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('https://alugae.mobi/api/payments/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          amount,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar reembolso');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Calculate booking price
  async calculateBookingPrice(bookingData: {
    vehicleId: number;
    startDate: string;
    endDate: string;
    couponCode?: string;
  }): Promise<{
    basePrice: number;
    serviceFee: number;
    insuranceFee: number;
    discountAmount: number;
    totalPrice: number;
    breakdown: any;
  }> {
    try {
      const response = await fetch('https://alugae.mobi/api/payments/calculate-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao calcular preço');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calculating booking price:', error);
      throw error;
    }
  }

  // Validate coupon
  async validateCoupon(couponCode: string, bookingData?: any): Promise<{
    valid: boolean;
    discount: number;
    discountType: 'percentage' | 'fixed';
    message?: string;
  }> {
    try {
      const response = await fetch('https://alugae.mobi/api/payments/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode,
          bookingData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao validar cupom');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  }
}

export default new PaymentService();