import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Sparkles, ArrowLeft, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CheckoutFormProps {
  clientSecret: string;
  planName: string;
  paymentMethod: string;
  amount: number;
}

const CheckoutForm = ({ clientSecret, planName, paymentMethod, amount }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/subscription-success",
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Erro no Pagamento",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Confirm subscription on backend
      try {
        const response = await apiRequest("POST", "/api/subscription/confirm", {
          paymentIntentId: paymentIntent.id,
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
          {paymentMethod === 'annual' && (
            <Badge variant="secondary" className="mb-4">
              Economize 20% com o plano anual
            </Badge>
          )}
        </CardContent>
      </Card>

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
                  `Pagar ${formatAmount(amount)}`
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

  useEffect(() => {
    // Verify checkout data integrity
    const validateCheckout = () => {
      console.log('🔍 Validating checkout data...');
      
      // Check if we have valid URL parameters
      if (!clientSecret || !planName || !amount) {
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
        return;
      }
      
      console.log('✅ Valid checkout parameters found');
      setCheckoutValidated(true);
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

  if (!clientSecret || !planName) {
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
    clientSecret,
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
            clientSecret={clientSecret}
            planName={planName}
            paymentMethod={paymentMethod}
            amount={amount}
          />
        </Elements>
      </div>
    </div>
  );
}