import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ContractManager from "@/components/contract-manager";
import { 
  User, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Loader2, 
  Calendar,
  Car,
  MessageCircle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  Users,
  Eye,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import Header from "@/components/header";
import { validatePixKey, formatPixKey } from "@/utils/pixValidator";

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

  // Force refresh user data on component mount
  useEffect(() => {
    if (user && !user.pix) {
      refreshUser();
    }
  }, [user, refreshUser]);

  // Fetch user bookings as renter
  const { data: renterBookings, isLoading: renterBookingsLoading } = useQuery({
    queryKey: ['/api/bookings', 'renter'],
    queryFn: async () => {
      const response = await fetch('/api/bookings?type=renter&includeInspections=true', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch renter bookings');
      return response.json();
    },
    enabled: !!user,
    staleTime: 5000,
  });

  // Fetch user bookings as owner
  const { data: ownerBookings, isLoading: ownerBookingsLoading } = useQuery({
    queryKey: ['/api/bookings', 'owner'],
    queryFn: async () => {
      const response = await fetch('/api/bookings?type=owner&includeInspections=true', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch owner bookings');
      return response.json();
    },
    enabled: !!user,
    staleTime: 5000,
  });

  // Fetch user vehicles
  const { data: userVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/users/my/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/users/my/vehicles', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user vehicles');
      return response.json();
    },
    enabled: !!user,
    staleTime: 5000,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('🔄 Enviando dados para atualização do perfil:', data);
      const response = await apiRequest('PUT', '/api/profile', data);
      const result = await response.json();
      console.log('✅ Resposta do servidor:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Perfil atualizado com sucesso:', data);
      setAuth(data);
      setIsEditing(false);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      // Revalidate user data
      refreshUser();
    },
    onError: (error: any) => {
      console.error('❌ Erro ao atualizar perfil:', error);
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

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Concluído</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmado</Badge>;
      case "aguardando_vistoria":
        return <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Aguardando Vistoria
        </Badge>;
      case "awaiting_inspection":
        return <Badge className="bg-orange-100 text-orange-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Aguardando Vistoria
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleBookingAction = (bookingId: number, status: string) => {
    updateBookingMutation.mutate({ bookingId, status });
  };

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
    try {
      // Validação básica
      if (!editData.name || editData.name.trim() === '') {
        toast({
          title: "Erro",
          description: "Nome é obrigatório",
          variant: "destructive",
        });
        return;
      }

      // Validação da chave PIX se fornecida
      if (editData.pixKey && editData.pixKey.trim() !== '') {
        const isValidPix = validatePixKey(editData.pixKey);
        if (!isValidPix) {
          toast({
            title: "Erro",
            description: "Chave PIX inválida. Verifique o formato.",
            variant: "destructive",
          });
          return;
        }
      }

      // Converter pixKey para pix antes de enviar para API
      const dataToSend: any = {
        name: editData.name.trim(),
        phone: editData.phone?.trim() || '',
        location: editData.location?.trim() || '',
        pix: editData.pixKey?.trim() || null, // Mapear pixKey para pix
      };

      console.log('📤 Dados preparados para envio:', dataToSend);
      updateUserMutation.mutate(dataToSend);
    } catch (error) {
      console.error('❌ Erro ao preparar dados para envio:', error);
      toast({
        title: "Erro",
        description: "Erro ao preparar dados. Tente novamente.",
        variant: "destructive",
      });
    }
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
                          onChange={(e) => {
                            const value = e.target.value;
                            const formatted = formatPixKey(value);
                            setEditData(prev => ({ ...prev, pixKey: formatted }));
                          }}
                          placeholder="CPF, e-mail, telefone ou chave aleatória"
                        />
                        {editData.pixKey && (() => {
                          const validation = validatePixKey(editData.pixKey);
                          if (!validation.isValid) {
                            return (
                              <p className="text-xs text-red-500 mt-1">
                                {validation.errorMessage}
                              </p>
                            );
                          } else {
                            return (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Chave PIX válida ({validation.type?.toUpperCase()})
                              </p>
                            );
                          }
                        })()}
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
                      <span>Membro desde {new Date().getFullYear()}</span>
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
                              {(booking.status === 'aguardando_vistoria' || booking.status === 'awaiting_inspection') && (
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  asChild
                                >
                                  <Link href={`/inspection/${booking.id}`}>
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Fazer Vistoria
                                  </Link>
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
            {/* Monetization Features for Owners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Leads Qualificados</h3>
                      <p className="text-sm text-green-600">Interessados nos seus veículos</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-100">
                    <Link href="/owner-leads">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Leads
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-800">Destacar Veículos</h3>
                      <p className="text-sm text-purple-600">Aumente a visibilidade</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-100">
                    <Link href="/vehicles">
                      <Star className="h-4 w-4 mr-2" />
                      Gerenciar Boosts
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

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
                          {/* Mobile Layout - Stack elements vertically */}
                          <div className="space-y-4 sm:space-y-0">
                            {/* Vehicle info and status - responsive layout */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                                <img
                                  src={booking.vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                                  alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                                    {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                                    Locatário: {booking.renter.name}
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Status and price - mobile optimized */}
                              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
                                <div className="flex-shrink-0">
                                  {getStatusBadge(booking.status)}
                                </div>
                                <div className="text-base sm:text-lg font-bold text-gray-800">
                                  {formatCurrency(booking.totalPrice)}
                                </div>
                              </div>
                            </div>

                            {/* Action buttons - responsive layout */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
                                  <Link href={`/vehicle/${booking.vehicle.id}`}>
                                    Ver veículo
                                  </Link>
                                </Button>
                                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  Conversar
                                </Button>
                              </div>

                              {/* Status-specific action buttons */}
                              <div className="flex flex-wrap gap-2 justify-end">
                                {booking.status === 'pending' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs sm:text-sm"
                                      onClick={() => handleBookingAction(booking.id, 'approved')}
                                    >
                                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                      Aprovar
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="text-xs sm:text-sm"
                                      onClick={() => handleBookingAction(booking.id, 'rejected')}
                                    >
                                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                      Rejeitar
                                    </Button>
                                  </>
                                )}

                                {/* Vistoria Button - Multiple status check for robustness */}
                                {(['aguardando_vistoria', 'awaiting_inspection'].includes(booking.status)) && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm"
                                    asChild
                                  >
                                    <Link href={`/inspection/${booking.id}`}>
                                      <ClipboardCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                      Fazer Vistoria
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma reserva nos seus veículos ainda</p>
                    <Button className="mt-4" asChild>
                      <Link href="/add-vehicle">Adicionar veículo</Link>
                    </Button>
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {userVehicles.map((vehicle: any) => (
                      <Card key={vehicle.id} className="overflow-hidden">
                        <img
                          src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-48 object-cover"
                        />
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-gray-800 mb-2">
                            {vehicle.brand} {vehicle.model} {vehicle.year}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {vehicle.location}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(vehicle.pricePerDay)}/dia
                            </span>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/vehicle/${vehicle.id}`}>
                                Ver detalhes
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
                    <p className="text-gray-600">Você ainda não tem veículos cadastrados</p>
                    <Button className="mt-4" asChild>
                      <Link href="/add-vehicle">Adicionar primeiro veículo</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Contract Manager */}
        {selectedBookingId && (
          <ContractManager 
            bookingId={selectedBookingId}
            open={contractManagerOpen}
            onOpenChange={setContractManagerOpen}
          />
        )}
      </div>
    </div>
  );
}