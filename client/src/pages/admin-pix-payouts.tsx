import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, XCircle, Eye, DollarSign, TrendingUp, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Payout {
  id: number;
  bookingId: number;
  ownerId: number;
  renterId: number;
  totalBookingAmount: string;
  serviceFee: string;
  insuranceFee: string;
  netAmount: string;
  ownerPix: string;
  status: string;
  method: string;
  reference?: string;
  failureReason?: string;
  payoutDate?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PayoutStats {
  totalPending: number;
  totalCompleted: number;
  totalFailed: number;
  totalManualReview: number;
  totalAmountPending: number;
  totalAmountCompleted: number;
}

export default function AdminPixPayouts() {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({ approved: true, reason: "" });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  // Buscar estatísticas de repasses
  const { data: stats } = useQuery<PayoutStats>({
    queryKey: ["/api/admin/payout-stats"],
    refetchInterval: 30000 // Atualizar a cada 30 segundos
  });

  // Buscar repasses com filtros
  const { data: payouts = [], isLoading } = useQuery<Payout[]>({
    queryKey: ["/api/payment-transfers", { status: statusFilter }],
    refetchInterval: 15000 // Atualizar a cada 15 segundos
  });

  // Aprovar/rejeitar repasse
  const approveMutation = useMutation({
    mutationFn: async ({ payoutId, approved, reason }: { payoutId: number; approved: boolean; reason: string }) => {
      return apiRequest(`/api/admin/approve-payout/${payoutId}`, "POST", {
        approved,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payout-stats"] });
      setApprovalDialog(false);
      setSelectedPayout(null);
    }
  });

  // Trigger manual de repasse
  const triggerMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      return apiRequest(`/api/admin/trigger-payout/${bookingId}`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-transfers"] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'manual_review': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'manual_review': return <AlertTriangle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'failed': return 'Falhou';
      case 'manual_review': return 'Revisão Manual';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema PIX - Repasses Automáticos</h1>
          <p className="text-muted-foreground">
            Monitor e controle de repasses para proprietários de veículos
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              R$ {(stats?.totalAmountPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">
              R$ {(stats?.totalAmountCompleted || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisão Manual</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalManualReview || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requer intervenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFailed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Precisam retry
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles e Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Controles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="status-filter">Status:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="manual_review">Revisão Manual</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Repasses */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Repasses</CardTitle>
          <CardDescription>
            Lista de todos os repasses processados e suas situações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando repasses...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Valor Líquido</TableHead>
                  <TableHead>PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.id}</TableCell>
                    <TableCell>{payout.bookingId}</TableCell>
                    <TableCell>ID: {payout.ownerId}</TableCell>
                    <TableCell className="font-semibold">
                      R$ {parseFloat(payout.netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="truncate max-w-32" title={payout.ownerPix}>
                      {payout.ownerPix}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(payout.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(payout.status)}
                        {getStatusText(payout.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payout.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayout(payout)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {payout.status === 'manual_review' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setApprovalDialog(true);
                            }}
                          >
                            Revisar
                          </Button>
                        )}

                        {payout.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => triggerMutation.mutate(payout.bookingId)}
                            disabled={triggerMutation.isPending}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && payouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum repasse encontrado com os filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Repasse */}
      {selectedPayout && (
        <Dialog open={!!selectedPayout && !approvalDialog} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Repasse #{selectedPayout.id}</DialogTitle>
              <DialogDescription>
                Informações completas sobre o repasse PIX
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedPayout.status)}>
                      {getStatusText(selectedPayout.status)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Método</Label>
                  <p className="mt-1">{selectedPayout.method.toUpperCase()}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Booking ID</Label>
                  <p className="mt-1">{selectedPayout.bookingId}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Proprietário ID</Label>
                  <p className="mt-1">{selectedPayout.ownerId}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Chave PIX</Label>
                  <p className="mt-1 break-all">{selectedPayout.ownerPix}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Referência</Label>
                  <p className="mt-1">{selectedPayout.reference || 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Valores</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Valor Total da Reserva</Label>
                    <p className="font-semibold">R$ {parseFloat(selectedPayout.totalBookingAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  
                  <div>
                    <Label>Taxa de Serviço</Label>
                    <p className="text-red-600">-R$ {parseFloat(selectedPayout.serviceFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div>
                    <Label>Taxa de Seguro</Label>
                    <p className="text-red-600">-R$ {parseFloat(selectedPayout.insuranceFee).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>

                  <div className="border-t pt-2">
                    <Label>Valor Líquido</Label>
                    <p className="font-bold text-green-600">R$ {parseFloat(selectedPayout.netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {selectedPayout.failureReason && (
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Motivo da Falha</Label>
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {selectedPayout.failureReason}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Criado em</Label>
                    <p>{new Date(selectedPayout.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  
                  {selectedPayout.processedAt && (
                    <div>
                      <Label>Processado em</Label>
                      <p>{new Date(selectedPayout.processedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Aprovação Manual */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revisão Manual - Repasse #{selectedPayout?.id}</DialogTitle>
            <DialogDescription>
              Analise o repasse e decida se deve ser aprovado ou rejeitado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedPayout && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Proprietário:</span>
                  <span className="font-medium">ID {selectedPayout.ownerId}</span>
                </div>
                <div className="flex justify-between">
                  <span>PIX:</span>
                  <span className="font-medium">{selectedPayout.ownerPix}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-bold text-green-600">
                    R$ {parseFloat(selectedPayout.netAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="decision">Decisão</Label>
              <Select 
                value={approvalData.approved ? 'approve' : 'reject'} 
                onValueChange={(value) => setApprovalData({...approvalData, approved: value === 'approve'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approve">✅ Aprovar e Processar</SelectItem>
                  <SelectItem value="reject">❌ Rejeitar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Observações</Label>
              <Textarea
                id="reason"
                placeholder="Motivo da decisão ou observações adicionais..."
                value={approvalData.reason}
                onChange={(e) => setApprovalData({...approvalData, reason: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedPayout) {
                  approveMutation.mutate({
                    payoutId: selectedPayout.id,
                    approved: approvalData.approved,
                    reason: approvalData.reason
                  });
                }
              }}
              disabled={approveMutation.isPending}
            >
              {approvalData.approved ? 'Aprovar' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}