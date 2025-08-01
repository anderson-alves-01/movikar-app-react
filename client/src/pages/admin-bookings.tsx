import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Search, Filter, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/auth";
import AdminLayout from "@/components/admin-layout";

interface Booking {
  id: number;
  vehicleId: number;
  renterId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: string;
  serviceFee: string;
  insuranceFee: string;
  createdAt: string;
  vehicle?: {
    id: number;
    brand: string;
    model: string;
    year: number;
    owner: {
      name: string;
      email: string;
    };
  };
}

export default function AdminBookingsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  // Get all bookings with pagination
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/bookings', currentPage, pageSize, searchTerm, statusFilter, paymentStatusFilter],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        paymentStatus: paymentStatusFilter === 'all' ? '' : paymentStatusFilter,
      });
      
      const response = await fetch(`/api/admin/bookings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Token inválido ou expirado');
        }
        throw new Error('Failed to fetch bookings');
      }
      
      return response.json();
    },
    enabled: !!token, // Only run query if token exists
  });

  const bookings = bookingsData?.bookings || [];
  const totalPages = bookingsData?.totalPages || 0;
  const total = bookingsData?.total || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Filtering is now handled on the backend, no need for frontend filtering
  const filteredBookings = bookings;

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async (data: { id: number; status: string }) => {
      const currentToken = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/bookings/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: data.status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/bookings', currentPage, pageSize, searchTerm, statusFilter, paymentStatusFilter] 
      });
      toast({ title: "Status da reserva atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar reserva", variant: "destructive" });
    },
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const currentToken = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/bookings', currentPage, pageSize, searchTerm, statusFilter, paymentStatusFilter] 
      });
      toast({ title: "Reserva excluída com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir reserva", variant: "destructive" });
    },
  });

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleDeleteBooking = (bookingId: number) => {
    if (confirm('Tem certeza que deseja excluir esta reserva?')) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedBooking) return;
    
    updateBookingMutation.mutate({
      id: selectedBooking.id,
      status: newStatus,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Reservas</h2>
            <p className="text-gray-600">Administre todas as reservas da plataforma</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Total: {total} reservas
            </span>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por ID, veículo, proprietário..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1); // Reset to first page when filtering
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentStatusFilter('all');
                  setCurrentPage(1); // Reset to first page when clearing filters
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando reservas...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhuma reserva encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Proprietário</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Criado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: Booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          #{booking.id}
                        </TableCell>
                        <TableCell>
                          {booking.vehicle ? (
                            <div>
                              <p className="font-medium">
                                {booking.vehicle.brand} {booking.vehicle.model}
                              </p>
                              <p className="text-sm text-gray-600">
                                {booking.vehicle.year}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Veículo não encontrado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {booking.vehicle?.owner ? (
                            <div>
                              <p className="font-medium">{booking.vehicle.owner.name}</p>
                              <p className="text-sm text-gray-600">{booking.vehicle.owner.email}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">Proprietário não encontrado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(new Date(booking.startDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                            <p className="text-gray-600">
                              até {format(new Date(booking.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">R$ {booking.totalPrice}</p>
                            <p className="text-gray-600">Taxa: R$ {booking.serviceFee}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {format(new Date(booking.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditBooking(booking)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteBooking(booking.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, total)} de {total} reservas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select value={pageSize.toString()} onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1); // Reset to first page when changing page size
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}

        {/* Edit Booking Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar Status da Reserva</DialogTitle>
              <DialogDescription>
                Selecione o novo status para a reserva selecionada.
              </DialogDescription>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Reserva ID: #{selectedBooking.id}</p>
                  <p className="font-medium">
                    {selectedBooking.vehicle?.brand} {selectedBooking.vehicle?.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status atual: {getStatusText(selectedBooking.status)}
                  </p>
                </div>

                <div>
                  <Label>Novo Status</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={selectedBooking.status === 'approved' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('approved')}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant={selectedBooking.status === 'rejected' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('rejected')}
                    >
                      Rejeitar
                    </Button>
                    <Button
                      variant={selectedBooking.status === 'active' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('active')}
                    >
                      Ativar
                    </Button>
                    <Button
                      variant={selectedBooking.status === 'completed' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('completed')}
                    >
                      Concluir
                    </Button>
                    <Button
                      variant={selectedBooking.status === 'cancelled' ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus('cancelled')}
                      className="col-span-2"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}