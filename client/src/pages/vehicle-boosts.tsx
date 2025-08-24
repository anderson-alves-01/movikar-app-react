import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Star, Clock, Calendar, ArrowLeft, Zap, Home, Tag, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface VehicleBoost {
  id: number;
  vehicleId: number;
  ownerId: number;
  boostType: string;
  boostTitle: string;
  boostDescription: string;
  price: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  paymentIntentId: string;
  createdAt: string;
}

interface BoostType {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ComponentType<any>;
  benefits: string[];
}

const BOOST_TYPES: BoostType[] = [
  {
    id: 'homepage_highlight',
    name: 'Destaque na Home',
    description: 'Apareça em destaque na página inicial',
    price: 15.00,
    icon: Home,
    benefits: [
      'Posição privilegiada na home',
      'Maior visibilidade',
      'Até 3x mais visualizações'
    ]
  },
  {
    id: 'category_highlight',
    name: 'Destaque na Categoria',
    description: 'Fique no topo da sua categoria',
    price: 10.00,
    icon: Tag,
    benefits: [
      'Primeiro nos resultados de busca',
      'Badge especial "Em Destaque"',
      'Até 2x mais visualizações'
    ]
  },
  {
    id: 'event_highlight',
    name: 'Destaque para Eventos',
    description: 'Destaque especial para feriados e eventos',
    price: 25.00,
    icon: PartyPopper,
    benefits: [
      'Destaque em datas especiais',
      'Marketing sazonal automático',
      'Até 5x mais visualizações'
    ]
  }
];

const PaymentForm = ({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/vehicles/boosts`,
      },
      redirect: 'if_required'
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Boost ativado!",
        description: "Seu veículo agora está em destaque.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Processando..." : "Confirmar Pagamento"}
      </Button>
    </form>
  );
};

export default function VehicleBoosts() {
  const { vehicleId } = useParams();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedBoostType, setSelectedBoostType] = useState<string>('');
  const [duration, setDuration] = useState<number>(7);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);

  if (!vehicleId) {
    return <div>ID do veículo não encontrado</div>;
  }

  const vehicleIdNum = parseInt(vehicleId);

  const { data: boosts, isLoading } = useQuery<VehicleBoost[]>({
    queryKey: ['/api/vehicles', vehicleIdNum, 'boosts'],
    queryFn: () => fetch(`/api/vehicles/${vehicleIdNum}/boosts`, { credentials: 'include' }).then(r => r.json())
  });

  const createBoostMutation = useMutation({
    mutationFn: async (data: { boostType: string; duration: number }) => {
      const response = await fetch(`/api/vehicles/${vehicleIdNum}/boost`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentClientSecret(data.clientSecret);
      toast({
        title: "Payment intent criado",
        description: "Complete o pagamento para ativar o boost.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar boost",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateBoost = (boostType: string) => {
    setSelectedBoostType(boostType);
    createBoostMutation.mutate({ boostType, duration });
  };

  const handlePaymentSuccess = () => {
    setPaymentClientSecret(null);
    setSelectedBoostType('');
    queryClient.invalidateQueries({ queryKey: ['/api/vehicles', vehicleIdNum, 'boosts'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'expired': return 'Expirado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getRemainingDays = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/vehicles')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
                Boosts do Veículo
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Destaque seu veículo para mais visibilidade
              </p>
            </div>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger value="create" data-testid="tab-create" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1.5">
                <span className="block sm:hidden">Criar</span>
                <span className="hidden sm:block">Criar Boost</span>
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active" className="text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1.5">
                <span className="block sm:hidden">Ativos</span>
                <span className="hidden sm:block">Boosts Ativos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Escolha seu Tipo de Boost
                  </CardTitle>
                  <CardDescription>
                    Selecione o tipo de destaque que mais se adequa às suas necessidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duração (dias)</Label>
                      <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                        <SelectTrigger data-testid="select-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 dias</SelectItem>
                          <SelectItem value="7">7 dias (Padrão)</SelectItem>
                          <SelectItem value="14">14 dias</SelectItem>
                          <SelectItem value="30">30 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {BOOST_TYPES.map((boostType) => {
                        const totalPrice = boostType.price * (duration / 7); // Preço base é para 7 dias
                        const Icon = boostType.icon;
                        
                        return (
                          <Card key={boostType.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardHeader className="pb-4">
                              <div className="flex items-center gap-2">
                                <Icon className="h-6 w-6 text-primary" />
                                <CardTitle className="text-lg">{boostType.name}</CardTitle>
                              </div>
                              <CardDescription>{boostType.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="text-2xl font-bold text-primary">
                                  R$ {totalPrice.toFixed(2)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  por {duration} dia{duration !== 1 ? 's' : ''}
                                </div>
                                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                  {boostType.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <div className="w-1 h-1 bg-primary rounded-full" />
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                                <Button
                                  className="w-full"
                                  onClick={() => handleCreateBoost(boostType.id)}
                                  disabled={createBoostMutation.isPending}
                                  data-testid={`button-boost-${boostType.id}`}
                                >
                                  {createBoostMutation.isPending && selectedBoostType === boostType.id
                                    ? "Processando..."
                                    : `Ativar por R$ ${totalPrice.toFixed(2)}`}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="active" className="space-y-6">
              {!boosts || boosts.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Nenhum boost ativo
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Crie seu primeiro boost para destacar seu veículo e aumentar as visualizações.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {boosts.map((boost) => {
                    const remainingDays = getRemainingDays(boost.endDate);
                    const isActive = boost.status === 'active' && remainingDays > 0;
                    
                    return (
                      <Card key={boost.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Star className="h-5 w-5" />
                                {boost.boostTitle}
                              </CardTitle>
                              <CardDescription>{boost.boostDescription}</CardDescription>
                            </div>
                            <Badge 
                              className={getStatusColor(boost.status)}
                              data-testid={`badge-status-${boost.id}`}
                            >
                              {getStatusText(boost.status)}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500">Preço Pago</p>
                              <p className="text-lg font-semibold" data-testid={`text-price-${boost.id}`}>
                                R$ {Number(boost.price).toFixed(2)}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-500">Período</p>
                              <div className="flex items-center gap-1 text-sm" data-testid={`text-period-${boost.id}`}>
                                <Calendar className="h-4 w-4" />
                                {format(new Date(boost.startDate), 'dd/MM')} - {format(new Date(boost.endDate), 'dd/MM/yyyy')}
                              </div>
                            </div>

                            {isActive && (
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Tempo Restante</p>
                                <div className="flex items-center gap-1 text-sm" data-testid={`text-remaining-${boost.id}`}>
                                  <Clock className="h-4 w-4" />
                                  {remainingDays > 0 ? `${remainingDays} dia${remainingDays !== 1 ? 's' : ''}` : 'Expirando hoje'}
                                </div>
                              </div>
                            )}
                          </div>

                          {isActive && (
                            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm font-medium">Boost ativo</span>
                              </div>
                              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                                Seu veículo está recebendo destaque especial
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Payment Modal */}
          {paymentClientSecret && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Finalizar Compra do Boost
                </h3>
                <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                  <PaymentForm 
                    clientSecret={paymentClientSecret} 
                    onSuccess={handlePaymentSuccess} 
                  />
                </Elements>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentClientSecret(null);
                    setSelectedBoostType('');
                  }}
                  className="w-full mt-2"
                  data-testid="button-cancel-payment"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}