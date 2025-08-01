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

  // Fetch user rewards
  const { data: rewards, isLoading: rewardsLoading } = useQuery<UserRewards>({
    queryKey: ['/api/rewards/balance'],
  });

  // Fetch reward transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery<RewardTransaction[]>({
    queryKey: ['/api/rewards/transactions'],
  });

  // Fetch user referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ['/api/referrals/my-referrals'],
  });

  // Get user's referral code
  const { data: myReferralData } = useQuery<{ referralCode: string }>({
    queryKey: ['/api/referrals/my-code'],
  });

  // Use referral code mutation
  const useCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await fetch('/api/referrals/use-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
        description: "Código de convite aplicado com sucesso! Vocês ganharam pontos.",
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

  // Use points mutation
  const usePointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const response = await fetch('/api/rewards/use-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          points, 
          description: `Desconto de ${points} pontos aplicado` 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao usar pontos');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pontos utilizados!",
        description: `Desconto de R$ ${data.discountAmount.toFixed(2)} aplicado!`,
      });
      setPointsToUse('');
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

  const copyReferralCode = () => {
    const codeToUse = myReferralData?.referralCode || referralCode;
    if (codeToUse) {
      navigator.clipboard.writeText(codeToUse);
      toast({
        title: "Copiado!",
        description: "Código de convite copiado para a área de transferência",
      });
    }
  };

  const handleUseReferralCode = () => {
    if (useReferralCode.trim()) {
      useCodeMutation.mutate(useReferralCode.trim().toUpperCase());
    }
  };

  const handleUsePoints = () => {
    const points = parseInt(pointsToUse);
    if (points > 0) {
      usePointsMutation.mutate(points);
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

  if (rewardsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sistema de Recompensas</h1>
          <p className="text-gray-600">Ganhe pontos convidando amigos e use para desconto em reservas</p>
        </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos Disponíveis</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rewards?.availablePoints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              = R$ {((rewards?.availablePoints || 0) * 0.01).toFixed(2)} em desconto
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
              {rewards?.totalPoints || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pontos acumulados
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
              {rewards?.successfulReferrals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Convites aceitos
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invite" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invite">Convidar Amigos</TabsTrigger>
          <TabsTrigger value="use-code">Usar Código</TabsTrigger>
          <TabsTrigger value="use-points">Usar Pontos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Convide Amigos e Ganhe Pontos
              </CardTitle>
              <CardDescription>
                Compartilhe seu código e ganhe 100 pontos para cada amigo que se cadastrar!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Seu código de convite:</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={myReferralData?.referralCode || referralCode || 'Gerando código...'}
                      readOnly
                      className="font-mono text-lg"
                    />
                    <Button onClick={copyReferralCode} variant="outline" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Como funciona:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Compartilhe seu código com amigos</li>
                  <li>• Seu amigo ganha 50 pontos ao se cadastrar</li>
                  <li>• Você ganha 100 pontos quando ele usar o código</li>
                  <li>• Use os pontos para desconto em reservas (1 ponto = R$ 0,01)</li>
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
                Tem um código de convite? Digite aqui para ganhar pontos!
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
                  Ao usar um código de convite, você ganha 50 pontos de bônus de boas-vindas!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="use-points" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usar Pontos para Desconto</CardTitle>
              <CardDescription>
                Troque seus pontos por desconto em reservas (1 ponto = R$ 0,01)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Input
                  type="number"
                  placeholder="Quantidade de pontos"
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(e.target.value)}
                  min="1"
                  max={rewards?.availablePoints || 0}
                />
                <Button 
                  onClick={handleUsePoints}
                  disabled={!pointsToUse || parseInt(pointsToUse) <= 0 || usePointsMutation.isPending}
                >
                  {usePointsMutation.isPending ? 'Aplicando...' : 'Aplicar Desconto'}
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
                Veja todas as suas transações de pontos
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
                          transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'earned' ? (
                            <TrendingUp className={`h-4 w-4 ${
                              transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
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
                          transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'earned' ? '+' : ''}{transaction.points} pontos
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