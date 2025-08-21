import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import paymentService, { BookingPayment } from '../services/paymentService';

type RootStackParamList = {
  Payment: {
    vehicleId: number;
    startDate: string;
    endDate: string;
    totalAmount: number;
    vehicleName: string;
  };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'Payment'>;
  route: RouteProp<RootStackParamList, 'Payment'>;
};

const STRIPE_PUBLIC_KEY = 'pk_live_51PjTKCEcLv6iP9LCaQyQVwcU2qUMBxoOxLkbFaIGNBfRFKsL9sVYXiJkDNWe4wTyU5kKJZv4jMZBqTm8V1y...'; // Your actual Stripe public key

function PaymentContent({ navigation, route }: Props) {
  const { vehicleId, startDate, endDate, totalAmount, vehicleName } = route.params;
  const { confirmPayment } = useStripe();
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);

  useEffect(() => {
    calculatePrice();
  }, []);

  const calculatePrice = async () => {
    try {
      const breakdown = await paymentService.calculateBookingPrice({
        vehicleId,
        startDate,
        endDate,
        couponCode: couponCode || undefined,
      });
      setPriceBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating price:', error);
    }
  };

  const handleCardPayment = async () => {
    if (!cardComplete) {
      Alert.alert('Erro', 'Por favor, preencha os dados do cartão');
      return;
    }

    setLoading(true);
    try {
      // Create payment intent
      const bookingData: BookingPayment = {
        vehicleId,
        startDate,
        endDate,
        totalAmount: priceBreakdown?.totalPrice || totalAmount,
        serviceFee: priceBreakdown?.serviceFee,
        insuranceFee: priceBreakdown?.insuranceFee,
        discountAmount: priceBreakdown?.discountAmount,
        couponCode: couponCode || undefined,
      };

      const paymentIntent = await paymentService.createBookingPaymentIntent(bookingData);

      // Confirm payment
      const result = await paymentService.processCardPayment(paymentIntent.clientSecret);

      if (result.success) {
        Alert.alert(
          'Pagamento Aprovado!',
          'Sua reserva foi confirmada. Você receberá os detalhes por email.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('BookingConfirmation', {
                bookingId: result.paymentIntent?.metadata?.bookingId,
              }),
            },
          ]
        );
      } else {
        Alert.alert('Erro no Pagamento', result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setLoading(true);
    try {
      const bookingData: BookingPayment = {
        vehicleId,
        startDate,
        endDate,
        totalAmount: priceBreakdown?.totalPrice || totalAmount,
        serviceFee: priceBreakdown?.serviceFee,
        insuranceFee: priceBreakdown?.insuranceFee,
        discountAmount: priceBreakdown?.discountAmount,
        couponCode: couponCode || undefined,
      };

      const result = await paymentService.processPixPayment(bookingData);

      if (result.success) {
        setPixPaymentData(result);
        // Navigate to PIX payment screen
        navigation.navigate('PixPayment', {
          pixCode: result.pixCode,
          pixQrCode: result.pixQrCode,
          paymentId: result.paymentId,
          amount: bookingData.totalAmount,
        });
      } else {
        Alert.alert('Erro', result.error || 'Erro ao gerar pagamento PIX');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao processar pagamento PIX');
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      return;
    }

    try {
      const validation = await paymentService.validateCoupon(couponCode, {
        vehicleId,
        startDate,
        endDate,
        totalAmount,
      });

      if (validation.valid) {
        await calculatePrice(); // Recalculate with coupon
        Alert.alert('Sucesso', 'Cupom aplicado com sucesso!');
      } else {
        Alert.alert('Cupom Inválido', validation.message || 'Cupom não encontrado');
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao validar cupom');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>

      {/* Booking Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumo da Reserva</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Veículo:</Text>
          <Text style={styles.summaryValue}>{vehicleName}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Data de retirada:</Text>
          <Text style={styles.summaryValue}>{new Date(startDate).toLocaleDateString('pt-BR')}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Data de devolução:</Text>
          <Text style={styles.summaryValue}>{new Date(endDate).toLocaleDateString('pt-BR')}</Text>
        </View>
      </View>

      {/* Price Breakdown */}
      {priceBreakdown && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhes do Preço</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Preço base:</Text>
            <Text style={styles.summaryValue}>R$ {priceBreakdown.basePrice.toFixed(2)}</Text>
          </View>
          {priceBreakdown.serviceFee > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Taxa de serviço:</Text>
              <Text style={styles.summaryValue}>R$ {priceBreakdown.serviceFee.toFixed(2)}</Text>
            </View>
          )}
          {priceBreakdown.insuranceFee > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Seguro:</Text>
              <Text style={styles.summaryValue}>R$ {priceBreakdown.insuranceFee.toFixed(2)}</Text>
            </View>
          )}
          {priceBreakdown.discountAmount > 0 && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Desconto:</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -R$ {priceBreakdown.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.summaryItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>R$ {priceBreakdown.totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Coupon Code */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cupom de Desconto</Text>
        <View style={styles.couponContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="Digite o código do cupom"
            value={couponCode}
            onChangeText={setCouponCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.couponButton}
            onPress={applyCoupon}
          >
            <Text style={styles.couponButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Método de Pagamento</Text>
        
        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'card' && styles.selectedPaymentMethod,
          ]}
          onPress={() => setPaymentMethod('card')}
        >
          <Ionicons name="card-outline" size={24} color="#333" />
          <Text style={styles.paymentMethodText}>Cartão de Crédito/Débito</Text>
          {paymentMethod === 'card' && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.paymentMethodButton,
            paymentMethod === 'pix' && styles.selectedPaymentMethod,
          ]}
          onPress={() => setPaymentMethod('pix')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#333" />
          <Text style={styles.paymentMethodText}>PIX</Text>
          {paymentMethod === 'pix' && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>
      </View>

      {/* Card Details */}
      {paymentMethod === 'card' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cartão</Text>
          <CardField
            postalCodeEnabled={false}
            placeholders={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={styles.cardField}
            style={styles.cardContainer}
            onCardChange={(cardDetails) => {
              setCardComplete(cardDetails.complete);
            }}
          />
        </View>
      )}

      {/* Payment Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={paymentMethod === 'card' ? handleCardPayment : handlePixPayment}
          disabled={loading || (paymentMethod === 'card' && !cardComplete)}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>
              {paymentMethod === 'card' ? 'Pagar com Cartão' : 'Pagar com PIX'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Security Info */}
      <View style={styles.securityInfo}>
        <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          Seus dados estão protegidos com criptografia SSL
        </Text>
      </View>
    </ScrollView>
  );
}

export default function PaymentScreen(props: Props) {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLIC_KEY}>
      <PaymentContent {...props} />
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountValue: {
    color: '#4CAF50',
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  couponButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  couponButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPaymentMethod: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  cardContainer: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
});