import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Star, Loader2, Calendar, AlertTriangle, Coins } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { getAuthHeaders } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/currency";
import type { AdminSettings } from "@shared/admin-settings";

interface BookingFormProps {
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    pricePerDay: string;
    rating: string;
    images?: string[];
    securityDepositValue?: string | number;
    securityDepositType?: string;
    owner: {
      id: number;
      name: string;
      rating: string;
    };
  };
}

export default function BookingForm({ vehicle }: BookingFormProps) {
  const [bookingData, setBookingData] = useState({
    startDate: '',
    endDate: '',
    includeInsurance: true, // Default to true, but user can uncheck
  });

  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin settings for dynamic fee calculation (public endpoint)
  const { data: adminSettings } = useQuery({
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

  // Fetch unavailable dates for the vehicle
  const { data: unavailableDates = [], isLoading: loadingDates } = useQuery({
    queryKey: ['/api/vehicles', vehicle.id, 'unavailable-dates'],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicle.id}/unavailable-dates`);
      if (!response.ok) {
        throw new Error('Failed to fetch unavailable dates');
      }
      const data = await response.json();
      return data as string[];
    },
  });

  // Check rental access (coins availability)
  const { data: rentalAccess, isLoading: loadingRentalAccess } = useQuery({
    queryKey: ['/api/coins/check-rental-access'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/coins/check-rental-access', {});
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/bookings', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação de reserva foi enviada para o proprietário.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao solicitar reserva",
        variant: "destructive",
      });
    },
  });

  // Mutation to deduct coins for rental request
  const deductCoinsMutation = useMutation({
    mutationFn: async ({ vehicleId, requestType }: { vehicleId: number; requestType: string }) => {
      const response = await apiRequest('POST', '/api/coins/deduct-rental', {
        vehicleId,
        requestType
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coins/check-rental-access'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coins/balance'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro com moedas",
        description: error.message || "Falha ao processar moedas",
        variant: "destructive",
      });
    },
  });

  // New mutation for "Rent Now" (immediate request without payment)
  const rentNowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/rent-now', data);
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Rent now success:', data);
      toast({
        title: "Solicitação enviada!",
        description: `${data.message} Emails foram enviados para você e o proprietário.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      // Redirect to profile/bookings page after successful request
      setTimeout(() => {
        window.location.href = '/profile?tab=bookings';
      }, 2000);
    },
    onError: (error: any) => {
      console.error('❌ Rent now error:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar solicitação",
        variant: "destructive",
      });
    },
  });

  const calculateDays = () => {
    if (!bookingData.startDate || !bookingData.endDate) return 0;
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculatePricing = () => {
    const days = calculateDays();
    const dailyRate = parseFloat(vehicle.pricePerDay);
    const subtotal = days * dailyRate;
    
    // Use dynamic rates from admin settings
    const serviceRate = (adminSettings?.serviceFeePercentage || 10) / 100; // Convert percentage to decimal
    const insuranceRate = (adminSettings?.insuranceFeePercentage || 15) / 100; // Convert percentage to decimal
    
    // Only apply service fee if enabled via feature toggle
    const serviceFee = adminSettings?.enableServiceFee ? subtotal * serviceRate : 0;
    const insuranceFee = bookingData.includeInsurance ? subtotal * insuranceRate : 0;
    
    // Calculate security deposit (caução)
    const securityDepositValue = parseFloat(String(vehicle.securityDepositValue || '20'));
    const securityDepositType = String(vehicle.securityDepositType || 'percentage');
    const securityDeposit = securityDepositType === 'percentage' 
      ? dailyRate * (securityDepositValue / 100)
      : securityDepositValue;
    
    // Conditional total calculation based on feature toggles
    const total = subtotal + 
      (adminSettings?.enableServiceFee ? serviceFee : 0) + 
      (adminSettings?.enableInsuranceOption && bookingData.includeInsurance ? insuranceFee : 0);

    console.log('💰 DEBUGGING PRICING CALCULATION:', {
      // Feature toggles
      enableServiceFee: adminSettings?.enableServiceFee,
      enableInsuranceOption: adminSettings?.enableInsuranceOption,
      
      // Raw admin settings
      serviceFeePercentage: adminSettings?.serviceFeePercentage,
      insuranceFeePercentage: adminSettings?.insuranceFeePercentage,
      
      // Vehicle data
      vehiclePricePerDay: vehicle.pricePerDay,
      securityDepositValue,
      securityDepositType,
      
      // Calculated values
      days,
      dailyRate,
      subtotal,
      serviceRate,
      serviceFee,
      insuranceRate, 
      insuranceFee,
      securityDeposit,
      
      // Final result
      total,
      
      // What should total be
      expectedTotal: subtotal + (adminSettings?.enableServiceFee ? serviceFee : 0) + (bookingData.includeInsurance ? insuranceFee : 0)
    });

    return {
      days,
      dailyRate,
      subtotal,
      serviceFee,
      insuranceFee,
      securityDeposit,
      total,
    };
  };

  const hasDateConflict = () => {
    if (!bookingData.startDate || !bookingData.endDate || unavailableDates.length === 0) {
      return false;
    }

    // Convert to date strings for comparison (YYYY-MM-DD format)
    const startDate = bookingData.startDate;
    const endDate = bookingData.endDate;
    
    // Check if any unavailable date falls within the selected range (inclusive)
    return unavailableDates.some(unavailableDate => {
      return unavailableDate >= startDate && unavailableDate <= endDate;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for date conflicts before proceeding
    if (hasDateConflict()) {
      toast({
        title: "Datas não disponíveis",
        description: "As datas selecionadas conflitam com reservas existentes. Escolha outras datas.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate date selection
    if (!bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Datas obrigatórias",
        description: "Selecione as datas de retirada e devolução.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para fazer uma reserva",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough coins for checkout
    if (!rentalAccess?.canProceed) {
      toast({
        title: "Moedas insuficientes",
        description: "Você precisa de 200 moedas para usar o checkout. Compre mais moedas para continuar.",
        variant: "destructive",
      });
      return;
    }

    // First deduct coins for checkout
    try {
      await deductCoinsMutation.mutateAsync({
        vehicleId: vehicle.id,
        requestType: 'checkout'
      });

      toast({
        title: "200 moedas debitadas",
        description: "Prosseguindo para o checkout...",
      });

      // Now proceed with checkout
      const pricing = calculatePricing();
      
      // Prepare checkout data
      const checkoutData = {
        vehicleId: vehicle.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalPrice: pricing.total.toFixed(2),
        serviceFee: pricing.serviceFee.toFixed(2),
        insuranceFee: pricing.insuranceFee.toFixed(2),
        securityDeposit: pricing.securityDeposit.toFixed(2),
        includeInsurance: bookingData.includeInsurance,
        vehicle: {
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          pricePerDay: vehicle.pricePerDay,
          securityDepositValue: vehicle.securityDepositValue || 20,
          securityDepositType: vehicle.securityDepositType || 'percentage',
          images: vehicle.images || []
        }
      };

      // Store data on server and redirect with checkoutId to avoid URL length issues
      const response = await apiRequest("POST", "/api/store-checkout-data", checkoutData);
      const result = await response.json();
      
      // Redirect to checkout with checkout ID
      window.location.href = `/checkout/${vehicle.id}?checkoutId=${result.checkoutId}`;
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar checkout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Handle "Rent Now" request (no payment, just request)
  const handleRentNow = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para solicitar um aluguel.",
        variant: "destructive",
      });
      return;
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Datas obrigatórias",
        description: "Selecione as datas de retirada e devolução.",
        variant: "destructive",
      });
      return;
    }

    if (hasDateConflict()) {
      toast({
        title: "Datas indisponíveis",
        description: "As datas selecionadas conflitam com reservas existentes.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough coins
    if (!rentalAccess?.canProceed) {
      toast({
        title: "Moedas insuficientes",
        description: "Você precisa de 200 moedas para fazer uma solicitação de aluguel. Compre mais moedas para continuar.",
        variant: "destructive",
      });
      return;
    }

    // First deduct coins for rent now request
    try {
      await deductCoinsMutation.mutateAsync({
        vehicleId: vehicle.id,
        requestType: 'rent_now'
      });

      toast({
        title: "200 moedas debitadas",
        description: "Enviando solicitação de aluguel...",
      });

      const pricing = calculatePricing();
      
      const requestData = {
        vehicleId: vehicle.id,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        totalPrice: pricing.total,
        serviceFee: pricing.serviceFee,
        insuranceFee: pricing.insuranceFee,
        securityDeposit: pricing.securityDeposit,
        includeInsurance: bookingData.includeInsurance,
      };
      
      rentNowMutation.mutate(requestData);
    } catch (error: any) {
      console.error("Error deducting coins for rent now:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar moedas para solicitação.",
        variant: "destructive",
      });
    }
  };

  const pricing = calculatePricing();

  return (
    <div className="space-y-6">
      {/* Pricing Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-gray-800" data-testid="text-price-per-day">
              {formatCurrency(parseFloat(vehicle.pricePerDay))}
            </span>
            <span className="text-gray-600">/dia</span>
            
            {/* Security Deposit Information */}
            <div className="text-sm text-gray-600 mt-2 border-t border-gray-200 pt-2">
              <div className="flex justify-between items-center">
                <span>Caução:</span>
                <span className="font-medium text-gray-800">
                  {(String(vehicle.securityDepositType) || 'percentage') === 'percentage' 
                    ? `${formatCurrency(parseFloat(vehicle.pricePerDay) * parseFloat(String(vehicle.securityDepositValue || '20')) / 100)} (${vehicle.securityDepositValue || 20}%)`
                    : `${formatCurrency(parseFloat(String(vehicle.securityDepositValue || '20')))} (valor fixo)`
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center text-sm text-gray-600 mb-4">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
            <span>{vehicle.rating}</span>
            <span className="mx-2">•</span>
            <span>23 avaliações</span>
          </div>
        </CardContent>
      </Card>

      {/* Booking Form */}
      <Card className="bg-white border border-gray-200" data-testid="booking-form">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Selection with Enhanced Validation */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Retirada</Label>
                <Input 
                  type="date" 
                  required
                  className={`h-12 text-sm ${hasDateConflict() ? 'border-red-500 bg-red-50' : ''}`}
                  value={bookingData.startDate}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, startDate: e.target.value }));
                    // Auto-validate on change
                    if (unavailableDates.includes(e.target.value)) {
                      toast({
                        title: "Data Indisponível",
                        description: "Esta data já está reservada. Escolha outra data.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="input-start-date"
                  min={new Date().toISOString().split('T')[0]}
                />
                {/* Show conflicting start date warning */}
                {bookingData.startDate && unavailableDates.includes(bookingData.startDate) && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Data não disponível - escolha outra
                  </p>
                )}
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Devolução</Label>
                <Input 
                  type="date" 
                  required
                  className={`h-12 text-sm ${hasDateConflict() ? 'border-red-500 bg-red-50' : ''}`}
                  value={bookingData.endDate}
                  onChange={(e) => {
                    setBookingData(prev => ({ ...prev, endDate: e.target.value }));
                    // Auto-validate on change
                    if (unavailableDates.includes(e.target.value)) {
                      toast({
                        title: "Data Indisponível",
                        description: "Esta data já está reservada. Escolha outra data.",
                        variant: "destructive",
                      });
                    }
                  }}
                  data-testid="input-end-date"
                  min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                />
                {/* Show conflicting end date warning */}
                {bookingData.endDate && unavailableDates.includes(bookingData.endDate) && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Data não disponível - escolha outra
                  </p>
                )}
              </div>
            </div>

            {/* Unavailable Dates Display */}
            {loadingDates && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm text-blue-700">Carregando datas indisponíveis...</span>
                </div>
              </div>
            )}

            {/* Available/Unavailable Dates Calendar Info - Always show if we have data */}
            {!loadingDates && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium mb-1">
                      📅 Calendário de Disponibilidade
                    </p>
                    {unavailableDates.length > 0 ? (
                      <>
                        <p className="text-blue-700">
                          Datas reservadas: {unavailableDates.length > 5 
                            ? `${unavailableDates.slice(0, 5).map(date => new Date(date).toLocaleDateString('pt-BR')).join(', ')} e mais ${unavailableDates.length - 5} datas`
                            : unavailableDates.map(date => new Date(date).toLocaleDateString('pt-BR')).join(', ')
                          }
                        </p>
                        <p className="text-blue-600 text-xs mt-1">
                          Escolha datas que não estão na lista acima para sua reserva.
                        </p>
                      </>
                    ) : (
                      <p className="text-blue-700">
                        🎉 Ótimas notícias! Este veículo não possui datas reservadas. Todas as datas estão disponíveis para locação.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Show unavailable dates - enhanced visual display */}
            {!loadingDates && unavailableDates.length > 0 && (
              <div className="border border-orange-300 bg-orange-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-orange-800 font-semibold mb-3">
                      📅 Datas já reservadas (indisponíveis):
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {unavailableDates.map((date, index) => {
                        const dateObj = new Date(date);
                        const formattedDate = dateObj.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        });
                        return (
                          <span key={index} className="bg-red-200 text-red-900 px-2 py-1.5 rounded-md text-center font-medium border border-red-300">
                            {formattedDate}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-orange-700 text-xs mt-2 italic">
                      ℹ️ Total: {unavailableDates.length} dia(s) indisponível(is)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date Conflict Warning */}
            {hasDateConflict() && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-red-800 font-medium mb-1">
                      ⚠️ Conflito de datas detectado!
                    </p>
                    <p className="text-red-700">
                      As datas selecionadas conflitam com reservas existentes. Por favor, escolha outras datas disponíveis.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insurance Option - Only show if enabled in admin settings */}
            {adminSettings?.enableInsuranceOption && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="insurance-option"
                    checked={bookingData.includeInsurance}
                    onChange={(e) => setBookingData(prev => ({ ...prev, includeInsurance: e.target.checked }))}
                    className="mt-1"
                    data-testid="checkbox-insurance"
                  />
                  <div className="flex-1">
                    <label htmlFor="insurance-option" className="font-medium text-gray-900 cursor-pointer">
                      Seguro de Cobertura Básica
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Protege contra danos, furto e roubo. Recomendamos contratar para sua segurança.
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {pricing.days > 0 
                        ? `+ ${formatCurrency(pricing.insuranceFee)}`
                        : `+ Calculado automaticamente (${adminSettings?.insuranceFeePercentage || 15}% do valor do aluguel)`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Breakdown */}
            {pricing.days > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(pricing.dailyRate)} x {pricing.days} dias
                  </span>
                  <span className="text-gray-800">{formatCurrency(pricing.subtotal)}</span>
                </div>
                {adminSettings?.enableServiceFee && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxa de serviço</span>
                    <span className="text-gray-800">{formatCurrency(pricing.serviceFee)}</span>
                  </div>
                )}
                {bookingData.includeInsurance && adminSettings?.enableInsuranceOption && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seguro</span>
                    <span className="text-gray-800">{formatCurrency(pricing.insuranceFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Caução {(vehicle.securityDepositType || 'percentage') === 'percentage' 
                      ? `(${vehicle.securityDepositValue || 20}%)`
                      : ''
                    }
                  </span>
                  <span className="text-gray-800">{formatCurrency(pricing.securityDeposit)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            
                {/* Coins requirement notice */}
                {user && !rentalAccess?.canProceed && !loadingRentalAccess && (
                  <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start gap-3">
                      <Coins className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-amber-800 font-medium mb-1">
                          💰 Moedas necessárias para alugar
                        </p>
                        <p className="text-amber-700">
                          Você precisa de 200 moedas para usar os botões de aluguel. 
                          <span className="font-medium"> Saldo atual: {rentalAccess?.availableCoins || 0} moedas</span>
                        </p>
                        <p className="text-amber-600 text-xs mt-1">
                          Compre mais moedas na área "Moedas" do seu perfil.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Action: Rent Now Request (No payment required) - Always visible */}
                <Button 
                  type="button"
                  variant="outline"
                  onClick={handleRentNow}
                  className={`w-full font-semibold transition-colors mb-3 ${
                    hasDateConflict() || (user && !rentalAccess?.canProceed)
                      ? 'border-gray-400 text-gray-400 cursor-not-allowed' 
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                  disabled={
                    rentNowMutation.isPending || 
                    deductCoinsMutation.isPending ||
                    !user || 
                    !bookingData.startDate || 
                    !bookingData.endDate || 
                    hasDateConflict() || 
                    (user && !rentalAccess?.canProceed)
                  }
                  data-testid="button-rent-now-request"
                >
                  {rentNowMutation.isPending || deductCoinsMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {deductCoinsMutation.isPending ? "Processando moedas..." : "Enviando solicitação..."}
                    </span>
                  ) : hasDateConflict() ? (
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Datas indisponíveis - Escolha outras datas
                    </span>
                  ) : (user && !rentalAccess?.canProceed) ? (
                    <span className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      Moedas insuficientes (200 necessárias)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <img src="/logo.png" alt="Alugaê" className="h-5 w-auto" />
                      {pricing.days > 0 && <span className="ml-2 font-normal">({formatCurrency(pricing.total)})</span>}
                    </span>
                  )}
                </Button>

                {/* Secondary Action: Immediate Checkout (With payment) - Only show if "Checkout Aluga Agora" toggle is active */}
                {adminSettings?.enableRentNowCheckout && (
                  <Button 
                    type="submit" 
                    variant="outline"
                    className={`w-full font-semibold transition-colors ${
                      hasDateConflict() || (user && !rentalAccess?.canProceed)
                        ? 'border-red-500 text-red-500 cursor-not-allowed' 
                        : 'border-primary text-primary hover:bg-primary hover:text-white'
                    }`}
                    disabled={
                      !user || 
                      !bookingData.startDate || 
                      !bookingData.endDate || 
                      hasDateConflict() || 
                      deductCoinsMutation.isPending ||
                      (user && !rentalAccess?.canProceed)
                    }
                    data-testid="button-book-now"
                  >
                    {deductCoinsMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processando moedas...
                      </span>
                    ) : hasDateConflict() ? (
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Datas indisponíveis
                      </span>
                    ) : (user && !rentalAccess?.canProceed) ? (
                      <span className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Moedas insuficientes (200 necessárias)
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        💳 Pagar Agora (200 moedas)
                        {pricing.days > 0 && <span className="ml-2 font-normal">({formatCurrency(pricing.total)})</span>}
                      </span>
                    )}
                  </Button>
                )}
                
                {adminSettings?.enableRentNowCheckout && (
                  <div className="text-xs text-gray-500 space-y-1 mt-3">
                    <p className="text-center font-medium text-blue-700">
                      💳 <strong>Pagar Agora:</strong> Pagamento imediato e confirmação automática (+ 200 moedas)
                    </p>
                    <p className="text-center font-medium text-green-700 flex items-center justify-center gap-1">
                      <img src="/logo.png" alt="Alugaê" className="h-4 w-auto" />
                      <strong>Alugaê:</strong> Solicitação ao proprietário via email (+ 200 moedas)
                    </p>
                    {!user && (
                      <p className="text-center text-amber-600 font-medium">
                        ⚠️ Você precisa estar logado para usar essas opções
                      </p>
                    )}
                  </div>
                )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
