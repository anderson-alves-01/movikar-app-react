import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  User, 
  Car,
  FileText,
  Clock
} from 'lucide-react';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  renavam: string;
  status: string;
  crlvDocument?: string;
  createdAt: string;
  ownerId: number;
  description?: string;
  pricePerDay: number;
}

export default function AdminVehicleApproval() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [viewDocument, setViewDocument] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingVehicles, isLoading } = useQuery({
    queryKey: ['/api/admin/vehicles/pending'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/vehicles/pending');
      return response.json();
    },
  });

  const approveVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: number; reason?: string }) => {
      const response = await apiRequest('POST', `/api/admin/vehicles/${vehicleId}/approve`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Veículo aprovado",
        description: "O veículo foi aprovado e está disponível na plataforma.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles/pending'] });
      setShowApproveDialog(false);
      setApprovalReason('');
      setSelectedVehicle(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aprovar",
        description: error.message || "Falha ao aprovar o veículo",
        variant: "destructive",
      });
    },
  });

  const rejectVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/admin/vehicles/${vehicleId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Veículo rejeitado",
        description: "O proprietário será notificado sobre a rejeição.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles/pending'] });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedVehicle(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao rejeitar",
        description: error.message || "Falha ao rejeitar o veículo",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    if (selectedVehicle) {
      approveVehicleMutation.mutate({
        vehicleId: selectedVehicle.id,
        reason: approvalReason || undefined
      });
    }
  };

  const handleReject = () => {
    if (selectedVehicle && rejectionReason.trim()) {
      rejectVehicleMutation.mutate({
        vehicleId: selectedVehicle.id,
        reason: rejectionReason
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Aprovação de Veículos
        </h1>
        <p className="text-gray-600">
          Gerencie veículos pendentes de aprovação para publicação na plataforma.
        </p>
      </div>

      {!pendingVehicles || pendingVehicles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum veículo pendente
            </h3>
            <p className="text-gray-500">
              Todos os veículos foram revisados ou não há novos cadastros.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingVehicles.map((vehicle: Vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {vehicle.brand} {vehicle.model}
                  </CardTitle>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  Cadastrado em {new Date(vehicle.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Ano:</span> {vehicle.year}
                  </div>
                  <div>
                    <span className="font-medium">Cor:</span> {vehicle.color}
                  </div>
                  <div>
                    <span className="font-medium">Placa:</span> {vehicle.licensePlate}
                  </div>
                  <div>
                    <span className="font-medium">RENAVAM:</span> {vehicle.renavam}
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Valor:</span> R$ {vehicle.pricePerDay}/dia
                </div>

                {vehicle.description && (
                  <div className="text-sm">
                    <span className="font-medium">Descrição:</span>
                    <p className="text-gray-600 truncate">{vehicle.description}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {vehicle.crlvDocument && (
                    <Dialog open={viewDocument} onOpenChange={setViewDocument}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedVehicle(vehicle)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver CRLV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Documento CRLV</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          <img
                            src={vehicle.crlvDocument}
                            alt="CRLV Document"
                            className="max-w-full max-h-96 object-contain border rounded"
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aprovar Veículo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>
                          Confirma a aprovação do veículo{' '}
                          <strong>{vehicle.brand} {vehicle.model}</strong>?
                        </p>
                        <div>
                          <Label htmlFor="approval-reason">Observações (opcional)</Label>
                          <Textarea
                            id="approval-reason"
                            placeholder="Adicione observações sobre a aprovação..."
                            value={approvalReason}
                            onChange={(e) => setApprovalReason(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowApproveDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={handleApprove}
                            disabled={approveVehicleMutation.isPending}
                          >
                            {approveVehicleMutation.isPending ? 'Aprovando...' : 'Confirmar Aprovação'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rejeitar Veículo</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>
                          Rejeitar o veículo{' '}
                          <strong>{vehicle.brand} {vehicle.model}</strong>?
                        </p>
                        <div>
                          <Label htmlFor="rejection-reason">Motivo da rejeição *</Label>
                          <Textarea
                            id="rejection-reason"
                            placeholder="Descreva o motivo da rejeição (documentação inválida, informações incorretas, etc.)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowRejectDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleReject}
                            disabled={rejectVehicleMutation.isPending || !rejectionReason.trim()}
                          >
                            {rejectVehicleMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}