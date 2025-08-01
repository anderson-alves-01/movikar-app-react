import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Plus, Check, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { useComparisonStore } from "@/lib/comparison";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle } from "@/types";

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [, navigate] = useLocation();
  const { addVehicle, removeVehicle, isVehicleInComparison, vehicles } = useComparisonStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get token helper function
  const getToken = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      console.log('🔍 [VehicleCard] Auth storage raw:', authStorage);
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        console.log('🔍 [VehicleCard] Auth data parsed:', authData);
        const token = authData.state?.token || authData.token;
        console.log('🔍 [VehicleCard] Token extracted:', token ? 'Present' : 'Missing');
        return token;
      }
    } catch (error) {
      console.error('❌ [VehicleCard] Error parsing auth token:', error);
    }
    console.log('❌ [VehicleCard] No token found');
    return null;
  };

  // Check if vehicle is saved
  const { data: savedStatus, error: savedError, isLoading: savedLoading } = useQuery({
    queryKey: ["/api/saved-vehicles/check", vehicle.id],
    enabled: false, // Disabled to prevent auth loops
    retry: false,
  });
  
  console.log(`🔍 [VehicleCard] Vehicle ${vehicle.id} saved status:`, {
    data: savedStatus,
    error: savedError,
    loading: savedLoading,
    hasToken: !!getToken()
  });

  const isSaved = savedStatus?.isSaved || false;

  // Save vehicle mutation
  const saveVehicleMutation = useMutation({
    mutationFn: async () => {
      console.log(`🚀 [VehicleCard] Saving vehicle ${vehicle.id}...`);
      const result = await apiRequest('POST', '/api/saved-vehicles', {
        vehicleId: vehicle.id,
        category: 'Geral'
      });
      console.log('✅ [VehicleCard] Save result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-vehicles/check", vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-vehicles"] });
      toast({
        title: "Veículo salvo",
        description: "Veículo adicionado aos seus salvos",
      });
    },
    onError: (error: any) => {
      console.error('❌ [VehicleCard] Save error:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o veículo",
        variant: "destructive",
      });
    },
  });

  // Remove saved vehicle mutation
  const removeSavedVehicleMutation = useMutation({
    mutationFn: async () => {
      console.log(`🗑️ [VehicleCard] Removing vehicle ${vehicle.id}...`);
      const result = await apiRequest('DELETE', `/api/saved-vehicles/${vehicle.id}`);
      console.log('✅ [VehicleCard] Remove result:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-vehicles/check", vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-vehicles"] });
      toast({
        title: "Veículo removido",
        description: "Veículo removido dos seus salvos",
      });
    },
    onError: (error: any) => {
      console.error('❌ [VehicleCard] Remove error:', error);
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover o veículo",
        variant: "destructive",
      });
    },
  });

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = getToken();
    console.log(`🔖 [VehicleCard] Save toggle clicked for vehicle ${vehicle.id}, isSaved: ${isSaved}, hasToken: ${!!token}`);
    
    if (!token) {
      console.log('❌ [VehicleCard] No token, redirecting to login');
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para salvar veículos",
        variant: "destructive",
      });
      return;
    }

    if (isSaved) {
      console.log('🗑️ [VehicleCard] Removing from saved...');
      removeSavedVehicleMutation.mutate();
    } else {
      console.log('💾 [VehicleCard] Adding to saved...');
      saveVehicleMutation.mutate();
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(parseFloat(price));
  };

  const getStatusBadge = () => {
    if (!vehicle.isAvailable) {
      return (
        <Badge variant="secondary" className="bg-warning text-gray-800">
          Indisponível
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-success text-white">
        Disponível
      </Badge>
    );
  };

  const mainImage = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images[0] 
    : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300";

  const handleImageClick = (e: React.MouseEvent) => {
    console.log('Image clicked, navigating to vehicle:', vehicle.id);
    e.preventDefault();
    e.stopPropagation();
    navigate(`/vehicle/${vehicle.id}`);
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative cursor-pointer group" onClick={handleImageClick}>
        <img 
          src={mainImage}
          alt={`${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Ver mais overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-500 flex items-center justify-center pointer-events-none">
          <div className="bg-white bg-opacity-70 backdrop-blur-xs text-gray-700 px-2.5 py-1 rounded-md font-normal text-xs opacity-0 group-hover:opacity-90 transform translate-y-1 group-hover:translate-y-0 transition-all duration-500 shadow-sm">
            Ver mais detalhes
          </div>
        </div>
        <div className="absolute top-3 left-3 pointer-events-none">
          {getStatusBadge()}
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all p-0 z-10 pointer-events-auto"
            onClick={handleSaveToggle}
            disabled={saveVehicleMutation.isPending || removeSavedVehicleMutation.isPending}
            title={isSaved ? "Remover dos salvos" : "Salvar para depois"}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-blue-600 fill-blue-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-gray-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all p-0 z-10 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isVehicleInComparison(vehicle.id)) {
                removeVehicle(vehicle.id);
              } else if (vehicles.length < 3) {
                addVehicle(vehicle);
              }
            }}
            title={isVehicleInComparison(vehicle.id) ? "Remover da comparação" : "Adicionar à comparação"}
          >
            {isVehicleInComparison(vehicle.id) ? (
              <Check className="w-4 h-4 text-blue-600" />
            ) : (
              <Plus className="w-4 h-4 text-gray-600" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 bg-white bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all p-0 z-10 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-gray-600'}`} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">
            {vehicle.brand} {vehicle.model} {vehicle.year}
          </h3>
          <div className="flex items-center">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600 ml-1">{vehicle.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{vehicle.location}</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4 text-xs text-gray-500">
            <span>{vehicle.transmission}</span>
            <span>{vehicle.fuel}</span>
            <span>{vehicle.seats} lugares</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-800">
              {formatPrice(vehicle.pricePerDay)}
            </span>
            <span className="text-sm text-gray-600">/dia</span>
          </div>
          <Button 
            className={`${
              vehicle.isAvailable 
                ? 'bg-primary text-white hover:bg-red-600' 
                : 'bg-gray-400 text-white cursor-not-allowed'
            } transition-colors`}
            disabled={!vehicle.isAvailable}
            asChild={vehicle.isAvailable}
          >
            {vehicle.isAvailable ? (
              <Link href={`/vehicle/${vehicle.id}`}>
                Ver mais
              </Link>
            ) : (
              <span>Indisponível</span>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
