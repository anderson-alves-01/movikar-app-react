import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Search, 
  Filter, 
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import { TableSkeleton, Loading } from "@/components/ui/loading";
import { useAuthStore } from "@/lib/auth";

export default function AdminSubscriptions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Fetch subscriptions
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['/api/admin/subscriptions'],
  });

  // Fetch subscription stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/subscription-stats'],
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest('POST', `/api/admin/subscriptions/${subscriptionId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assinatura cancelada!",
        description: "A assinatura foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao cancelar assinatura",
        variant: "destructive",
      });
    },
  });

  // Filter subscriptions
  const filteredSubscriptions = Array.isArray(subscriptions) ? subscriptions.filter((sub: any) => {
    const matchesSearch = sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
    const matchesPlan = planFilter === "all" || sub.plan?.name === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  }) : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Ativa</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      case 'past_due':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Em atraso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'essencial':
        return <Badge variant="default"><Star className="h-3 w-3 mr-1" />Essencial</Badge>;
      case 'plus':
        return <Badge variant="destructive"><Star className="h-3 w-3 mr-1" />Plus</Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gerenciar Assinaturas</h1>
          <p className="text-gray-600 mt-2">Visualize e gerencie todas as assinaturas da plataforma</p>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Assinaturas</p>
                    <p className="text-2xl font-bold text-gray-800">{(stats as any)?.totalSubscriptions || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assinaturas Ativas</p>
                    <p className="text-2xl font-bold text-green-600">{(stats as any)?.activeSubscriptions || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency((stats as any)?.monthlyRevenue || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Crescimento</p>
                    <p className="text-2xl font-bold text-gray-800">{(stats as any)?.growthRate || 0}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="past_due">Em atraso</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="essencial">Essencial</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptionsLoading ? (
              <TableSkeleton />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próximo Pagamento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center">
                          <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-600">Nenhuma assinatura encontrada</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((subscription: any) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <User className="h-8 w-8 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {subscription.user?.email || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(subscription.plan?.displayName || subscription.plan?.name || 'N/A')}</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(subscription.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {subscription.nextPaymentDate ? formatDate(subscription.nextPaymentDate) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {formatCurrency(
                            parseFloat(
                              subscription.paymentMethod === 'monthly' 
                                ? subscription.plan?.monthlyPrice || '0'
                                : subscription.plan?.annualPrice || '0'
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {subscription.status === 'active' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => cancelSubscriptionMutation.mutate(subscription.id)}
                                disabled={cancelSubscriptionMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              Ver Detalhes
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}