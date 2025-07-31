import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth-new";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Sparkles, Check, X, Plus, Minus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient-new";

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

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(3);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  // Mutation para criar assinatura
  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planName, paymentMethod, vehicleCount }: { 
      planName: string; 
      paymentMethod: string; 
      vehicleCount: number 
    }) => {
      const response = await apiRequest("POST", "/api/create-subscription", {
        planName,
        paymentMethod,
        vehicleCount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirecionar para checkout
      window.location.href = `/subscription-checkout?clientSecret=${data.clientSecret}&planName=${data.planName}&paymentMethod=${data.paymentMethod}`;
    },
    onError: (error: Error) => {
      if (error.message?.includes('401')) {
        toast({
          title: "Login Necessário",
          description: "Você precisa estar logado para assinar um plano.",
          variant: "destructive",
        });
        
        // Salvar intenção de assinatura
        localStorage.setItem('pendingSubscription', JSON.stringify({
          planName: selectedPlan,
          vehicleCount
        }));
        
        setTimeout(() => {
          window.location.href = '/auth';
        }, 1500);
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar assinatura",
          variant: "destructive",
        });
      }
    },
  });

  // Processar assinatura pendente após login
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const pendingSubscription = localStorage.getItem('pendingSubscription');
      if (pendingSubscription) {
        try {
          const { planName, vehicleCount: savedVehicleCount } = JSON.parse(pendingSubscription);
          localStorage.removeItem('pendingSubscription');
          
          setVehicleCount(savedVehicleCount);
          setSelectedPlan(planName);
          
          toast({
            title: "Continuando assinatura...",
            description: `Processando sua assinatura do plano ${planName}`,
          });
          
          // Executar assinatura automaticamente
          setTimeout(() => {
            createSubscriptionMutation.mutate({
              planName,
              paymentMethod: isAnnual ? 'annual' : 'monthly',
              vehicleCount: savedVehicleCount,
            });
          }, 1000);
          
        } catch (error) {
          localStorage.removeItem('pendingSubscription');
        }
      }
    }
  }, [isAuthenticated, authLoading]);

  const handleSubscribe = (planName: string) => {
    if (createSubscriptionMutation.isPending) return;

    // Verificar se está autenticado
    if (!isAuthenticated) {
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
      
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1500);
      return;
    }

    // Proceder com assinatura
    setSelectedPlan(planName);
    createSubscriptionMutation.mutate({
      planName,
      paymentMethod: isAnnual ? 'annual' : 'monthly',
      vehicleCount,
    });
  };

  // Loading state
  if (authLoading || plansLoading) {
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

  // Calcular preço dinâmico
  const calculatePrice = (basePlan: string, vehicleCount: number, isAnnual: boolean) => {
    const basePrice = basePlan === 'essencial' ? 29.90 : 59.90;
    const pricePerVehicle = basePlan === 'essencial' ? 5.99 : 9.99;

    const monthlyPrice = basePrice + (pricePerVehicle * Math.max(0, vehicleCount - 2));
    const annualPrice = monthlyPrice * 12 * 0.8; // 20% desconto anual

    return isAnnual ? annualPrice : monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Escolha Seu Plano
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Selecione o plano ideal para maximizar seus anúncios de veículos
          </p>

          {/* Switch Annual/Monthly */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label className={`text-lg ${!isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Mensal
            </Label>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label className={`text-lg ${isAnnual ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
              Anual
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                20% OFF
              </Badge>
            </Label>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => {
            const isEssential = plan.name === 'essencial';
            const isPlus = plan.name === 'plus';
            const isFree = plan.name === 'free';
            const isPopular = isEssential;

            const dynamicPrice = (isEssential || isPlus) 
              ? calculatePrice(plan.name, vehicleCount, isAnnual)
              : parseFloat(isAnnual ? plan.annualPrice : plan.monthlyPrice);

            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${
                  selectedPlan === plan.name && createSubscriptionMutation.isPending
                    ? 'opacity-75 pointer-events-none' 
                    : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3">
                    {isFree && <Check className="w-8 h-8 text-green-500" />}
                    {isEssential && <Crown className="w-8 h-8 text-yellow-500" />}
                    {isPlus && <Sparkles className="w-8 h-8 text-purple-500" />}
                  </div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plan.displayName}
                  </CardTitle>
                  
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center pb-6">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      R$ {dynamicPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      /{isAnnual ? 'ano' : 'mês'}
                    </span>
                  </div>

                  {/* Vehicle Count Selector for paid plans */}
                  {(isEssential || isPlus) && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                        Quantidade de anúncios
                      </Label>
                      <div className="flex items-center justify-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVehicleCount(Math.max(3, vehicleCount - 1))}
                          disabled={vehicleCount <= 3}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <span className="text-xl font-bold text-blue-600 min-w-[3rem] text-center">
                          {vehicleCount}
                        </span>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVehicleCount(Math.min(50, vehicleCount + 1))}
                          disabled={vehicleCount >= 50}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Mínimo 3, máximo 50 anúncios
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      isPopular 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-800 hover:bg-gray-900'
                    } text-white transition-colors`}
                    onClick={() => handleSubscribe(plan.name)}
                    disabled={createSubscriptionMutation.isPending}
                  >
                    {createSubscriptionMutation.isPending && selectedPlan === plan.name ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </div>
                    ) : isFree ? (
                      'Começar Grátis'
                    ) : (
                      'Assinar Agora'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            Todos os planos incluem suporte por email e atualizações gratuitas.
          </p>
          <p>
            Você pode alterar ou cancelar sua assinatura a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}