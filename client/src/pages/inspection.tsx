import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VehicleInspectionFormV3 as VehicleInspectionForm } from "@/components/vehicle-inspection-form";
import { ArrowLeft, Car, Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { BookingWithDetails, VehicleInspection } from "@shared/schema";
import Header from "@/components/header";

export default function InspectionPage() {
  const [, setLocation] = useLocation();
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  
  // Capturar bookingId da URL path (ex: /inspection/123)
  const pathBookingId = window.location.pathname.split('/').pop();
  
  useEffect(() => {
    if (pathBookingId && !isNaN(parseInt(pathBookingId))) {
      setSelectedBookingId(parseInt(pathBookingId));
      setShowInspectionForm(true);
    }
  }, [pathBookingId]);

  // Buscar reservas do usuário que precisam de vistoria
  const { data: bookings, isLoading: loadingBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/bookings"],
    queryFn: () => fetch("/api/bookings?type=renter", { credentials: 'include' }).then(res => res.json()),
  });

  // Buscar reserva específica quando temos um bookingId
  const { data: specificBooking, isLoading: loadingSpecific } = useQuery<BookingWithDetails>({
    queryKey: ["/api/bookings", selectedBookingId],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${selectedBookingId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Reserva não encontrada');
      return response.json();
    },
    enabled: !!selectedBookingId,
  });

  // Se temos um bookingId específico e a reserva foi carregada, mostrar o formulário
  if (selectedBookingId && specificBooking && showInspectionForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBookingId(null);
                  setShowInspectionForm(false);
                  setLocation('/reservations');
                }}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Reservas
              </Button>
            </div>

            <VehicleInspectionForm
              booking={specificBooking}
              onInspectionComplete={(inspection) => {
                console.log("Vistoria concluída:", inspection);
                setLocation('/reservations');
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (loadingSpecific || (selectedBookingId && !specificBooking)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="text-lg text-gray-600">Carregando vistoria...</div>
          </div>
        </div>
      </div>
    );
  };

  // Buscar vistorias existentes
  const { data: inspections, isLoading: loadingInspections } = useQuery<VehicleInspection[]>({
    queryKey: ["/api/inspections/renter"],
    queryFn: () => fetch("/api/inspections/renter", { credentials: 'include' }).then(res => res.json()),
  });

  // Filtrar reservas que precisam de vistoria (pagas e confirmadas, mas sem vistoria)
  const bookingsNeedingInspection = bookings?.filter(booking => 
    booking.paymentStatus === 'paid' && 
    booking.status === 'confirmed' &&
    !inspections?.find(inspection => inspection.bookingId === booking.id)
  ) || [];

  // Buscar reserva específica se ID foi fornecido
  const selectedBooking = selectedBookingId 
    ? bookings?.find(b => b.id === selectedBookingId)
    : null;

  const getStatusBadge = (booking: BookingWithDetails) => {
    const inspection = inspections?.find(i => i.bookingId === booking.id);
    
    if (inspection) {
      if (inspection.approvalDecision === true) {
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovada</Badge>;
      } else if (inspection.approvalDecision === false) {
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Reprovada</Badge>;
      } else {
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      }
    }

    if (booking.paymentStatus === 'paid' && booking.status === 'confirmed') {
      return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Precisa Vistoria</Badge>;
    }

    return <Badge variant="outline">{booking.status}</Badge>;
  };

  if (showInspectionForm && selectedBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-white border-b px-4 py-3">
          <Button
            variant="ghost"
            onClick={() => {
              setShowInspectionForm(false);
              setSelectedBookingId(null);
              setLocation("/inspection");
            }}
            className="mb-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Vistorias
          </Button>
        </div>

        <VehicleInspectionForm
          booking={selectedBooking}
          onInspectionComplete={() => {
            setShowInspectionForm(false);
            setSelectedBookingId(null);
            setLocation("/inspection");
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                onClick={() => setLocation('/reservations')}
                variant="ghost" 
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Reservas
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Vistorias de Veículos</h1>
              <p className="text-gray-600">Gerencie as vistorias dos seus aluguéis</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingBookings || loadingInspections ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Carregando vistorias...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Reservas que precisam de vistoria */}
            {bookingsNeedingInspection.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Vistorias Pendentes ({bookingsNeedingInspection.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookingsNeedingInspection.map((booking) => (
                    <Card key={booking.id} className="hover:shadow-md transition-shadow border-orange-200">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Car className="h-5 w-5" />
                            {booking.vehicle?.brand} {booking.vehicle?.model}
                          </CardTitle>
                          {getStatusBadge(booking)}
                        </div>
                        <p className="text-sm text-gray-600">Placa: {booking.vehicle?.licensePlate}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          {booking.vehicle?.location}
                        </div>

                        <div className="pt-2">
                          <Button 
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => {
                              setSelectedBookingId(booking.id);
                              setShowInspectionForm(true);
                            }}
                            data-testid={`button-inspect-${booking.id}`}
                          >
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Fazer Vistoria
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Todas as reservas com suas vistorias */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Histórico de Vistorias
              </h2>
              
              {bookings && bookings.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {bookings
                    .filter(booking => booking.paymentStatus === 'paid' || 
                            inspections?.find(i => i.bookingId === booking.id))
                    .map((booking) => {
                      const inspection = inspections?.find(i => i.bookingId === booking.id);
                      
                      return (
                        <Card key={booking.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Car className="h-5 w-5" />
                                {booking.vehicle?.brand} {booking.vehicle?.model}
                              </CardTitle>
                              {getStatusBadge(booking)}
                            </div>
                            <p className="text-sm text-gray-600">Placa: {booking.vehicle?.licensePlate}</p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {booking.vehicle?.location}
                            </div>

                            {inspection && (
                              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                                <p><strong>Vistoria realizada em:</strong> {new Date(inspection.inspectedAt!).toLocaleDateString()}</p>
                                <p><strong>Quilometragem:</strong> {inspection.mileage.toLocaleString()} km</p>
                                <p><strong>Condição:</strong> {
                                  inspection.vehicleCondition === 'excellent' ? 'Excelente' :
                                  inspection.vehicleCondition === 'good' ? 'Bom' :
                                  inspection.vehicleCondition === 'fair' ? 'Regular' : 'Ruim'
                                }</p>
                                {inspection.approvalDecision === false && inspection.rejectionReason && (
                                  <p className="text-red-600 mt-2"><strong>Motivo da reprovação:</strong> {inspection.rejectionReason}</p>
                                )}
                              </div>
                            )}

                            {!inspection && booking.paymentStatus === 'paid' && booking.status === 'confirmed' && (
                              <div className="pt-2">
                                <Button 
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedBookingId(booking.id);
                                    setShowInspectionForm(true);
                                  }}
                                  data-testid={`button-inspect-history-${booking.id}`}
                                >
                                  <AlertTriangle className="h-4 w-4 mr-2" />
                                  Fazer Vistoria
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vistoria encontrada</h3>
                    <p className="text-gray-500">
                      Quando você alugar um veículo, as vistorias aparecerão aqui.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}