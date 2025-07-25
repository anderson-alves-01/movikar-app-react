import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Car, 
  Eye, 
  Check, 
  X, 
  FileText, 
  Calendar, 
  MapPin, 
  DollarSign,
  User,
  Camera,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";

interface VehicleWithOwner {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: string;
  fuel: string;
  seats: number;
  category: string;
  location: string;
  pricePerDay: number;
  licensePlate: string;
  renavam: string;
  description?: string;
  features: string[];
  images: string[];
  crlvDocument: string;
  status: string;
  createdAt: string;
  owner: {
    id: number;
    name: string;
    email: string;
  };
}

interface VehicleDetailsDialogProps {
  vehicle: VehicleWithOwner;
  onApprove: (id: number, reason?: string) => void;
  onReject: (id: number, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function VehicleDetailsDialog({ vehicle, onApprove, onReject, isApproving, isRejecting }: VehicleDetailsDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const handleApprove = () => {
    onApprove(vehicle.id);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onReject(vehicle.id, rejectionReason);
    setRejectionReason("");
    setShowRejectionForm(false);
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Detalhes do Veículo - {vehicle.brand} {vehicle.model} {vehicle.year}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Vehicle Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                Informações do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Marca/Modelo:</strong> {vehicle.brand} {vehicle.model}</div>
              <div><strong>Ano:</strong> {vehicle.year}</div>
              <div><strong>Cor:</strong> {vehicle.color}</div>
              <div><strong>Transmissão:</strong> {vehicle.transmission}</div>
              <div><strong>Combustível:</strong> {vehicle.fuel}</div>
              <div><strong>Lugares:</strong> {vehicle.seats}</div>
              <div><strong>Categoria:</strong> {vehicle.category}</div>
              <div><strong>Placa:</strong> {vehicle.licensePlate}</div>
              <div><strong>RENAVAM:</strong> {vehicle.renavam}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Proprietário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Nome:</strong> {vehicle.owner.name}</div>
              <div><strong>Email:</strong> {vehicle.owner.email}</div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <strong>Localização:</strong> {vehicle.location}
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <strong>Preço/dia:</strong> R$ {vehicle.pricePerDay}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {vehicle.description && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{vehicle.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {vehicle.features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Características</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {vehicle.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Images */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos do Veículo ({vehicle.images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vehicle.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Foto ${index + 1} do veículo`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CRLV Document */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documento CRLV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={vehicle.crlvDocument}
                alt="Documento CRLV"
                className="w-full max-w-md mx-auto rounded border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          {!showRejectionForm ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {isApproving ? "Aprovando..." : "Aprovar Veículo"}
              </Button>
              <Button
                onClick={() => setShowRejectionForm(true)}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar Veículo
              </Button>
            </>
          ) : (
            <div className="space-y-4 w-full">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Motivo da rejeição:
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isRejecting}
                  variant="destructive"
                  className="flex-1"
                >
                  {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

export default function AdminVehicleApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingVehicles = [], isLoading } = useQuery<VehicleWithOwner[]>({
    queryKey: ["/api/admin/vehicles/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      return apiRequest("POST", `/api/admin/vehicles/${vehicleId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Veículo aprovado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar veículo",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ vehicleId, reason }: { vehicleId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/vehicles/${vehicleId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Veículo Rejeitado",
        description: "Veículo rejeitado e proprietário notificado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles/pending"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar veículo",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (vehicleId: number) => {
    approveMutation.mutate(vehicleId);
  };

  const handleReject = (vehicleId: number, reason: string) => {
    rejectMutation.mutate({ vehicleId, reason });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Aprovação de Veículos</h1>
              <p className="text-gray-600 mt-2">
                Revisar e aprovar veículos cadastrados pelos usuários
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {pendingVehicles.length} pendente{pendingVehicles.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {/* Vehicles List */}
        {pendingVehicles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum veículo pendente
              </h3>
              <p className="text-gray-600">
                Todos os veículos foram revisados e aprovados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pendingVehicles.map((vehicle: VehicleWithOwner) => (
              <Card key={vehicle.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Vehicle Image */}
                    <div className="lg:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {vehicle.images.length > 0 ? (
                        <img
                          src={vehicle.images[0]}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Vehicle Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {vehicle.brand} {vehicle.model} {vehicle.year}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-2 mt-1">
                          <User className="h-4 w-4" />
                          {vehicle.owner.name} ({vehicle.owner.email})
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Placa:</span>
                          <div className="font-medium">{vehicle.licensePlate}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Categoria:</span>
                          <div className="font-medium">{vehicle.category}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Localização:</span>
                          <div className="font-medium">{vehicle.location}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Preço/dia:</span>
                          <div className="font-medium text-green-600">R$ {vehicle.pricePerDay}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        Cadastrado em {new Date(vehicle.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <VehicleDetailsDialog
                          vehicle={vehicle}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          isApproving={approveMutation.isPending}
                          isRejecting={rejectMutation.isPending}
                        />
                      </Dialog>

                      <Button
                        onClick={() => handleApprove(vehicle.id)}
                        disabled={approveMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}