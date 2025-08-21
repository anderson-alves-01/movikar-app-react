import { useState, useEffect } from 'react';
import paymentService, { PaymentMethod, SubscriptionPlan } from '../services/paymentService';

export const usePaymentMethods = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (err) {
      setError('Erro ao carregar métodos de pagamento');
      console.error('Error fetching payment methods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const addPaymentMethod = async (cardDetails: {
    number: string;
    expiryMonth: number;
    expiryYear: number;
    cvc: string;
  }) => {
    try {
      const newMethod = await paymentService.addPaymentMethod(cardDetails);
      if (newMethod) {
        await fetchPaymentMethods();
        return { success: true };
      }
      return { success: false, error: 'Erro ao adicionar método de pagamento' };
    } catch (err) {
      return { success: false, error: 'Erro ao adicionar método de pagamento' };
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    try {
      const success = await paymentService.removePaymentMethod(paymentMethodId);
      if (success) {
        await fetchPaymentMethods();
        return { success: true };
      }
      return { success: false, error: 'Erro ao remover método de pagamento' };
    } catch (err) {
      return { success: false, error: 'Erro ao remover método de pagamento' };
    }
  };

  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      const success = await paymentService.setDefaultPaymentMethod(paymentMethodId);
      if (success) {
        await fetchPaymentMethods();
        return { success: true };
      }
      return { success: false, error: 'Erro ao definir método padrão' };
    } catch (err) {
      return { success: false, error: 'Erro ao definir método padrão' };
    }
  };

  return {
    paymentMethods,
    isLoading,
    error,
    refresh: fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
  };
};

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const subscriptionPlans = await paymentService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
    } catch (err) {
      setError('Erro ao carregar planos de assinatura');
      console.error('Error fetching subscription plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const createSubscription = async (planId: string, paymentMethodId?: string) => {
    try {
      const result = await paymentService.createSubscription(planId, paymentMethodId);
      return result;
    } catch (err) {
      return { success: false, error: 'Erro ao criar assinatura' };
    }
  };

  return {
    plans,
    isLoading,
    error,
    refresh: fetchPlans,
    createSubscription,
  };
};

export const usePaymentHistory = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await paymentService.getPaymentHistory();
      setPayments(history);
    } catch (err) {
      setError('Erro ao carregar histórico de pagamentos');
      console.error('Error fetching payment history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  return {
    payments,
    isLoading,
    error,
    refresh: fetchPaymentHistory,
  };
};

export const useCoupon = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateCoupon = async (couponCode: string, planType?: string) => {
    try {
      setIsValidating(true);
      const result = await paymentService.applyCoupon(couponCode, planType);
      return result;
    } catch (err) {
      return { valid: false, message: 'Erro ao validar cupom' };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    validateCoupon,
  };
};