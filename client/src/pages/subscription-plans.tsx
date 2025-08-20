import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Sparkles, Check, X, Plus, Minus, ArrowLeft, Tag, Percent } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";

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

interface CouponValidation {
  isValid: boolean;
  coupon?: any;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}

export default function SubscriptionPlans() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number>(3); // Default 3 vehicles (minimum)
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { user: storeUser } = useAuthStore();
  const [, setLocation] = useLocation();

  // Function to validate coupon
  const validateCoupon = async (code: string, orderValue: number) => {
    setIsCouponLoading(true);
    try {
      const response = await apiRequest('POST', '/api/validate-coupon', {
        code: code.toUpperCase(),
        orderValue: Math.round(orderValue * 100), // Convert to cents
      });
      
      const data = await response.json();
      if (data.isValid) {
        setAppliedCoupon({
          isValid: true,
          coupon: data.coupon,
          discountAmount: data.discountAmount,
          finalAmount: data.finalAmount,
          message: data.message,
        });
        toast({
          title: "Cupom Aplicado!",
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no Cupom",
        description: error.message || "Cupom inválido ou expirado",
        variant: "destructive",
      });
      setAppliedCoupon(null);
    } finally {
      setIsCouponLoading(false);
    }
  };

  // Function to apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código Necessário",
        description: "Digite um código de cupom",
        variant: "destructive",
      });
      return;
    }

    // Use the first non-free plan for validation if none selected
    let planToUse = selectedPlan;
    if (!planToUse) {
      const availablePlans = displayPlans.filter(p => p.name !== 'free');
      if (availablePlans.length > 0) {
        planToUse = availablePlans[0].name;
      } else {
        toast({
          title: "Nenhum Plano Disponível",
          description: "Não há planos disponíveis para aplicar o cupom",
          variant: "destructive",
        });
        return;
      }
    }

    const plan = displayPlans.find(p => p.name === planToUse);
    if (plan) {
      const orderValue = getPrice(plan);
      setSelectedPlan(planToUse); // Set the plan so discount shows
      validateCoupon(couponCode, orderValue);
    }
  };

  // Function to remove coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast({
      title: "Cupom Removido",
      description: "O desconto foi removido do pedido",
    });
  };

  // Clear any previous checkout state when component loads
  useEffect(() => {
    // Only clear if not coming from a login redirect
    const urlParams = new URLSearchParams(window.location.search);
    const fromLogin = urlParams.get('from') === 'login';
    
    if (!fromLogin) {
      localStorage.removeItem('checkoutPlan');
      console.log('🧹 Cleared checkout state on subscription plans load');
    }
  }, []);

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
    mutationFn: async ({ planName, paymentMethod, vehicleCount, couponCode, discountAmount }: { 
      planName: string; 
      paymentMethod: string; 
      vehicleCount: number;
      couponCode?: string;
      discountAmount?: number;
    }) => {
      console.log('📡 Sending subscription request:', { planName, paymentMethod, vehicleCount, couponCode, discountAmount, isAuthenticated, user: !!user });
      
      try {
        const requestData: any = {
          planName,
          paymentMethod,
          vehicleCount,
        };
        
        // Include coupon data if provided
        if (couponCode && discountAmount) {
          requestData.couponCode = couponCode;
          requestData.discountAmount = discountAmount;
        }
        
        const response = await apiRequest("POST", "/api/create-subscription", requestData);
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
      console.log('🔍 Checking isFreeSubscription:', data.isFreeSubscription);
      console.log('🔍 Full response data:', JSON.stringify(data, null, 2));
      
      // Check if it's a free subscription (100% discount)
      if (data.isFreeSubscription === true) {
        console.log('🎁 Processing free subscription - showing success toast');
        toast({
          title: "🎉 Assinatura Ativada!",
          description: data.message || "Assinatura ativada com sucesso! Cupom aplicado com 100% de desconto.",
          duration: 5000,
        });
        
        // Clear any stored checkout data
        localStorage.removeItem('checkoutPlan');
        
        // Invalidate auth and subscription queries to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
        
        console.log('⏰ Setting redirect timer for 2 seconds');
        // Redirect to home page after a delay
        setTimeout(() => {
          console.log('🏠 Redirecting to home page');
          window.location.href = '/';
        }, 2000);
        return;
      }
      
      console.log('💳 Processing paid subscription - proceeding to checkout');
      
      if (!data.clientSecret) {
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
        return;
      }
      
      // Show success message for paid subscriptions
      toast({
        title: "Assinatura Criada!",
        description: "Redirecionando para pagamento...",
      });
      
      // Store checkout data in localStorage
      const checkoutData = {
        clientSecret: data.clientSecret,
        planName: data.planName,
        paymentMethod: data.paymentMethod,
        amount: data.amount,
        couponApplied: data.couponApplied || null,
        discountAmount: data.discountAmount || 0,
        timestamp: Date.now()
      };
      
      localStorage.setItem('checkoutPlan', JSON.stringify(checkoutData));
      console.log('💾 Stored checkout data:', checkoutData);
      
      // Build checkout URL
      const searchParams = new URLSearchParams({
        clientSecret: data.clientSecret,
        planName: data.planName,
        paymentMethod: data.paymentMethod,
        amount: data.amount.toString()
      });
      
      // Add coupon data to URL if present
      if (data.couponApplied) {
        searchParams.set('couponApplied', data.couponApplied);
        searchParams.set('discountAmount', (data.discountAmount || 0).toString());
      }
      
      const checkoutUrl = `/subscription-checkout?${searchParams.toString()}`;
      console.log('🔗 Redirecting to:', checkoutUrl);
      
      // Use timeout to ensure toast is shown and data is stored
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 800);
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
    
    // Include coupon data if applied
    const subscriptionData: any = {
      planName,
      paymentMethod: isAnnual ? 'annual' : 'monthly',
      vehicleCount,
    };

    if (appliedCoupon && appliedCoupon.isValid) {
      subscriptionData.couponCode = couponCode;
      subscriptionData.discountAmount = appliedCoupon.discountAmount;
    }

    console.log('🎯 Final subscription data with coupon:', subscriptionData);
    createSubscriptionMutation.mutate(subscriptionData);
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

  // Calculate dynamic pricing based on vehicle count (aligned with backend)
  const calculatePrice = (basePlan: string, vehicleCount: number, isAnnual: boolean) => {
    const basePrice = basePlan === 'essencial' ? 29.90 : 59.90;
    const pricePerVehicle = basePlan === 'essencial' ? 5.99 : 9.99;
    
    // Calculate monthly price - additional vehicles cost extra
    const monthlyPrice = basePrice + (pricePerVehicle * Math.max(0, vehicleCount - 2));
    
    // Annual price with 20% discount
    const annualDiscount = 20; // Default 20% discount
    const annualPrice = monthlyPrice * 12 * (1 - annualDiscount / 100);

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

    // Apply coupon discount if available and plan is selected
    let finalPrice = price;
    if (appliedCoupon && appliedCoupon.isValid && selectedPlan === plan.name) {
      finalPrice = appliedCoupon.finalAmount ? appliedCoupon.finalAmount / 100 : price;
    }

    if (isAnnual) {
      const monthlyEquivalent = finalPrice / 12;
      return `R$ ${monthlyEquivalent.toFixed(2)}/mês`;
    }

    return `R$ ${finalPrice.toFixed(2)}/mês`;
  };

  const getOriginalPrice = (plan: SubscriptionPlan) => {
    const price = getPrice(plan);
    if (plan.name === 'free') return null;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="p-4">
        <div className="max-w-6xl mx-auto py-12">
          {/* Back Button and Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Dashboard</span>
            </Button>
          </div>
          
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

          {/* Coupon Section */}
          <div className="max-w-md mx-auto mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border-dashed border-2 border-gray-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-lg">Cupom de Desconto</CardTitle>
                </div>
                <CardDescription>
                  Tem um cupom? Digite o código para aplicar o desconto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite o código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={isCouponLoading || !couponCode.trim()}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      {isCouponLoading ? "Validando..." : "Aplicar"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">{couponCode}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCoupon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      {appliedCoupon.message}
                    </div>
                    {appliedCoupon.discountAmount && (
                      <div className="mt-1 text-sm font-semibold text-green-800">
                        Desconto: R$ {(appliedCoupon.discountAmount / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-500 text-center">
                  O cupom será aplicado automaticamente ao plano selecionado
                </p>
              </CardContent>
            </Card>
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
                      {appliedCoupon && appliedCoupon.isValid && selectedPlan === plan.name ? (
                        <div className="space-y-2">
                          <div className="text-2xl text-gray-500 line-through">
                            {getOriginalPrice(plan)}
                          </div>
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {getDisplayPrice(plan)}
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            Desconto: R$ {((appliedCoupon.discountAmount || 0) / 100).toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                          {getDisplayPrice(plan)}
                        </div>
                      )}
                      {isAnnual && savings && savings > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          Economize R$ {savings.toFixed(2)}/ano
                        </div>
                      )}
                      {plan.name !== 'free' && !isAnnual && !appliedCoupon && (
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
    </div>
  );
}