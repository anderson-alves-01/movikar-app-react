import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Coins, CreditCard, History, UserCheck, Calendar, Phone, Mail, User, Gift, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface UserCoins {
  id: number;
  userId: number;
  totalCoins: number;
  availableCoins: number;
  usedCoins: number;
  createdAt: string;
  updatedAt: string;
}

interface CoinTransaction {
  id: number;
  userId: number;
  type: string;
  amount: number;
  description: string;
  source: string;
  sourceId?: string;
  vehicleId?: number;
  ownerId?: number;
  status: string;
  createdAt: string;
}

interface ContactUnlock {
  id: number;
  userId: number;
  vehicleId: number;
  ownerId: number;
  coinsSpent: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  expiresAt: string;
  createdAt: string;
}

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  name: string;
  description: string;
  popular?: boolean;
}

const coinPackages: CoinPackage[] = [
  {
    id: '200',
    coins: 200,
    price: 20.00,
    name: '200 Moedas',
    description: 'Pacote básico'
  },
  {
    id: '500',
    coins: 500,
    price: 45.00,
    name: '500 Moedas',
    description: 'Pacote intermediário',
    popular: true
  },
  {
    id: '1000',
    coins: 1000,
    price: 80.00,
    name: '1000 Moedas',
    description: 'Pacote avançado'
  },
  {
    id: '2000',
    coins: 2000,
    price: 150.00,
    name: '2000 Moedas',
    description: 'Pacote premium'
  }
];

const CoinPurchaseForm = ({ packageInfo, onSuccess, discountCode, finalPrice }: { 
  packageInfo: CoinPackage, 
  onSuccess: () => void,
  discountCode?: string,
  finalPrice?: number 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const response = await apiRequest("POST", "/api/coins/purchase", {
        coinPackage: packageInfo.id,
        discountCode: discountCode
      }) as unknown as { clientSecret: string };

      const { clientSecret } = response;

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Compra realizada!",
          description: `${packageInfo.coins} moedas adicionadas à sua conta.`,
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro na compra",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      <Button 
        type="submit" 
        disabled={!stripe || loading} 
        className="w-full"
        data-testid="button-confirm-purchase"
      >
        {loading ? "Processando..." : `Comprar por ${(finalPrice || packageInfo.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
      </Button>
    </form>
  );
};

export default function CoinsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{code: string, percentage: number, description: string} | null>(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  // Fetch user's coin balance
  const { data: userCoins, isLoading: coinsLoading } = useQuery<UserCoins>({
    queryKey: ["/api/coins"],
  });

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = useQuery<CoinTransaction[]>({
    queryKey: ["/api/coins/transactions"],
  });

  // Fetch contact unlocks
  const { data: unlocks, isLoading: unlocksLoading } = useQuery<ContactUnlock[]>({
    queryKey: ["/api/coins/unlocks"],
  });

  const handlePurchaseSuccess = () => {
    setSelectedPackage(null);
    queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
    queryClient.invalidateQueries({ queryKey: ["/api/coins/transactions"] });
  };

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Código necessário",
        description: "Digite um código de desconto",
        variant: "destructive",
      });
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await apiRequest("POST", "/api/coins/validate-discount", {
        code: discountCode
      }) as any;

      setAppliedDiscount({
        code: discountCode,
        percentage: Number(response.percentage),
        description: response.description
      });

      toast({
        title: "Desconto aplicado!",
        description: `${response.percentage}% de desconto - ${response.description}`,
      });
    } catch (error: any) {
      toast({
        title: "Código inválido",
        description: error.message || "Código de desconto não encontrado",
        variant: "destructive",
      });
    } finally {
      setValidatingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode('');
    toast({
      title: "Desconto removido",
      description: "O desconto foi removido dos preços",
    });
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!appliedDiscount || !appliedDiscount.percentage) {
      console.log('🧮 No discount applied, returning original price:', originalPrice);
      return originalPrice;
    }
    
    const percentage = Number(appliedDiscount.percentage);
    console.log('🧮 Raw percentage value:', percentage, 'Type:', typeof percentage);
    
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      console.log('🧮 Invalid percentage, returning original price:', originalPrice);
      return originalPrice;
    }
    
    const discountedPrice = originalPrice * (1 - percentage / 100);
    
    console.log('🧮 DETAILED Discount calculation:', {
      originalPrice,
      percentage,
      discountedPrice,
      appliedDiscount,
      calculation: `${originalPrice} * (1 - ${percentage}/100) = ${originalPrice} * ${1 - percentage/100} = ${discountedPrice}`
    });
    
    return Math.max(0, discountedPrice); // Ensure price never goes below 0
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'spend':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'bonus':
        return <Coins className="h-4 w-4 text-yellow-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'bonus':
        return 'text-green-600';
      case 'spend':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (coinsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Coins className="h-8 w-8 text-yellow-600" />
          <h1 className="text-3xl font-bold">Sistema de Moedas</h1>
        </div>

        {/* Coin Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moedas Disponíveis</CardTitle>
              <Coins className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600" data-testid="text-available-coins">
                {userCoins?.availableCoins || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                200 moedas = 1 contato desbloqueado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Moedas</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-total-coins">
                {userCoins?.totalCoins || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Moedas adquiridas até hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moedas Utilizadas</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="text-used-coins">
                {userCoins?.usedCoins || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Gastas em contatos desbloqueados
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="purchase" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="purchase" data-testid="tab-purchase">Comprar Moedas</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Histórico</TabsTrigger>
            <TabsTrigger value="unlocks" data-testid="tab-unlocks">Contatos Desbloqueados</TabsTrigger>
          </TabsList>

          {/* Purchase Tab */}
          <TabsContent value="purchase" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comprar Moedas</CardTitle>
                <CardDescription>
                  Use moedas para desbloquear informações de contato dos proprietários de veículos.
                  Cada contato custa 200 moedas e fica disponível por 30 dias.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Discount Code Section */}
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg text-green-800">Código de Desconto</CardTitle>
                    </div>
                    <CardDescription className="text-green-700">
                      Tem um código promocional? Digite aqui para aplicar desconto em sua compra.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {appliedDiscount ? (
                      <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">
                              {appliedDiscount.percentage}% de desconto aplicado
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={removeDiscount}
                            className="text-green-700 hover:text-green-900"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-green-700 mt-1">{appliedDiscount.description}</p>
                        <p className="text-xs text-green-600 mt-2">Código: {appliedDiscount.code}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite seu código de desconto"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          className="flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && validateDiscountCode()}
                        />
                        <Button 
                          onClick={validateDiscountCode}
                          disabled={validatingDiscount || !discountCode.trim()}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {validatingDiscount ? "Verificando..." : "Aplicar"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coinPackages.map((pkg) => (
                    <Card 
                      key={pkg.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPackage?.id === pkg.id ? 'ring-2 ring-primary' : ''
                      } ${pkg.popular ? 'border-primary' : ''}`}
                      onClick={() => setSelectedPackage(pkg)}
                      data-testid={`card-package-${pkg.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          {pkg.popular && (
                            <Badge variant="default" className="text-xs">Popular</Badge>
                          )}
                        </div>
                        <CardDescription>{pkg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {appliedDiscount ? (
                            <div>
                              <div className="text-lg text-gray-500 line-through">
                                {pkg.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                {calculateDiscountedPrice(pkg.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                Economia: {(pkg.price - calculateDiscountedPrice(pkg.price)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-2xl font-bold mb-2">
                              {pkg.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pkg.coins} moedas • {appliedDiscount ? 
                            (calculateDiscountedPrice(pkg.price) / pkg.coins * 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) :
                            (pkg.price / pkg.coins * 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          } por 100 moedas
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedPackage && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Finalizar Compra</CardTitle>
                      <CardDescription>
                        Você está comprando {selectedPackage.name} por {appliedDiscount ? (
                          <span>
                            <span className="line-through text-gray-500">
                              {selectedPackage.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            {' '}
                            <span className="text-green-600 font-semibold">
                              {calculateDiscountedPrice(selectedPackage.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            {' '}
                            <span className="text-green-600 text-sm">
                              ({appliedDiscount.percentage}% de desconto)
                            </span>
                          </span>
                        ) : (
                          selectedPackage.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Elements stripe={stripePromise}>
                        <CoinPurchaseForm 
                          packageInfo={selectedPackage} 
                          onSuccess={handlePurchaseSuccess}
                          discountCode={appliedDiscount?.code}
                          finalPrice={appliedDiscount ? calculateDiscountedPrice(selectedPackage.price) : selectedPackage.price}
                        />
                      </Elements>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>
                  Veja todas as suas transações de moedas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions && transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(transaction.createdAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} moedas
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Unlocks Tab */}
          <TabsContent value="unlocks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contatos Desbloqueados</CardTitle>
                <CardDescription>
                  Informações de contato que você desbloqueou usando moedas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {unlocksLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border rounded-lg">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : unlocks && unlocks.length > 0 ? (
                  <div className="space-y-4">
                    {unlocks.map((unlock) => (
                      <Card key={unlock.id} data-testid={`unlock-${unlock.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {unlock.contactInfo.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Veículo #{unlock.vehicleId} • {unlock.coinsSpent} moedas gastas
                              </p>
                            </div>
                            <Badge variant={new Date(unlock.expiresAt) > new Date() ? "default" : "secondary"}>
                              {new Date(unlock.expiresAt) > new Date() ? "Ativo" : "Expirado"}
                            </Badge>
                          </div>
                          
                          <Separator className="my-3" />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{unlock.contactInfo.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{unlock.contactInfo.email}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Expira em {formatDistanceToNow(new Date(unlock.expiresAt), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum contato desbloqueado ainda</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Desbloqueie contatos de proprietários para entrar em contato diretamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}