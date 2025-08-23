import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Sparkles, ArrowLeft, CreditCard, Coins, Percent, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
console.log('🔑 Loading Stripe with public key:', import.meta.env.VITE_STRIPE_PUBLIC_KEY ? 'Present' : 'Missing');
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CheckoutFormProps {
  clientSecret: string;
  planName: string;
  paymentMethod: string;
  amount: number;
  couponApplied?: string | null;
  couponDiscountAmount?: number;
  type?: string; // 'setup_intent' or 'payment_intent'
}

const CheckoutForm = ({ clientSecret, planName, paymentMethod, amount, couponApplied, couponDiscountAmount = 0, type }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
        description: `Desconto aplicado na assinatura ${planName} (${points} pontos)`,
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
        description: `R$ ${data.discountAmount.toFixed(2)} de desconto aplicado na assinatura`,
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

  const handleApplyPoints = () => {
    const points = parseInt(pointsToUse);
    if (points > 0 && points <= (rewards?.availablePoints || 0)) {
      applyPointsMutation.mutate(points);
    }
  };

  const finalAmount = amount - (appliedDiscount * 100); // Convert discount from reais to cents

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    // Use confirmSetup for SetupIntent, confirmPayment for PaymentIntent
    let error, setupIntent, paymentIntent;
    if (type === 'setup_intent' || clientSecret.startsWith('seti_')) {
      // This is a SetupIntent
      const setupResult = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription-success",
        },
        redirect: "if_required",
      });
      error = setupResult.error;
      setupIntent = setupResult.setupIntent;
    } else {
      // This is a PaymentIntent
      const paymentResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription-success",
        },
        redirect: "if_required",
      });
      error = paymentResult.error;
      paymentIntent = paymentResult.paymentIntent;
    }

    if (error) {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
      setIsLoading(false);
    } else if ((setupIntent && setupIntent.status === "succeeded") || (paymentIntent && paymentIntent.status === "succeeded")) {
      // Confirm subscription on backend
      try {
        const intentId = setupIntent?.id || paymentIntent?.id;
        const response = await apiRequest("POST", "/api/subscription/confirm", {
          paymentIntentId: intentId,
        });

        if (response.ok) {
          toast({
            title: "Assinatura Ativada!",
            description: "Sua assinatura foi ativada com sucesso.",
          });
          setLocation("/subscription-success?plan=" + planName);
        } else {
          throw new Error("Erro ao confirmar assinatura");
        }
      } catch (error) {
        toast({
          title: "Erro",
          description: "Pagamento processado, mas erro ao ativar assinatura. Entre em contato com o suporte.",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return <Star className="h-6 w-6 text-amber-500" />;
      case 'plus':
        return <Crown className="h-6 w-6 text-purple-500" />;
      default:
        return <Sparkles className="h-6 w-6 text-blue-500" />;
    }
  };

  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return 'Plano Essencial';
      case 'plus':
        return 'Plano Plus';
      default:
        return 'Plano';
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getPlanIcon(planName)}
          </div>
          <CardTitle className="text-2xl">
            Finalizar Assinatura
          </CardTitle>
          <CardDescription>
            {getPlanDisplayName(planName)} - {paymentMethod === 'annual' ? 'Anual' : 'Mensal'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatAmount(amount)}
          </div>
          {couponApplied && couponDiscountAmount > 0 && (
            <div className="mb-4">
              <Badge variant="default" className="bg-green-600 text-white">
                Cupom {couponApplied} aplicado: -{formatAmount(couponDiscountAmount)}
              </Badge>
            </div>
          )}
          {paymentMethod === 'annual' && (
            <Badge variant="secondary" className="mb-4">
              Economize 20% com o plano anual
            </Badge>
          )}
          {appliedDiscount > 0 && (
            <Badge variant="default" className="bg-blue-600 mb-4">
              Desconto adicional de pontos: R$ {appliedDiscount.toFixed(2)}
            </Badge>
          )}
        </CardContent>
      </Card>

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
                    max={Math.min(rewards.availablePoints, Math.floor(amount / 100 * 100))}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Informações de Pagamento
          </CardTitle>
          <CardDescription>
            Seus dados são protegidos com criptografia SSL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={!stripe || !elements || isLoading}
                size="lg"
              >
                {isLoading ? (
                  "Processando..."
                ) : (
                  `Pagar ${formatAmount(appliedDiscount > 0 ? finalAmount : amount)}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        <p>
          Pagamento seguro processado pelo Stripe. Você pode cancelar sua assinatura a qualquer momento.
        </p>
      </div>
    </div>
  );
};

export default function SubscriptionCheckout() {
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const [checkoutValidated, setCheckoutValidated] = useState(false);
  const searchParams = new URLSearchParams(location.split('?')[1]);
  
  const clientSecret = searchParams.get('clientSecret');
  const planName = searchParams.get('planName');
  const paymentMethod = searchParams.get('paymentMethod') || 'monthly';
  const amount = parseInt(searchParams.get('amount') || '0');
  const couponApplied = searchParams.get('couponApplied');
  const couponDiscountAmount = parseInt(searchParams.get('discountAmount') || '0');
  const type = searchParams.get('type');

  useEffect(() => {
    // Verify checkout data integrity
    const validateCheckout = () => {
      console.log('🔍 Validating checkout data...');
      console.log('URL params - clientSecret:', !!clientSecret, 'planName:', planName, 'amount:', amount);
      
      // Check if we have valid URL parameters
      if (clientSecret && planName && amount) {
        console.log('✅ Valid checkout parameters found in URL');
        setCheckoutValidated(true);
        return;
      }
      
      console.log('❌ Missing URL parameters, checking localStorage...');
      
      // Try to get data from localStorage as fallback
      const storedData = localStorage.getItem('checkoutPlan');
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          const dataAge = Date.now() - (parsedData.timestamp || 0);
          
          // Check if data is recent (less than 10 minutes old)
          if (dataAge < 10 * 60 * 1000) {
            console.log('✅ Valid stored checkout data found');
            setCheckoutValidated(true);
            return;
          } else {
            console.log('⏰ Stored checkout data expired');
            localStorage.removeItem('checkoutPlan');
          }
        } catch (error) {
          console.log('❌ Invalid stored checkout data');
          localStorage.removeItem('checkoutPlan');
        }
      }
      
      console.log('🔄 Redirecting to subscription plans');
      setLocation('/subscription-plans');
    };

    validateCheckout();
  }, [clientSecret, planName, amount, setLocation]);

  // Show loading while validating
  if (!checkoutValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validando dados de checkout...</p>
        </div>
      </div>
    );
  }

  // Use URL params or fallback to stored data
  let finalClientSecret = clientSecret;
  let finalPlanName = planName;
  let finalPaymentMethod = paymentMethod;
  let finalAmount = amount;
  let finalType = type;

  // If URL params are missing, try to use stored data
  if (!clientSecret || !planName || !amount) {
    const storedData = localStorage.getItem('checkoutPlan');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        finalClientSecret = parsedData.clientSecret;
        finalPlanName = parsedData.planName;
        finalPaymentMethod = parsedData.paymentMethod || 'monthly';
        finalAmount = parsedData.amount;
        finalType = parsedData.type;
        console.log('📋 Using stored checkout data');
      } catch (error) {
        console.log('❌ Failed to parse stored data');
        return null;
      }
    } else {
      return null;
    }
  }

  if (!finalClientSecret || !finalPlanName) {
    return null;
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0570de',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret: finalClientSecret,
    appearance,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-12">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/subscription-plans')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Planos
          </Button>
        </div>

        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            clientSecret={finalClientSecret}
            planName={finalPlanName}
            paymentMethod={finalPaymentMethod}
            amount={finalAmount}
            couponApplied={couponApplied}
            couponDiscountAmount={couponDiscountAmount}
            type={finalType || type || 'setup_intent'}
          />
        </Elements>
      </div>
    </div>
  );
}