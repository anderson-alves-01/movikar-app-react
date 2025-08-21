import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import PaymentMethodCard from '../components/PaymentMethodCard';
import { usePaymentMethods, useCoupon } from '../hooks/usePayment';
import paymentService from '../services/paymentService';

interface RouteParams {
  bookingId?: number;
  amount?: number;
  type?: 'booking' | 'subscription';
  planId?: string;
}

export default function PaymentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, amount, type = 'booking', planId } = route.params as RouteParams;
  
  const { paymentMethods, isLoading: loadingMethods } = usePaymentMethods();
  const { validateCoupon, isValidating } = useCoupon();
  
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(amount || 0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find(method => method.isDefault);
      if (defaultMethod) {
        setSelectedMethodId(defaultMethod.id);
      }
    }
  }, [paymentMethods]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    const result = await validateCoupon(couponCode, type === 'subscription' ? planId : undefined);
    
    if (result.valid && result.discount) {
      setCouponDiscount(result.discount);
      setFinalAmount(Math.max(0, (amount || 0) - result.discount));
      Alert.alert('Sucesso', 'Cupom aplicado com sucesso!');
    } else {
      Alert.alert('Erro', result.message || 'Cupom inválido');
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedMethodId && finalAmount > 0) {
      Alert.alert('Erro', 'Selecione um método de pagamento');
      return;
    }

    try {
      setIsProcessing(true);

      let result;
      if (type === 'booking' && bookingId) {
        // Process vehicle rental payment
        result = await paymentService.processVehicleRental(
          bookingId,
          '', // startDate would come from booking details
          '', // endDate would come from booking details
          selectedMethodId || undefined
        );
      } else if (type === 'subscription' && planId) {
        // Process subscription payment
        result = await paymentService.createSubscription(planId, selectedMethodId || undefined);
      } else {
        throw new Error('Invalid payment type');
      }

      if (result.success) {
        Alert.alert(
          'Sucesso',
          type === 'booking' 
            ? 'Pagamento realizado! Sua reserva foi confirmada.'
            : 'Assinatura ativada com sucesso!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Erro', 'Falha no pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      Alert.alert('Erro', 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.alert(
      'Adicionar Método',
      'Funcionalidade de adicionar cartão estará disponível em breve.',
      [{ text: 'OK' }]
    );
  };

  if (loadingMethods) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#20B2AA" />
        <Text style={styles.loadingText}>Carregando métodos de pagamento...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo do Pagamento</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor original:</Text>
            <Text style={styles.summaryValue}>R$ {(amount || 0).toFixed(2)}</Text>
          </View>
          
          {couponDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Desconto:</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -R$ {couponDiscount.toFixed(2)}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total:</Text>
            <Text style={styles.summaryTotal}>R$ {finalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
          <View style={styles.couponContainer}>
            <Text style={styles.couponInput}>{couponCode || 'Digite o código do cupom'}</Text>
            <TouchableOpacity
              style={styles.couponButton}
              onPress={handleApplyCoupon}
              disabled={isValidating || !couponCode.trim()}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.couponButtonText}>Aplicar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Métodos de Pagamento</Text>
            <TouchableOpacity onPress={handleAddPaymentMethod}>
              <Text style={styles.addMethodText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          {paymentMethods.length === 0 ? (
            <View style={styles.noMethodsContainer}>
              <Text style={styles.noMethodsText}>Nenhum método de pagamento cadastrado</Text>
              <TouchableOpacity style={styles.addMethodButton} onPress={handleAddPaymentMethod}>
                <Text style={styles.addMethodButtonText}>Adicionar Cartão</Text>
              </TouchableOpacity>
            </View>
          ) : (
            paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                isSelected={selectedMethodId === method.id}
                onSelect={() => setSelectedMethodId(method.id)}
              />
            ))
          )}
        </View>

        {/* PIX Option */}
        {finalAmount > 0 && (
          <TouchableOpacity style={styles.pixButton}>
            <Text style={styles.pixButtonText}>💳 Pagar com PIX</Text>
            <Text style={styles.pixButtonSubtext}>Pagamento instantâneo</Text>
          </TouchableOpacity>
        )}

        {/* Process Payment Button */}
        <TouchableOpacity
          style={[
            styles.payButton,
            (isProcessing || (finalAmount > 0 && !selectedMethodId)) && styles.payButtonDisabled
          ]}
          onPress={handleProcessPayment}
          disabled={isProcessing || (finalAmount > 0 && !selectedMethodId)}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {finalAmount === 0 ? 'Ativar Gratuitamente' : `Pagar R$ ${finalAmount.toFixed(2)}`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    color: '#27AE60',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addMethodText: {
    fontSize: 16,
    color: '#20B2AA',
    fontWeight: '600',
  },
  couponContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  couponInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  couponButton: {
    backgroundColor: '#20B2AA',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  noMethodsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noMethodsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  addMethodButton: {
    backgroundColor: '#20B2AA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addMethodButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  pixButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#20B2AA',
  },
  pixButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#20B2AA',
    marginBottom: 4,
  },
  pixButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#20B2AA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});