import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Calendar, 
  Car, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter,
  Plus
} from 'lucide-react';
import { Loading } from '@/components/ui/loading';
import Header from '@/components/header';
import { apiRequest } from "@/lib/queryClient";
import type { AdminSettings } from "@shared/admin-settings";

interface Inspection {
  id: number;
  reservationId: number;
  vehicleCondition: string;
  approved: boolean;
  completedAt: string;
  observations: string;
  mileage: number;
  fuelLevel: number;
  reservation: {
    id: number;
    renterName: string;
    startDate: string;
    endDate: string;
    status: string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
      licensePlate: string;
    };
  };
}

interface Reservation {
  id: number;
  renterName: string;
  startDate: string;
  endDate: string;
  status: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
}

export default function InspectionHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Fetch feature toggles (public endpoint)
  const { data: featureToggles } = useQuery({
    queryKey: ['/api/public/feature-toggles'],
    queryFn: async () => {
      const response = await fetch('/api/public/feature-toggles');
      if (!response.ok) {
        throw new Error('Failed to fetch feature toggles');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false
  });

  // Buscar vistorias concluídas
  const { data: inspections, isLoading: loadingInspections } = useQuery<Inspection[]>({
    queryKey: ['/api/inspections'],
  });

  // Buscar reservas pendentes de vistoria
  const { data: pendingReservations, isLoading: loadingPending } = useQuery<Reservation[]>({
    queryKey: ['/api/reservations/pending-inspection'],
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprovado':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'reprovado':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'aguardando_vistoria':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (approved: boolean) => {
    return approved ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const filteredInspections = inspections?.filter(inspection => {
    const matchesSearch = 
      inspection.reservation.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.reservation.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.reservation.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.reservation.renterName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'completed' && inspection.approved) ||
      (statusFilter === 'pending' && !inspection.approved);

    return matchesSearch && matchesStatus;
  }) || [];

  const filteredPending = pendingReservations?.filter(reservation => {
    const matchesSearch = 
      reservation.vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.renterName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  }) || [];

  if (loadingInspections && loadingPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Loading variant="car" className="mx-auto mb-4" />
            <p>Carregando histórico de vistorias...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="h-6 w-6 text-blue-600" />
            Vistorias de Veículos
          </h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por veículo, placa ou locatário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-inspections"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'completed' : 'all')}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {statusFilter === 'all' ? 'Todos' : 'Aprovados'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-auto">
          <TabsTrigger value="pending" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1.5">
            <Clock className="h-4 w-4" />
            <span className="block sm:hidden">Pendentes ({filteredPending.length})</span>
            <span className="hidden sm:block">Pendentes ({filteredPending.length})</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2 text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span className="block sm:hidden">Concluídas ({filteredInspections.length})</span>
            <span className="hidden sm:block">Concluídas ({filteredInspections.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Vistorias Pendentes */}
        <TabsContent value="pending">
          <div className="space-y-4">
            {filteredPending.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma vistoria pendente
                  </h3>
                  <p className="text-gray-600">
                    Todas as reservas já foram vistoriadas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPending.map((reservation) => (
                <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Car className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">
                            {reservation.vehicle.brand} {reservation.vehicle.model} ({reservation.vehicle.year})
                          </h3>
                          <Badge variant="outline">
                            {reservation.vehicle.licensePlate}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Locatário:</span> {reservation.renterName}
                          </div>
                          <div>
                            <span className="font-medium">Período:</span>{' '}
                            {new Date(reservation.startDate).toLocaleDateString()} -{' '}
                            {new Date(reservation.endDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Reserva:</span> #{reservation.id}
                          </div>
                        </div>

                        <div className="mt-3">
                          <Badge className={getStatusColor('aguardando_vistoria')}>
                            Aguardando Vistoria
                          </Badge>
                        </div>
                      </div>

                      {featureToggles?.enableRentNowCheckout && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.location.href = `/inspection/${reservation.id}`}
                            className="flex items-center gap-2"
                            data-testid={`button-start-inspection-${reservation.id}`}
                          >
                            <Plus className="h-4 w-4" />
                            Realizar Vistoria
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Vistorias Concluídas */}
        <TabsContent value="completed">
          <div className="space-y-4">
            {filteredInspections.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma vistoria concluída
                  </h3>
                  <p className="text-gray-600">
                    As vistorias concluídas aparecerão aqui.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredInspections.map((inspection) => (
                <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Car className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">
                            {inspection.reservation.vehicle.brand} {inspection.reservation.vehicle.model} ({inspection.reservation.vehicle.year})
                          </h3>
                          <Badge variant="outline">
                            {inspection.reservation.vehicle.licensePlate}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Locatário:</span> {inspection.reservation.renterName}
                          </div>
                          <div>
                            <span className="font-medium">Quilometragem:</span> {inspection.mileage?.toLocaleString()} km
                          </div>
                          <div>
                            <span className="font-medium">Combustível:</span> {inspection.fuelLevel}%
                          </div>
                          <div>
                            <span className="font-medium">Vistoriado em:</span>{' '}
                            {new Date(inspection.completedAt).toLocaleDateString()}
                          </div>
                        </div>

                        {inspection.observations && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-sm">Observações:</span>
                            <p className="text-sm text-gray-700 mt-1">{inspection.observations}</p>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-2">
                          {getStatusIcon(inspection.approved)}
                          <Badge className={getStatusColor(inspection.approved ? 'approved' : 'rejected')}>
                            {inspection.approved ? 'Aprovado' : 'Reprovado'}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            {inspection.vehicleCondition}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => window.location.href = `/inspection/${inspection.reservationId}`}
                          className="flex items-center gap-2"
                          data-testid={`button-view-inspection-${inspection.id}`}
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}