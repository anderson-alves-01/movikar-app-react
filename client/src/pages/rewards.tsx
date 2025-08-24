import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Gift, Users, Copy, Coins, TrendingUp, Calendar, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/lib/auth';
import Header from '@/components/header';

interface UserRewards {
  id: number;
  userId: number;
  totalPoints: number;
  availablePoints: number;
  usedPoints: number;
  referralCount: number;
  successfulReferrals: number;
  createdAt: string;
  updatedAt: string;
}

interface RewardTransaction {
  id: number;
  userId: number;
  type: 'earned' | 'used';
  points: number;
  source: string;
  sourceId: number | null;
  description: string;
  bookingId: number | null;
  discountAmount: string | null;
  createdAt: string;
}

interface Referral {
  id: number;
  referrerId: number;
  referredId: number;
  referralCode: string;
  status: string;
  rewardPoints: number;
  rewardStatus: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Rewards() {
  const [referralCode, setReferralCode] = useState('');
  const [useReferralCode, setUseReferralCode] = useState('');
  const [pointsToUse, setPointsToUse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Acesso negado",
        description: "Faça login para acessar o sistema de recompensas",
        variant: "destructive",
      });
      setLocation('/auth');
      return;
    }
  }, [user, setLocation, toast]);
  
  // Generate a referral code when component mounts
  useEffect(() => {
    const generateReferralCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    
    if (!referralCode) {
      setReferralCode(generateReferralCode());
    }
  }, [referralCode]);

  // Fetch user coins - only if user is authenticated
  const { data: userCoins, isLoading: rewardsLoading } = useQuery<any>({
    queryKey: ['/api/coins'],
    enabled: !!user,
  });

  // Fetch coin transactions - only if user is authenticated
  const { data: transactions, isLoading: transactionsLoading } = useQuery<any[]>({
    queryKey: ['/api/coins/transactions'],
    enabled: !!user,
  });

  // Fetch user referrals - only if user is authenticated
  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals/my-referrals'],
    enabled: !!user,
  });

  // Get user's referral code and link - only if user is authenticated
  const { data: myReferralData } = useQuery<{ referralCode: string; referralLink: string }>({
    queryKey: ['/api/referrals/my-code'],
    enabled: !!user,
  });

  // Use referral code mutation
  const useCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/referrals/use-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ referralCode: code }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao usar código de convite');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Código de convite aplicado com sucesso! Vocês ganharam moedas.",
      });
      setUseReferralCode('');
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process pending referrals mutation
  const processPendingMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/referrals/process-pending', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao processar convites pendentes');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rewards/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/my-referrals'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use coins mutation
  const useCoinsMutation = useMutation({
    mutationFn: async (coins: number) => {
      const response = await fetch('/api/coins/deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          amount: coins, 
          description: `Desconto de ${coins} moedas aplicado`,
          vehicleId: null,
          ownerId: null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao usar moedas');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Moedas utilizadas!",
        description: `Desconto de R$ ${(parseInt(pointsToUse) * 0.01).toFixed(2)} aplicado!`,
      });
      setPointsToUse('');
      queryClient.invalidateQueries({ queryKey: ['/api/coins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coins/transactions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });



  const copyReferralLink = () => {
    const linkToCopy = myReferralData?.referralLink;
    if (linkToCopy) {
      navigator.clipboard.writeText(linkToCopy);
      toast({
        title: "Link copiado!",
        description: "Link de convite copiado para a área de transferência.",
      });
    }
  };

  const handleUseReferralCode = () => {
    if (useReferralCode.trim()) {
      useCodeMutation.mutate(useReferralCode.trim().toUpperCase());
    }
  };

  const handleUseCoins = () => {
    const coins = parseInt(pointsToUse);
    if (coins > 0) {
      useCoinsMutation.mutate(coins);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Show loading state if user not authenticated yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Carregando...</h1>
            <p className="text-gray-600">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    );
  }

  if (rewardsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Recompensas</h1>
          <p className="text-gray-600">Ganhe moedas convidando amigos e use para desconto em reservas</p>
        </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moedas Disponíveis</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userCoins?.availableCoins || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              = R$ {((userCoins?.availableCoins || 0) * 0.01).toFixed(2)} em desconto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userCoins?.totalCoins || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Moedas acumuladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amigos Convidados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referrals?.filter(r => r.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Convites aceitos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invite" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="invite" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-1.5">
            <span className="block sm:hidden">Convidar</span>
            <span className="hidden sm:block">Convidar Amigos</span>
          </TabsTrigger>
          <TabsTrigger value="use-code" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-1.5">
            <span className="block sm:hidden">Código</span>
            <span className="hidden sm:block">Usar Código</span>
          </TabsTrigger>
          <TabsTrigger value="use-points" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-1.5">
            <span className="block sm:hidden">Moedas</span>
            <span className="hidden sm:block">Usar Moedas</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-1.5">
            <span className="block sm:hidden">Histórico</span>
            <span className="hidden sm:block">Histórico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Convide Amigos e Ganhe Moedas
              </CardTitle>
              <CardDescription>
                Compartilhe seu link de convite e ganhe 100 moedas para cada amigo que se cadastrar!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex-1">
                <label className="text-sm font-medium">Seu link de convite:</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input 
                    value={myReferralData?.referralLink || 'Gerando link...'}
                    readOnly
                    className="text-sm"
                  />
                  <Button onClick={copyReferralLink} variant="outline" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Compartilhe este link para que seus amigos se cadastrem automaticamente
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Compartilhe seu link com amigos</li>
                  <li>• Eles são direcionados automaticamente para o cadastro</li>
                  <li>• Seu amigo ganha 300 moedas de bônus ao validar documentos</li>
                  <li>• Você ganha 100 moedas quando ele completar o cadastro</li>
                  <li>• Use as moedas para desconto em reservas (1 moeda = R$ 0,01)</li>
                </ul>
              </div>

              {referrals && referrals.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Seus Convites:</h4>
                  <div className="space-y-2">
                    {referrals.map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Código: {referral.referralCode}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(referral.createdAt)}
                          </p>
                        </div>
                        <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                          {referral.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="use-code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usar Código de Convite</CardTitle>
              <CardDescription>
                Tem um código de convite? Digite aqui para ganhar moedas!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  placeholder="Digite o código de convite"
                  value={useReferralCode}
                  onChange={(e) => setUseReferralCode(e.target.value.toUpperCase())}
                  className="font-mono"
                />
                <Button 
                  onClick={handleUseReferralCode}
                  disabled={!useReferralCode.trim() || useCodeMutation.isPending}
                >
                  {useCodeMutation.isPending ? 'Aplicando...' : 'Aplicar Código'}
                </Button>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  Ao usar um código de convite, você recebe acesso a todas as funcionalidades!
                </p>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Processar Convites Pendentes</h4>
                    <p className="text-sm text-gray-600">
                      Ative moedas de convites que ainda não foram processados
                    </p>
                  </div>
                  <Button 
                    onClick={() => processPendingMutation.mutate()}
                    disabled={processPendingMutation.isPending}
                    variant="outline"
                    data-testid="button-process-pending"
                  >
                    {processPendingMutation.isPending ? 'Processando...' : 'Processar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="use-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usar Moedas para Desconto</CardTitle>
              <CardDescription>
                Troque suas moedas por desconto em reservas (1 moeda = R$ 0,01)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Quantidade de moedas"
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(e.target.value)}
                  min="1"
                  max={userCoins?.availableCoins || 0}
                />
                <Button 
                  onClick={handleUseCoins}
                  disabled={!pointsToUse || parseInt(pointsToUse) <= 0 || useCoinsMutation.isPending}
                >
                  {useCoinsMutation.isPending ? 'Aplicando...' : 'Aplicar Desconto'}
                </Button>
              </div>
              
              {pointsToUse && parseInt(pointsToUse) > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Desconto de R$ {(parseInt(pointsToUse) * 0.01).toFixed(2)} será aplicado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.amount > 0 ? (
                            <TrendingUp className={`h-4 w-4 ${
                              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`} />
                          ) : (
                            <Coins className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{Math.abs(transaction.amount)} moedas
                        </p>
                        {transaction.discountAmount && (
                          <p className="text-sm text-gray-600">
                            R$ {parseFloat(transaction.discountAmount).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma transação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}