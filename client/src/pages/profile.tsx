import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Star, 
  Car, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Loader2,
  MessageCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import ContractManager from "@/components/contract-manager";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    location: '',
    pixKey: '',
  });
  const [contractManagerOpen, setContractManagerOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const { user, setAuth, refreshUser } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug: Log user data para identificar problema
  console.log('🔍 Profile Debug - User data:', user);
  console.log('🔍 Profile Debug - User keys:', user ? Object.keys(user) : 'No user');

  // Force refresh user data on component mount
  useEffect(() => {
    if (user && !user.pix) {
      refreshUser();
    }
  }, [user, refreshUser]);

  // Fetch user bookings as renter
  const { data: renterBookings, isLoading: renterBookingsLoading } = useQuery({
    queryKey: ['/api/bookings?type=renter'],
    enabled: false, // Disabled to prevent auth loops
  });

  // Fetch user bookings as owner
  const { data: ownerBookings, isLoading: ownerBookingsLoading } = useQuery({
    queryKey: ['/api/bookings?type=owner'],
    enabled: false, // Disabled to prevent auth loops
  });

  // Fetch user vehicles
  const { data: userVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/users/my/vehicles'],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/users/${user?.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      setAuth(updatedUser, useAuthStore.getState().token!);
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/bookings/${bookingId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado!",
        description: "O status da reserva foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar status",
        variant: "destructive",
      });
    },
  });

  const handleEditProfile = () => {
    setEditData({
      name: user?.name || '',
      phone: user?.phone || '',
      location: user?.location || '',
      pixKey: user?.pix || '', // Usar pix do backend, não pixKey
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    // Converter pixKey para pix antes de enviar para API
    const dataToSend: any = {
      ...editData,
      pix: editData.pixKey, // Mapear pixKey para pix
    };
    delete dataToSend.pixKey; // Remover pixKey
    updateUserMutation.mutate(dataToSend);
  };

  const handleBookingAction = (bookingId: number, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      active: { label: 'Ativo', variant: 'default' as const, icon: Car },
      completed: { label: 'Concluído', variant: 'secondary' as const, icon: CheckCircle },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso restrito</h2>
              <p className="text-gray-600 mb-6">Você precisa estar logado para acessar seu perfil</p>
              <Button asChild>
                <Link href="/auth">Fazer login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Nome</Label>
                        <Input
                          id="name"
                          value={editData.name}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          value={editData.location}
                          onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="pixKey">Chave PIX</Label>
                        <Input
                          id="pixKey"
                          value={editData.pixKey}
                          onChange={(e) => setEditData(prev => ({ ...prev, pixKey: e.target.value }))}
                          placeholder="CPF, e-mail, telefone ou chave aleatória"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Configure sua chave PIX para receber repasses das locações
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={updateUserMutation.isPending}
                      >
                        {updateUserMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Salvando...
                          </>
                        ) : (
                          'Salvar'
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                      <Button variant="outline" size="sm" onClick={handleEditProfile}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span>{user.rating}</span>
                      </div>
                      <span>•</span>
                      <span>{user.totalRentals} aluguéis</span>
                      <span>•</span>
                      <span>Membro desde 2024</span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      {user.pix && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          <span>PIX: {user.pix}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Subscription Plan Display */}
                    <div className="mt-4 flex items-center gap-3">
                      <Badge 
                        variant={(user as any).subscriptionPlan === 'free' ? 'secondary' : (user as any).subscriptionPlan === 'essencial' ? 'default' : 'destructive'}
                        className="text-sm px-3 py-1"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Plano {(user as any).subscriptionPlan === 'free' ? 'Gratuito' : 
                                (user as any).subscriptionPlan === 'essencial' ? 'Essencial' : 
                                (user as any).subscriptionPlan === 'plus' ? 'Plus' : 'Desconhecido'}
                      </Badge>
                      {(user as any).subscriptionStatus === 'active' && (user as any).subscriptionPlan !== 'free' && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo até {(user as any).subscriptionEndDate ? new Date((user as any).subscriptionEndDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </Badge>
                      )}
                      {(user as any).subscriptionPlan === 'free' && (
                        <Button asChild variant="outline" size="sm">
                          <Link href="/subscription-plans">
                            Fazer upgrade
                          </Link>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(parseFloat(user.totalEarnings))}
                </div>
                <div className="text-sm text-gray-600">Total ganho</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="renter" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="renter">Minhas Reservas</TabsTrigger>
            <TabsTrigger value="owner">Como Proprietário</TabsTrigger>
            <TabsTrigger value="vehicles">Meus Veículos</TabsTrigger>
          </TabsList>

          {/* Renter Bookings */}
          <TabsContent value="renter">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                {renterBookingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando reservas...</p>
                  </div>
                ) : renterBookings && Array.isArray(renterBookings) && renterBookings.length > 0 ? (
                  <div className="space-y-4">
                    {renterBookings.map((booking: any) => (
                      <Card key={booking.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={booking.vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Proprietário: {booking.owner.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(booking.status)}
                              <div className="text-lg font-bold text-gray-800 mt-2">
                                {formatCurrency(booking.totalPrice)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/vehicle/${booking.vehicle.id}`}>
                                  Ver veículo
                                </Link>
                              </Button>
                              <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Conversar
                              </Button>
                              {(booking.status === 'approved' || booking.status === 'active' || booking.status === 'completed') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBookingId(booking.id);
                                    setContractManagerOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Contratos
                                </Button>
                              )}
                            </div>
                            
                            {booking.status === 'pending' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleBookingAction(booking.id, 'cancelled')}
                              >
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Você ainda não fez nenhuma reserva</p>
                    <Button className="mt-4" asChild>
                      <Link href="/">Encontrar veículos</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Owner Bookings */}
          <TabsContent value="owner">
            <Card>
              <CardHeader>
                <CardTitle>Reservas dos Meus Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                {ownerBookingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando reservas...</p>
                  </div>
                ) : ownerBookings && Array.isArray(ownerBookings) && ownerBookings.length > 0 ? (
                  <div className="space-y-4">
                    {ownerBookings.map((booking: any) => (
                      <Card key={booking.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <img
                                src={booking.vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div>
                                <h3 className="font-semibold text-gray-800">
                                  {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Locatário: {booking.renter.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(booking.status)}
                              <div className="text-lg font-bold text-gray-800 mt-2">
                                {formatCurrency(booking.totalPrice)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Conversar
                              </Button>
                              {(booking.status === 'approved' || booking.status === 'active' || booking.status === 'completed') && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBookingId(booking.id);
                                    setContractManagerOpen(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Contratos
                                </Button>
                              )}
                            </div>
                            
                            {booking.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleBookingAction(booking.id, 'rejected')}
                                >
                                  Rejeitar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => handleBookingAction(booking.id, 'approved')}
                                >
                                  Aprovar
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma reserva para seus veículos ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Vehicles */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Meus Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Carregando veículos...</p>
                  </div>
                ) : userVehicles && Array.isArray(userVehicles) && userVehicles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userVehicles.map((vehicle: any) => (
                      <Card key={vehicle.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <img
                            src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-40 rounded-lg object-cover mb-4"
                          />
                          
                          <h3 className="font-semibold text-gray-800 mb-2">
                            {vehicle.brand} {vehicle.model} {vehicle.year}
                          </h3>
                          
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant={vehicle.isAvailable ? "default" : "secondary"}>
                              {vehicle.isAvailable ? "Disponível" : "Indisponível"}
                            </Badge>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="text-sm">{vehicle.rating}</span>
                            </div>
                          </div>
                          
                          <div className="text-lg font-bold text-gray-800 mb-4">
                            {formatCurrency(vehicle.pricePerDay)}/dia
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              Editar
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/vehicle/${vehicle.id}`}>
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Você ainda não cadastrou nenhum veículo</p>
                    <Button className="mt-4">
                      Anunciar meu primeiro carro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contract Manager Modal */}
      {selectedBookingId && (
        <ContractManager
          bookingId={selectedBookingId}
          open={contractManagerOpen}
          onOpenChange={(open) => {
            setContractManagerOpen(open);
            if (!open) setSelectedBookingId(null);
          }}
        />
      )}
    </div>
  );
}
