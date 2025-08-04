import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";
import { DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Calendar, PiggyBank } from "lucide-react";
import type { Payout } from "@shared/schema";

export default function EarningsPage() {
  const { user } = useAuthStore();
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Buscar histórico de repasses
  const { data: transfers = [], isLoading: transfersLoading } = useQuery({
    queryKey: ['/api/payment-transfers', timeFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (timeFilter !== "all") params.append("period", timeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      
      const response = await fetch(`/api/payment-transfers?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar repasses');
      return response.json();
    },
    enabled: !!user
  });

  // Buscar resumo de ganhos
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['/api/earnings-summary'],
    queryFn: async () => {
      const response = await fetch('/api/earnings-summary');
      if (!response.ok) throw new Error('Erro ao buscar resumo');
      return response.json();
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
            <p className="text-gray-600">Você precisa estar logado para ver seus ganhos.</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      processing: { label: "Processando", variant: "default" as const, icon: TrendingUp },
      completed: { label: "Concluído", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Falhou", variant: "destructive" as const, icon: XCircle }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <PiggyBank className="h-8 w-8 text-green-600" />
                Meus Ganhos
              </h1>
              <p className="text-gray-600 mt-2">
                Acompanhe seus repasses e histórico de recebimentos
              </p>
            </div>
            {!user?.pix && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <p className="text-yellow-800 text-sm font-medium">
                    ⚠️ Configure sua chave PIX no perfil para receber pagamentos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo de Ganhos */}
          {summaryLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Recebido</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(summary?.totalReceived || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendente</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatCurrency(summary?.pendingAmount || 0)}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Este Mês</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(summary?.thisMonthEarnings || 0)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Repasses</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary?.totalTransfers || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros e Histórico */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Repasses</CardTitle>
                <div className="flex gap-2">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="7d">7 dias</SelectItem>
                      <SelectItem value="30d">30 dias</SelectItem>
                      <SelectItem value="90d">90 dias</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="completed">Recebidos</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="failed">Falharam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {transfersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : transfers.length === 0 ? (
                <div className="text-center py-12">
                  <PiggyBank className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum repasse encontrado</h3>
                  <p className="text-gray-600">
                    Seus repasses aparecerão aqui após as reservas serem concluídas.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transfers.map((transfer: any) => (
                    <div key={transfer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Repasse #{transfer.id}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Reserva #{transfer.bookingId}
                          </p>
                        </div>
                        {getStatusBadge(transfer.status || transfer.transferStatus)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Valor Bruto</p>
                          <p className="font-semibold">{formatCurrency(parseFloat(transfer.totalBookingAmount))}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Taxa Plataforma</p>
                          <p className="font-semibold text-red-600">-{formatCurrency(parseFloat(transfer.serviceFee))}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Valor Líquido</p>
                          <p className="font-semibold text-green-600">{formatCurrency(parseFloat(transfer.netAmount))}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Data</p>
                          <p className="font-semibold">
                            {transfer.payoutDate || transfer.transferDate 
                              ? formatDate(transfer.payoutDate || transfer.transferDate) 
                              : formatDate(transfer.createdAt)
                            }
                          </p>
                        </div>
                      </div>

                      {(transfer.reference || transfer.transferReference) && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-600">
                            Referência: {transfer.reference || transfer.transferReference}
                          </p>
                        </div>
                      )}

                      {transfer.failureReason && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-red-600">
                            Motivo da falha: {transfer.failureReason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}