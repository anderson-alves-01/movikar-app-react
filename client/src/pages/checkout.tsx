import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth";
import Header from "@/components/header";
import PaymentMethodSelector from "@/components/payment-method-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, Shield, Calendar, Car, DollarSign, QrCode, Coins, Percent } from "lucide-react";
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
  securityDeposit: string;
  includeInsurance?: boolean;
  paymentIntentId?: string;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    pricePerDay: string;
    securityDepositPercentage: number;
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
  const [pointsToUse, setPointsToUse] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const queryClient = useQueryClient();

  // Fetch user rewards
  const { data: rewards } = useQuery<{
    availablePoints: number;
    totalPoints: number;
  }>({
    queryKey: ['/api/rewards/balance'],
  });

  // Apply points discount mutation
  const applyPointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const response = await apiRequest("POST", "/api/rewards/use-points", {
        points,
        description: `Desconto aplicado no aluguel (${points} pontos)`,
        bookingId: null,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao aplicar pontos');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAppliedDiscount(data.discountAmount);
      toast({
        title: "Desconto aplicado!",
        description: `R$ ${data.discountAmount.toFixed(2)} de desconto aplicado`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/balance'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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
  const hasInsurance = checkoutData.includeInsurance !== false; // Default to true for existing bookings
  const subtotal = parseFloat(checkoutData.totalPrice) - parseFloat(checkoutData.serviceFee) - (hasInsurance ? parseFloat(checkoutData.insuranceFee) : 0);
  const finalTotal = parseFloat(checkoutData.totalPrice) - appliedDiscount;

  const handleApplyPoints = () => {
    const points = parseInt(pointsToUse);
    if (points > 0 && points <= (rewards?.availablePoints || 0)) {
      applyPointsMutation.mutate(points);
    }
  };

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

            {/* Points Section */}
            {rewards && rewards.availablePoints > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coins className="h-5 w-5 mr-2 text-yellow-600" />
                    Usar Pontos de Recompensa
                  </CardTitle>
                  <CardDescription>
                    Você tem {rewards.availablePoints} pontos disponíveis (= R$ {(rewards.availablePoints * 0.01).toFixed(2)})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label htmlFor="pointsInput">Pontos a usar</Label>
                        <Input
                          id="pointsInput"
                          type="number"
                          placeholder="Digite a quantidade de pontos"
                          value={pointsToUse}
                          onChange={(e) => setPointsToUse(e.target.value)}
                          min="1"
                          max={Math.min(rewards.availablePoints, Math.floor(parseFloat(checkoutData.totalPrice) * 100))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex flex-col justify-end">
                        <Button 
                          onClick={handleApplyPoints}
                          disabled={!pointsToUse || parseInt(pointsToUse) <= 0 || applyPointsMutation.isPending}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {applyPointsMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Aplicando...
                            </>
                          ) : (
                            <>
                              <Percent className="h-4 w-4 mr-2" />
                              Aplicar Desconto
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {pointsToUse && parseInt(pointsToUse) > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm text-green-800">
                          Desconto de R$ {(parseInt(pointsToUse) * 0.01).toFixed(2)} será aplicado
                        </p>
                      </div>
                    )}

                    {appliedDiscount > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          ✅ Desconto de R$ {appliedDiscount.toFixed(2)} aplicado com sucesso!
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
                        {paymentMethod === 'pix' ? 'Gerar PIX' : 'Confirmar Pagamento'} - {formatCurrency(finalTotal)}
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
                
                {hasInsurance && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Seguro (15%)</span>
                    <span>{formatCurrency(parseFloat(checkoutData.insuranceFee))}</span>
                  </div>
                )}

                {!hasInsurance && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>⚠️ Sem seguro</span>
                    <span className="font-medium">R$ 0,00</span>
                  </div>
                )}

                {/* Security Deposit */}
                <div className="flex justify-between text-sm text-blue-600">
                  <span>
                    Caução {(checkoutData.vehicle as any).securityDepositType === 'percentage' 
                      ? `(${(checkoutData.vehicle as any).securityDepositValue || checkoutData.vehicle.securityDepositPercentage}%)`
                      : ''
                    }
                  </span>
                  <span>{formatCurrency(parseFloat(checkoutData.securityDeposit))}</span>
                </div>

                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto por pontos</span>
                    <span>-{formatCurrency(appliedDiscount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total{appliedDiscount > 0 ? ' (com desconto)' : ''}</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 line-through">
                      <span>Total original</span>
                      <span>{formatCurrency(parseFloat(checkoutData.totalPrice))}</span>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mt-4 border border-yellow-200">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
                    <div className="text-sm text-yellow-800">
                      <strong>Sobre a Caução</strong>
                      <p className="mt-1">
                        A caução de {formatCurrency(parseFloat(checkoutData.securityDeposit))} será retida como garantia e 
                        devolvida integralmente após a devolução do veículo, se não houver danos.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
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

  // Fetch admin settings to check if checkout is enabled
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings');
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Check if checkout feature is enabled
  useEffect(() => {
    if (adminSettings && !adminSettings.enableRentNowCheckout) {
      toast({
        title: "Funcionalidade indisponível",
        description: "O checkout está temporariamente desabilitado. Redirecionando...",
        variant: "destructive",
      });
      
      setTimeout(() => {
        const vehicleId = params?.vehicleId;
        setLocation(vehicleId ? `/vehicle/${vehicleId}` : "/");
      }, 2000);
    }
  }, [adminSettings, params?.vehicleId, setLocation, toast]);

  // Get checkout data from URL params or server
  useEffect(() => {
    const loadCheckoutData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      const checkoutId = urlParams.get('checkoutId');
      
      if (checkoutId) {
        // Load data from server using checkout ID
        try {
          const response = await apiRequest("GET", `/api/checkout-data/${checkoutId}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              console.warn('⚠️ Checkout data expired or not found (404)');
              const vehicleId = params?.vehicleId;
              toast({
                title: "Sessão de checkout expirada",
                description: "Seus dados de checkout expiraram. Redirecionando para selecionar o veículo novamente...",
                variant: "destructive",
              });
              setTimeout(() => {
                setLocation(vehicleId ? `/vehicles/${vehicleId}` : "/");
              }, 2000);
              return;
            }
            throw new Error(`${response.status}: Erro ao carregar dados de checkout`);
          }
          
          const serverData = await response.json();
          setCheckoutData(serverData);
        } catch (error: any) {
          console.error("Error loading checkout data from server:", error);
          
          if (error.message?.includes("404") || error.message?.includes("não encontrados") || error.message?.includes("expirados")) {
            const vehicleId = params?.vehicleId;
            toast({
              title: "Sessão de checkout expirada", 
              description: "Seus dados de checkout expiraram. Redirecionando para selecionar o veículo novamente...",
              variant: "destructive",
            });
            setTimeout(() => {
              setLocation(vehicleId ? `/vehicles/${vehicleId}` : "/");
            }, 2000);
          } else {
            toast({
              title: "Erro",
              description: "Erro ao carregar dados de checkout",
              variant: "destructive",
            });
            setLocation("/");
          }
        }
      } else if (data) {
        // Fallback to URL data (for compatibility)
        try {
          // Check if data is too long (HTTP 431 protection)
          if (data.length > 8000) {
            toast({
              title: "Erro",
              description: "URL muito longa. Tente novamente.",
              variant: "destructive",
            });
            setLocation("/");
            return;
          }
          
          const parsedData = JSON.parse(decodeURIComponent(data));
          setCheckoutData(parsedData);
        } catch (error: any) {
          console.error("Error loading checkout data:", error);
          
          // Check if this is a 404 (expired checkout data)
          if (error.message?.includes("404") || error.message?.includes("não encontrados") || error.message?.includes("expirados")) {
            const vehicleId = params?.vehicleId;
            toast({
              title: "Sessão de checkout expirada",
              description: "Seus dados de checkout expiraram. Você será redirecionado para selecionar o veículo novamente.",
              variant: "destructive",
            });
            // Redirect to the vehicle detail page
            setTimeout(() => {
              setLocation(vehicleId ? `/vehicles/${vehicleId}` : "/");
            }, 2000);
          } else {
            toast({
              title: "Erro",
              description: "Dados de checkout inválidos",
              variant: "destructive",
            });
            setLocation("/");
          }
        }
      } else {
        // No data found - redirect to vehicle page for rebooking
        const vehicleId = params?.vehicleId;
        toast({
          title: "Dados de checkout não encontrados",
          description: "Redirecionando para seleção do veículo...",
          variant: "destructive",
        });
        setTimeout(() => {
          setLocation(vehicleId ? `/vehicles/${vehicleId}` : "/");
        }, 1500);
      }
    };

    loadCheckoutData();
  }, []);

  // Create payment intent when component loads
  useEffect(() => {
    if (!checkoutData || !user) {
      console.log('⏸️ Skipping payment intent creation - missing data:', {
        hasCheckoutData: !!checkoutData,
        hasUser: !!user
      });
      return;
    }

    const createPaymentIntent = async () => {
      try {
        console.log('🎯 Starting payment intent creation for checkout data:', checkoutData);
        
        // Validate checkout data before sending
        if (!checkoutData.vehicleId || !checkoutData.startDate || !checkoutData.endDate || !checkoutData.totalPrice) {
          console.error('❌ Invalid checkout data:', checkoutData);
          toast({
            title: "Dados de checkout incompletos",
            description: "Alguns dados necessários estão faltando. Redirecionando para seleção do veículo...",
            variant: "destructive",
          });
          setTimeout(() => setLocation("/"), 2000);
          return;
        }
        
        const requestData = {
          vehicleId: parseInt(checkoutData.vehicleId.toString()),
          startDate: checkoutData.startDate,
          endDate: checkoutData.endDate,
          totalPrice: checkoutData.totalPrice.toString(),
        };
        
        console.log('📤 Making API request with data:', requestData);
        
        const response = await apiRequest("POST", "/api/create-payment-intent", requestData);
        console.log('📥 API response received, status:', response.status);
        
        if (!response.ok) {
          console.error('❌ API response not OK:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('❌ Error response body:', errorText);
          throw new Error(`${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Payment intent created successfully:', result);
        setClientSecret(result.clientSecret);
        
        // Store payment intent ID in checkout data
        setCheckoutData(prev => prev ? {
          ...prev,
          paymentIntentId: result.paymentIntentId
        } : null);
        
      } catch (error: any) {
        console.error("❌ Payment intent creation error:", error);
        console.error("❌ Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack?.substring(0, 500)
        });
        
        // Enhanced error parsing and handling
        const errorMessage = error.message || "Falha ao inicializar pagamento";
        
        // Parse status code and response
        let statusCode = 0;
        let responseBody = '';
        
        const statusMatch = errorMessage.match(/^(\d{3}):\s*(.*)/);
        if (statusMatch) {
          statusCode = parseInt(statusMatch[1]);
          responseBody = statusMatch[2];
        }
        
        // Try to parse JSON response body
        let parsedResponse: any = null;
        try {
          parsedResponse = JSON.parse(responseBody);
        } catch {
          // Response is not JSON, use as plain text
        }
        
        const finalMessage = parsedResponse?.message || responseBody || errorMessage;
        
        // Handle different error types with appropriate user feedback and actions
        switch (statusCode) {
          case 400:
            // Business logic errors - show specific message and suggest actions
            toast({
              title: "Não foi possível processar o pagamento",
              description: finalMessage,
              variant: "destructive",
            });
            
            // For availability errors, redirect back to vehicle page
            if (finalMessage.includes("não disponível") || finalMessage.includes("datas selecionadas")) {
              setTimeout(() => {
                setLocation(`/vehicle/${checkoutData.vehicleId}`);
              }, 3000);
            } else if (finalMessage.includes("próprio veículo")) {
              setTimeout(() => setLocation("/"), 2000);
            }
            break;
            
          case 403:
            // User not verified or unauthorized
            toast({
              title: "Acesso negado",
              description: finalMessage,
              variant: "destructive",
            });
            setTimeout(() => setLocation("/profile"), 3000);
            break;
            
          case 404:
            // Resource not found
            toast({
              title: "Recurso não encontrado", 
              description: "O veículo ou usuário não foi encontrado. Redirecionando...",
              variant: "destructive",
            });
            setTimeout(() => setLocation("/"), 2000);
            break;
            
          case 429:
            // Rate limiting
            toast({
              title: "Muitas tentativas",
              description: "Aguarde alguns segundos e tente novamente.",
              variant: "destructive",
            });
            // Don't redirect, let user try again
            break;
            
          case 500:
          case 503:
            // Server errors
            if (finalMessage.includes("Stripe") || finalMessage.includes("pagamento")) {
              toast({
                title: "Serviço temporariamente indisponível",
                description: "Sistema de pagamento em manutenção. Tente novamente em alguns minutos.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Erro interno do servidor",
                description: `Problema temporário no sistema. Tente novamente em alguns minutos.`,
                variant: "destructive",
              });
            }
            
            // Offer retry option for server errors
            setTimeout(() => {
              toast({
                title: "Tentar novamente?",
                description: "O sistema pode estar funcionando novamente. Clique para tentar novamente.",
                action: (
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="ml-auto"
                  >
                    Tentar Novamente
                  </Button>
                ),
              });
            }, 5000);
            break;
            
          default:
            // Unknown or network errors
            toast({
              title: "Erro de conexão",
              description: "Verifique sua conexão com a internet e tente novamente.",
              variant: "destructive",
            });
            
            // Offer reload option
            setTimeout(() => {
              toast({
                title: "Recarregar página?",
                description: "A conexão pode ter sido restaurada. Recarregar a página?",
                action: (
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="ml-auto"
                  >
                    Recarregar
                  </Button>
                ),
              });
            }, 3000);
        }
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