import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, Trash2, Car, MapPin, Star, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  category: string;
  pricePerDay: number;
  location: string;
  imageUrl?: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  description?: string;
  features: string[];
}

export default function Vehicles() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/users", user?.id, "vehicles"],
    enabled: !!user,
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ vehicleId, isAvailable }: { vehicleId: number; isAvailable: boolean }) =>
      apiRequest(`/api/vehicles/${vehicleId}`, "PUT", { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "vehicles"] });
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
      apiRequest(`/api/vehicles/${vehicleId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "vehicles"] });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Restrito</h1>
            <p className="text-gray-600">Faça login para gerenciar seus veículos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Veículos</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Veículo
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Carregando veículos...</div>
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
                    {vehicle.year} • {vehicle.category}
                  </div>
                </CardHeader>

                <CardContent>
                  {vehicle.imageUrl && (
                    <div className="mb-4">
                      <img
                        src={vehicle.imageUrl}
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
                      {vehicle.location}
                    </div>

                    {vehicle.rating > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current" />
                        {vehicle.rating.toFixed(1)} ({vehicle.reviewCount} avaliações)
                      </div>
                    )}

                    {vehicle.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {vehicle.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1">
                      {vehicle.features.slice(0, 3).map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                      {vehicle.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vehicle.features.length - 3}
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Veículo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}