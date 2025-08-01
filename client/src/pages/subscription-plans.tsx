import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Sparkles, Check, X, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  maxVehicleListings: number;
  highlightType: string | null;
  highlightCount: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

interface UserSubscription {
  plan: {
    name: string;
    displayName: string;
    maxVehicleListings: number;
    highlightType: string | null;
    highlightCount: number;
  };
  status: string;
  paymentMethod: string;
}

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(3); // Default 3 vehicles (minimum)
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { user: storeUser } = useAuthStore();

  // Processar assinatura pendente quando user fizer login
  const processPendingSubscription = () => {
    const pendingSubscription = localStorage.getItem('pendingSubscription');
    if (pendingSubscription && isAuthenticated && !authLoading) {
      try {
        const { planName, vehicleCount: savedVehicleCount } = JSON.parse(pendingSubscription);
        localStorage.removeItem('pendingSubscription');
        
        // Configurar os valores salvos
        setVehicleCount(savedVehicleCount);
        
        toast({
          title: "Continuando assinatura...",
          description: `Processando sua assinatura do plano ${planName}`,
        });
        
        // Executar a assinatura automaticamente após garantir que a autenticação está completa
        setTimeout(() => {
          if (isAuthenticated && !authLoading) {
            setSelectedPlan(planName);
            createSubscriptionMutation.mutate({
              planName,
              paymentMethod: isAnnual ? 'annual' : 'monthly',
              vehicleCount: savedVehicleCount,
            });
          }
        }, 2000); // Aumentado para 2 segundos para garantir que o estado de auth estabilize
        
      } catch (error) {
        localStorage.removeItem('pendingSubscription');
      }
    }
  };

  // Processar assinatura pendente após login
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      processPendingSubscription();
    }
  }, [isAuthenticated, authLoading]);

  // Carregar planos de assinatura (endpoint público)
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
    enabled: true,
    queryFn: async () => {
      const response = await fetch('/api/subscription-plans', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Erro ao carregar planos: ${response.status}`);
      }
      return response.json();
    },
  });

  // Não carregar dados de assinatura do usuário para evitar loops
  const userSubscription = null;
  const subscriptionLoading = false;

  // Create subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planName, paymentMethod, vehicleCount }: { planName: string; paymentMethod: string; vehicleCount: number }) => {
      console.log('📡 Sending subscription request:', { planName, paymentMethod, vehicleCount, isAuthenticated, user: !!user });
      
      try {
        const response = await apiRequest("POST", "/api/create-subscription", {
          planName,
          paymentMethod,
          vehicleCount,
        });
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📡 Response data:', data);
        return data;
      } catch (error) {
        console.log('❌ Subscription creation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Subscription creation successful:', data);
      
      if (!data.clientSecret) {
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
        return;
      }
      
      // Show success message
      toast({
        title: "Assinatura Criada!",
        description: "Redirecionando para pagamento...",
      });
      
      // Build checkout URL with all required parameters
      const searchParams = new URLSearchParams({
        clientSecret: data.clientSecret,
        planName: data.planName,
        paymentMethod: data.paymentMethod,
        amount: data.amount.toString()
      });
      
      const checkoutUrl = `/subscription-checkout?${searchParams.toString()}`;
      console.log('🔗 Redirecting to:', checkoutUrl);
      
      // Use timeout to ensure toast is shown
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 500);
    },
    onError: (error: Error) => {
      console.log('❌ Subscription error:', error.message);
      
      if (error.message?.includes('401') || error.message?.includes('Não autorizado')) {
        toast({
          title: "Sessão Expirada",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
        
        // Salvar intenção de assinatura
        localStorage.setItem('pendingSubscription', JSON.stringify({
          planName: selectedPlan,
          vehicleCount
        }));
        
        // Redirect immediately to login
        window.location.href = '/auth';
      } else {
        toast({
          title: "Erro ao Criar Assinatura",
          description: error.message || "Tente novamente em alguns instantes",
          variant: "destructive",
        });
      }
    },
  });

  const handleSubscribe = (planName: string) => {
    console.log('🚀 handleSubscribe called:', { planName, isAuthenticated, authLoading, isPending: createSubscriptionMutation.isPending });
    console.log('🔍 User data:', { user, storeUser });
    
    if (createSubscriptionMutation.isPending) return;

    // Verificar se está autenticado
    if (!isAuthenticated || !user) {
      console.log('❌ User not authenticated, redirecting to login');
      toast({
        title: "Login Necessário",
        description: "Você precisa estar logado para assinar um plano.",
        variant: "destructive",
      });

      // Salvar intenção de assinatura
      localStorage.setItem('pendingSubscription', JSON.stringify({
        planName,
        vehicleCount
      }));
      
      // Redirecionar imediatamente para login
      window.location.href = '/auth';
      return;
    }

    // Proceder com assinatura
    console.log('✅ User authenticated, proceeding with subscription');
    setSelectedPlan(planName);
    createSubscriptionMutation.mutate({
      planName,
      paymentMethod: isAnnual ? 'annual' : 'monthly',
      vehicleCount,
    });
  };

  if (authLoading || plansLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-96 mx-auto"></div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-96 bg-gray-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate dynamic pricing based on vehicle count
  const calculatePrice = (basePlan: string, vehicleCount: number, isAnnual: boolean) => {
    const basePrice = basePlan === 'essencial' ? 29.90 : 59.90;
    const pricePerVehicle = basePlan === 'essencial' ? 5.99 : 9.99; // Per vehicle per month

    const monthlyPrice = basePrice + (pricePerVehicle * Math.max(0, vehicleCount - 2)); // First 2 vehicles included in base price
    const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount for annual

    return isAnnual ? annualPrice : monthlyPrice;
  };

  // Default plans if none exist in database
  const defaultPlans: SubscriptionPlan[] = [
    {
      id: 1,
      name: "free",
      displayName: "Plano Gratuito",
      description: "Ideal para começar",
      monthlyPrice: "0.00",
      annualPrice: "0.00",
      maxVehicleListings: 2,
      highlightType: null,
      highlightCount: 0,
      features: ["2 anúncios de veículos", "Listagem básica", "Suporte por email"],
      isActive: true,
      sortOrder: 0,
    },
    {
      id: 2,
      name: "essencial",
      displayName: "Plano Essencial",
      description: "Para proprietários ativos",
      monthlyPrice: calculatePrice('essencial', vehicleCount, false).toString(),
      annualPrice: calculatePrice('essencial', vehicleCount, true).toString(),
      maxVehicleListings: vehicleCount,
      highlightType: "prata",
      highlightCount: 3,
      features: [
        `${vehicleCount} anúncios de veículos`,
        "Destaque prata (3x mais visualizações)",
        "Suporte prioritário",
        "Estatísticas básicas",
      ],
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 3,
      name: "plus",
      displayName: "Plano Plus",
      description: "Para máxima visibilidade",
      monthlyPrice: calculatePrice('plus', vehicleCount, false).toString(),
      annualPrice: calculatePrice('plus', vehicleCount, true).toString(),
      maxVehicleListings: vehicleCount,
      highlightType: "diamante",
      highlightCount: 10,
      features: [
        `${vehicleCount} anúncios de veículos`,
        "Destaque diamante (10x mais visualizações)",
        "Suporte VIP 24/7",
        "Analytics avançados",
        "Badge de proprietário premium",
      ],
      isActive: true,
      sortOrder: 2,
    },
  ];

  // Update plans with dynamic pricing based on vehicle count
  const updatePlansWithDynamicPricing = (basePlans: SubscriptionPlan[]) => {
    return basePlans.map(plan => {
      if (plan.name === 'essencial' || plan.name === 'plus') {
        const monthlyPrice = calculatePrice(plan.name, vehicleCount, false);
        const annualPrice = calculatePrice(plan.name, vehicleCount, true);

        return {
          ...plan,
          monthlyPrice: monthlyPrice.toFixed(2),
          annualPrice: annualPrice.toFixed(2),
          maxVehicleListings: vehicleCount,
          features: plan.features.map(feature => 
            feature.includes('anúncios') ? `${vehicleCount} anúncios de veículos` : feature
          )
        };
      }
      return plan;
    });
  };

  const displayPlans = updatePlansWithDynamicPricing(plans.length > 0 ? plans : defaultPlans);
  const currentPlan = 'free'; // Default to free to prevent auth issues

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

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'essencial':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950';
      case 'plus':
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950';
      default:
        return 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900';
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    const price = isAnnual ? parseFloat(plan.annualPrice) : parseFloat(plan.monthlyPrice);
    return price;
  };

  const getDisplayPrice = (plan: SubscriptionPlan) => {
    const price = getPrice(plan);
    if (plan.name === 'free') return 'Gratuito';

    if (isAnnual) {
      const monthlyEquivalent = price / 12;
      return `R$ ${monthlyEquivalent.toFixed(2)}/mês`;
    }

    return `R$ ${price.toFixed(2)}/mês`;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.name === 'free') return null;

    const monthlyPrice = parseFloat(plan.monthlyPrice);
    const annualPrice = parseFloat(plan.annualPrice);
    const annualMonthlyPrice = monthlyPrice * 12;
    const savings = annualMonthlyPrice - annualPrice;

    return savings > 0 ? savings : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planos de Assinatura
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Escolha o plano ideal para maximizar seus aluguéis
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Label htmlFor="annual-toggle" className="text-sm font-medium">
              Mensal
            </Label>
            <Switch
              id="annual-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label htmlFor="annual-toggle" className="text-sm font-medium">
              Anual
              <Badge variant="secondary" className="ml-2">
                Economize 20%
              </Badge>
            </Label>
          </div>

          {/* Vehicle Count Selector */}
          <div className="flex flex-col items-center justify-center space-y-3 mb-8">
            <Label htmlFor="vehicle-count" className="text-sm font-medium">
              Quantidade de anúncios:
            </Label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVehicleCount(Math.max(3, vehicleCount - 1))}
                disabled={vehicleCount <= 3}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center min-w-[120px] px-4 py-2 border rounded-md bg-white dark:bg-gray-800">
                <span className="text-lg font-semibold">{vehicleCount}</span>
                <span className="text-sm text-gray-500 ml-1">anúncios</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVehicleCount(Math.min(50, vehicleCount + 1))}
                disabled={vehicleCount >= 50}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              O preço é calculado conforme a quantidade selecionada<br/>
              Mínimo: 3 anúncios | Máximo: 50 anúncios
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {displayPlans
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((plan) => {
              const isCurrentPlan = currentPlan === plan.name;
              const savings = getSavings(plan);

              return (
                <Card
                  key={plan.id}
                  className={`relative ${getPlanColor(plan.name)} ${
                    plan.name === 'essencial' ? 'ring-2 ring-amber-500 scale-105' : ''
                  } transition-all duration-300 hover:shadow-lg`}
                >
                  {plan.name === 'essencial' && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500">
                      Mais Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-6">
                    <div className="flex justify-center mb-4">
                      {getPlanIcon(plan.name)}
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {plan.displayName}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="text-center pb-6">
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {getDisplayPrice(plan)}
                      </div>
                      {isAnnual && savings && savings > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Economize R$ {savings.toFixed(2)}/ano
                        </div>
                      )}
                      {plan.name !== 'free' && !isAnnual && (
                        <div className="text-sm text-gray-500">
                          ou R$ {(parseFloat(plan.annualPrice) / 12).toFixed(2)}/mês anual
                        </div>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.name !== 'free' && (
                      <div className="text-sm text-purple-600 font-medium mb-4">
                        {vehicleCount} anúncios selecionados
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    {isCurrentPlan ? (
                      <Button className="w-full" disabled>
                        Plano Atual
                      </Button>
                    ) : plan.name === 'free' ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plano Gratuito
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleSubscribe(plan.name)}
                        disabled={
                          createSubscriptionMutation.isPending && selectedPlan === plan.name
                        }
                      >
                        {createSubscriptionMutation.isPending && selectedPlan === plan.name
                          ? "Processando..."
                          : "Assinar Agora"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Perguntas Frequentes
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Posso cancelar minha assinatura a qualquer momento?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sim, você pode cancelar sua assinatura a qualquer momento. O acesso
                permanece ativo até o final do período pago.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Como funcionam os destaques?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Os destaques colocam seus veículos no topo das pesquisas, aumentando
                significativamente a visibilidade e chances de aluguel.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Posso mudar de plano?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer
                momento. As mudanças entram em vigor imediatamente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Há desconto para pagamento anual?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sim, oferecemos 20% de desconto para assinaturas anuais, além da
                comodidade de um pagamento único por ano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}