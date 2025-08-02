import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Car, MapPin, Star, Eye, EyeOff, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/utils/formatters";
import Header from "@/components/header";
import AddVehicleModal from "@/components/add-vehicle-modal";
import VehicleAvailabilityManager from "@/components/vehicle-availability-manager";
import { TableSkeleton, Loading } from "@/components/ui/loading";

import type { Vehicle } from "@/types";

export default function Vehicles() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicleForAvailability, setSelectedVehicleForAvailability] = useState<number | null>(null);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);

  const { data: vehicles, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/users/my/vehicles", forceRefresh],
    queryFn: async () => {
      console.log("📡 useQuery - Fetching vehicles...");
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      const token = sessionStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log("📡 useQuery - Using Authorization header");
      }
      
      const response = await fetch('/api/users/my/vehicles', {
        credentials: 'include',
        headers,
      });
      console.log("📡 useQuery - Response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("📡 useQuery - 401 Unauthorized, returning empty array");
          return [];
        }
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      console.log("📡 useQuery - Data received:", data.length, "vehicles");
      return data;
    },
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 0, // Always consider data stale to force fresh fetches
    gcTime: 0, // Don't cache results (was cacheTime in v4)
  });

  // Listen for navigation back to this page to refresh data
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setForceRefresh(prev => prev + 1);
      }
    };

    const handleFocus = () => {
      setForceRefresh(prev => prev + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Force refresh when component mounts
  useEffect(() => {
    if (user) {
      setForceRefresh(prev => prev + 1);
    }
  }, [user]);

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ vehicleId, isAvailable }: { vehicleId: number; isAvailable: boolean }) =>
      apiRequest("PUT", `/api/vehicles/${vehicleId}`, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/my/vehicles"] });
      setForceRefresh(prev => prev + 1);
      toast({
        title: "Sucesso",
        description: "Disponibilidade atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar disponibilidade",
        variant: "destructive",
      });
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) =>
      apiRequest("DELETE", `/api/vehicles/${vehicleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/my/vehicles"] });
      setForceRefresh(prev => prev + 1);
      toast({
        title: "Sucesso",
        description: "Veículo excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir veículo",
        variant: "destructive",
      });
    },
  });

  const handleToggleAvailability = (vehicleId: number, currentAvailability: boolean) => {
    toggleAvailabilityMutation.mutate({
      vehicleId,
      isAvailable: !currentAvailability,
    });
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    if (confirm("Tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };



  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
              <p className="text-gray-600">Faça login para gerenciar seus veículos.</p>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Meus Veículos</h1>
            <Button onClick={() => setShowAddVehicleModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </Button>
          </div>

        {isLoading ? (
          <div className="py-12">
            <Loading 
              variant="car" 
              size="lg" 
              text="Carregando seus veículos..." 
              className="mb-8"
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20" />
                      <div className="h-8 bg-gray-200 rounded w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : vehicles?.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {vehicle.brand} {vehicle.model}
                    </CardTitle>
                    <Badge
                      variant={vehicle.isAvailable ? "default" : "secondary"}
                      className={vehicle.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {vehicle.isAvailable ? "Disponível" : "Indisponível"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {vehicle.year || 'N/A'} • {vehicle.category || 'Categoria não definida'}
                  </div>
                </CardHeader>

                <CardContent>
                  {(vehicle.images && vehicle.images.length > 0) && (
                    <div className="mb-4">
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-48 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {vehicle.location || 'Localização não informada'}
                    </div>

                    {vehicle.rating && Number(vehicle.rating) > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                        {Number(vehicle.rating).toFixed(1)} ({vehicle.total_bookings || 0} reservas)
                      </div>
                    )}

                    {vehicle.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {vehicle.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {(vehicle.features || []).slice(0, 3).map((feature: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {(vehicle.features || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(vehicle.features || []).length - 3}
                        </Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t">
                      <div>
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(vehicle.pricePerDay)}
                        </span>
                        <span className="text-sm text-gray-600">/dia</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVehicleForAvailability(vehicle.id)}
                          title="Gerenciar disponibilidade"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAvailability(vehicle.id, vehicle.isAvailable)}
                          disabled={toggleAvailabilityMutation.isPending}
                        >
                          {vehicle.isAvailable ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Link href={`/vehicle/${vehicle.id}/edit`}>
                          <Button size="sm" variant="outline">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          disabled={deleteVehicleMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Link href={`/vehicle/${vehicle.id}`}>
                      <Button className="w-full mt-2" variant="outline">
                        Ver Detalhes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum veículo cadastrado</h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando seu primeiro veículo para aluguel.
              </p>
              <Button onClick={() => setShowAddVehicleModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Veículo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Vehicle Modal */}
        <AddVehicleModal 
          open={showAddVehicleModal} 
          onOpenChange={setShowAddVehicleModal} 
        />

        {/* Vehicle Availability Manager Modal */}
        {selectedVehicleForAvailability && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gerenciar Disponibilidade</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVehicleForAvailability(null)}
                >
                  Fechar
                </Button>
              </div>
              <div className="p-6">
                <VehicleAvailabilityManager vehicleId={selectedVehicleForAvailability} />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}