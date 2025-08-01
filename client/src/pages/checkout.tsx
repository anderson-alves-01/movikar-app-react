import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth";
import Header from "@/components/header";
import PaymentMethodSelector from "@/components/payment-method-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Shield, Calendar, Car, DollarSign, QrCode } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { getClientFeatureFlags } from "@shared/feature-flags";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface CheckoutData {
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalPrice: string;
  serviceFee: string;
  insuranceFee: string;
  paymentIntentId?: string;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    pricePerDay: string;
    images: string[];
  };
}

const CheckoutForm = ({ checkoutData }: { checkoutData: CheckoutData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const featureFlags = getClientFeatureFlags();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent?.status === 'succeeded') {
        // Payment succeeded - redirect to success page with payment intent ID
        toast({
          title: "Pagamento realizado!",
          description: "Redirecionando para confirmação...",
        });
        setLocation(`/payment-success?payment_intent=${paymentIntent.id}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateDays = () => {
    const start = new Date(checkoutData.startDate);
    const end = new Date(checkoutData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const days = calculateDays();
  const subtotal = parseFloat(checkoutData.totalPrice) - parseFloat(checkoutData.serviceFee) - parseFloat(checkoutData.insuranceFee);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/vehicle/${checkoutData.vehicleId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao veículo
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-800">Finalizar Aluguel</h1>
          <p className="text-gray-600 mt-2">Complete o pagamento para confirmar sua reserva</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Vehicle Details */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Detalhes da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  {checkoutData.vehicle.images && checkoutData.vehicle.images.length > 0 && (
                    <img
                      src={checkoutData.vehicle.images[0]}
                      alt={`${checkoutData.vehicle.brand} ${checkoutData.vehicle.model}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">
                      {checkoutData.vehicle.brand} {checkoutData.vehicle.model} {checkoutData.vehicle.year}
                    </h3>
                    <div className="text-gray-600 mt-2 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(checkoutData.startDate).toLocaleDateString('pt-BR')} - {new Date(checkoutData.endDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div>
                        <strong>{days} dias</strong> de aluguel
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Selection - PIX available only in production */}
            {featureFlags.pixPaymentEnabled && (
              <PaymentMethodSelector 
                selectedMethod={paymentMethod}
                onMethodChange={(method: string) => setPaymentMethod(method as 'card' | 'pix')}
              />
            )}

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {paymentMethod === 'pix' ? <QrCode className="h-5 w-5 mr-2" /> : <Shield className="h-5 w-5 mr-2" />}
                  {paymentMethod === 'pix' ? 'Pagamento PIX' : 'Informações de Pagamento'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {paymentMethod === 'pix' && featureFlags.pixPaymentEnabled && (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                      <QrCode className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-700">
                        Após clicar em "Finalizar Pagamento", você receberá um QR Code PIX para completar o pagamento.
                      </p>
                    </div>
                  )}
                  <PaymentElement />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-red-600 text-white" 
                    disabled={!stripe || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando pagamento...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'pix' ? <QrCode className="h-4 w-4 mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
                        {paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar Pagamento'} - {formatCurrency(parseFloat(checkoutData.totalPrice))}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal ({days} dias)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxa de serviço (10%)</span>
                  <span>{formatCurrency(parseFloat(checkoutData.serviceFee))}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Seguro (5%)</span>
                  <span>{formatCurrency(parseFloat(checkoutData.insuranceFee))}</span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(checkoutData.totalPrice))}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-6">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                    <div className="text-sm text-blue-800">
                      <strong>Pagamento 100% seguro</strong>
                      <p className="mt-1">Seus dados estão protegidos com criptografia SSL e processamento seguro via Stripe. {featureFlags.pixPaymentEnabled ? 'PIX e cartão aceitos.' : 'Pagamento com cartão.'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [, params] = useRoute("/checkout/:vehicleId");
  const [clientSecret, setClientSecret] = useState("");
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Get checkout data from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const data = urlParams.get('data');
    
    if (data) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(data));
        setCheckoutData(parsedData);
      } catch (error) {
        console.error("Error parsing checkout data:", error);
        toast({
          title: "Erro",
          description: "Dados de checkout inválidos",
          variant: "destructive",
        });
        setLocation("/");
      }
    }
  }, []);

  // Create payment intent when component loads
  useEffect(() => {
    if (!checkoutData || !user) return;

    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          vehicleId: checkoutData.vehicleId,
          startDate: checkoutData.startDate,
          endDate: checkoutData.endDate,
          totalPrice: checkoutData.totalPrice,
        });

        const result = await response.json();
        setClientSecret(result.clientSecret);
        
        // Store payment intent ID in checkout data
        setCheckoutData(prev => prev ? {
          ...prev,
          paymentIntentId: result.paymentIntentId
        } : null);
        
      } catch (error: any) {
        console.error("Payment intent creation error:", error);
        toast({
          title: "Erro",
          description: error.message || "Falha ao inicializar pagamento",
          variant: "destructive",
        });
        setLocation("/");
      }
    };

    createPaymentIntent();
  }, [checkoutData, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Login Necessário</h1>
            <p className="text-gray-600">Você precisa estar logado para finalizar um aluguel.</p>
            <Button 
              onClick={() => setLocation("/auth/login")}
              className="mt-4"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!checkoutData || !clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Carregando dados de pagamento...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm checkoutData={checkoutData} />
    </Elements>
  );
}