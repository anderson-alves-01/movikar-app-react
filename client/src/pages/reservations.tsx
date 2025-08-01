import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Car, User, Clock, X, FileText, Eye, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import Header from "@/components/header";
import { useState } from "react";

interface Booking {
  id: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    imageUrl?: string;
    location: string;
  };
  owner?: {
    id: number;
    name: string;
    profileImage?: string;
  };
  renter?: {
    id: number;
    name: string;
    profileImage?: string;
  };
}

interface WaitingQueueEntry {
  id: number;
  vehicleId: number;
  userId: number;
  desiredStartDate: string;
  desiredEndDate: string;
  isActive: boolean;
  createdAt: string;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    imageUrl?: string;
    location: string;
  };
}

export default function Reservations() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: renterBookings, isLoading: loadingRenter } = useQuery<Booking[]>({
    queryKey: ["/api/bookings?type=renter"],
    enabled: false, // Disabled to prevent auth loops
  });

  const { data: ownerBookings, isLoading: loadingOwner } = useQuery<Booking[]>({
    queryKey: ["/api/bookings?type=owner"],
    enabled: false, // Disabled to prevent auth loops
  });

  const { data: waitingQueue, isLoading: loadingQueue } = useQuery<WaitingQueueEntry[]>({
    queryKey: ["/api/users/" + user?.id + "/waiting-queue"],
    enabled: false, // Disabled to prevent auth loops
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: (queueId: number) =>
      apiRequest("DELETE", `/api/waiting-queue/${queueId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users/" + user?.id + "/waiting-queue"] 
      });
      toast({
        title: "Sucesso",
        description: "Removido da fila de espera",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover da fila de espera",
        variant: "destructive",
      });
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number, status: string }) => {
      const response = await apiRequest("PATCH", `/api/bookings/${bookingId}`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings?type=owner"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings?type=renter"] });
      
      // Check if a contract was created
      if (data.contractCreated) {
        toast({
          title: "Reserva Aprovada com Sucesso!",
          description: `Contrato ${data.contractNumber} criado automaticamente e pronto para assinatura.`,
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Status da reserva atualizado",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da reserva",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFromQueue = (queueId: number) => {
    removeFromQueueMutation.mutate(queueId);
  };

  const handleBookingAction = (bookingId: number, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

  // Query para buscar contratos de uma reserva
  const { data: bookingContracts, isLoading: contractsLoading } = useQuery({
    queryKey: ['/api/bookings', selectedBooking?.id, 'contracts'],
    queryFn: async () => {
      if (!selectedBooking?.id) return [];
      const response = await apiRequest('GET', `/api/bookings/${selectedBooking.id}/contracts`);
      return response.json();
    },
    enabled: !!selectedBooking?.id,
  });

  const handleViewDetails = (bookingId: number) => {
    const booking = [...(renterBookings || []), ...(ownerBookings || [])].find(b => b.id === bookingId);
    if (booking) {
      setSelectedBooking(booking);
      setDetailsDialogOpen(true);
    }
  };

  const handleSignContract = async (contractId: number) => {
    try {
      const response = await apiRequest('POST', `/api/contracts/${contractId}/sign-renter`);
      const data = await response.json();
      
      if (data.signatureUrl) {
        // Redirecionar para página de assinatura
        window.location.href = data.signatureUrl;
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao iniciar processo de assinatura",
        variant: "destructive",
      });
    }
  };

  const handleViewContract = async (contractId: number) => {
    try {
      window.open(`/contract-preview/${contractId}`, '_blank');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Falha ao visualizar contrato",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
              <p className="text-gray-600">Faça login para ver suas reservas.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Minhas Reservas</h1>

        <Tabs defaultValue="renter" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="renter">Como Locatário</TabsTrigger>
            <TabsTrigger value="owner">Como Proprietário</TabsTrigger>
            <TabsTrigger value="queue">Fila de Espera</TabsTrigger>
          </TabsList>

          {/* Reservas como Locatário */}
          <TabsContent value="renter">
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <User className="w-6 h-6 mr-2" />
                Como Locatário
              </h2>
          
          {loadingRenter ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Carregando reservas...</div>
            </div>
          ) : renterBookings?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {renterBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center">
                        <Car className="w-5 h-5 mr-2" />
                        {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.year})
                      </CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status === "pending" && "Pendente"}
                        {booking.status === "approved" && "Aprovado"}
                        {booking.status === "rejected" && "Rejeitado"}
                        {booking.status === "completed" && "Concluído"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.vehicle.location}
                      </div>
                      {booking.owner && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          Proprietário: {booking.owner.name}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewDetails(booking.id)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
                <p className="text-gray-600">Você ainda não fez nenhuma reserva.</p>
              </CardContent>
            </Card>
          )}
            </div>
          </TabsContent>

          {/* Reservas como Proprietário */}
          <TabsContent value="owner">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Car className="w-6 h-6 mr-2" />
                Como Proprietário
              </h2>
          
          {loadingOwner ? (
            <div className="text-center py-8">
              <div className="text-lg text-gray-600">Carregando reservas...</div>
            </div>
          ) : ownerBookings?.length ? (
            <div className="grid gap-6 md:grid-cols-2">
              {ownerBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center">
                        <Car className="w-5 h-5 mr-2" />
                        {booking.vehicle.brand} {booking.vehicle.model} ({booking.vehicle.year})
                      </CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status === "pending" && "Pendente"}
                        {booking.status === "approved" && "Aprovado"}
                        {booking.status === "rejected" && "Rejeitado"}
                        {booking.status === "completed" && "Concluído"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.vehicle.location}
                      </div>
                      {booking.renter && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          Locatário: {booking.renter.name}
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                        <div className="flex gap-2">
                          {booking.status === "pending" && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleBookingAction(booking.id, "approved")}
                                disabled={updateBookingMutation.isPending}
                              >
                                Aprovar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleBookingAction(booking.id, "rejected")}
                                disabled={updateBookingMutation.isPending}
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(booking.id)}
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
                <p className="text-gray-600">Seus veículos ainda não foram reservados.</p>
              </CardContent>
            </Card>
          )}
            </div>
          </TabsContent>

          {/* Fila de Espera Tab */}
          <TabsContent value="queue">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-2" />
                Fila de Espera
              </h2>
              
              {loadingQueue ? (
                <div className="text-center py-8">
                  <div className="text-lg text-gray-600">Carregando fila de espera...</div>
                </div>
              ) : waitingQueue?.length ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {waitingQueue.map((entry) => (
                    <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center">
                            <Car className="w-5 h-5 mr-2" />
                            {entry.vehicle?.brand} {entry.vehicle?.model}
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromQueue(entry.id)}
                            disabled={removeFromQueueMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <CalendarDays className="w-4 h-4 mr-2" />
                            Período desejado: {formatDate(entry.desiredStartDate)} - {formatDate(entry.desiredEndDate)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {entry.vehicle?.location}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            Na fila desde: {formatDate(entry.createdAt)}
                          </div>
                          
                          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              <strong>Status:</strong> Aguardando disponibilidade. Você será notificado quando o veículo estiver disponível para as datas solicitadas.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma fila de espera
                    </h3>
                    <p className="text-gray-600">
                      Você não está em nenhuma fila de espera no momento.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Dialog para detalhes da reserva */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Detalhes da Reserva #{selectedBooking?.id}
            </DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Informações da Reserva */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Veículo</h3>
                  <p className="text-gray-700">{selectedBooking.vehicle.brand} {selectedBooking.vehicle.model} ({selectedBooking.vehicle.year})</p>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedBooking.vehicle.location}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Período</h3>
                  <p className="text-gray-700 flex items-center">
                    <CalendarDays className="w-4 h-4 mr-1" />
                    {formatDate(selectedBooking.startDate)} - {formatDate(selectedBooking.endDate)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Valor Total: {formatCurrency(selectedBooking.totalPrice)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status === "pending" && "Pendente"}
                    {selectedBooking.status === "approved" && "Aprovado"}
                    {selectedBooking.status === "rejected" && "Rejeitado"}
                    {selectedBooking.status === "completed" && "Concluído"}
                  </Badge>
                  <Badge variant="outline">
                    Pagamento: {selectedBooking.paymentStatus === 'paid' || selectedBooking.paymentStatus === 'completed' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>

              {/* Contratos */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Contratos
                </h3>
                
                {contractsLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-600">Carregando contratos...</div>
                  </div>
                ) : bookingContracts && bookingContracts.length > 0 ? (
                  <div className="space-y-3">
                    {bookingContracts.map((contract: any) => (
                      <Card key={contract.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Contrato #{contract.contractNumber}</p>
                              <p className="text-sm text-gray-600">
                                Status: <span className="capitalize">{contract.status === 'draft' ? 'Rascunho' : 
                                                                    contract.status === 'sent' ? 'Enviado' :
                                                                    contract.status === 'signed' ? 'Assinado' : contract.status}</span>
                              </p>
                              <p className="text-xs text-gray-500">
                                Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            
                            <div className="flex space-x-2">
                              {/* Botões específicos por tipo de usuário */}
                              {user?.id === selectedBooking.renter?.id ? (
                                // Locatário - pode assinar contratos pendentes
                                contract.status === 'sent' && !contract.renterSigned ? (
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSignContract(contract.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <PenTool className="w-4 h-4 mr-1" />
                                    Assinar
                                  </Button>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewContract(contract.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Visualizar
                                  </Button>
                                )
                              ) : (
                                // Proprietário - pode visualizar contratos
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleViewContract(contract.id)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Visualizar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-600">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhum contrato encontrado para esta reserva</p>
                    {selectedBooking.status === 'approved' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Contratos são gerados automaticamente quando a reserva é aprovada
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}