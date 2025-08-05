import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Star, Loader2 } from "lucide-react";
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

  // Fetch admin settings for dynamic fee calculation
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings');
      const data = await response.json();
      return data as AdminSettings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
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
    
    const serviceFee = subtotal * serviceRate;
    const insuranceFee = bookingData.includeInsurance ? subtotal * insuranceRate : 0;
    const total = subtotal + serviceFee + insuranceFee;

    console.log('💰 Calculating pricing with admin settings:', {
      serviceFeePercentage: adminSettings?.serviceFeePercentage,
      insuranceFeePercentage: adminSettings?.insuranceFeePercentage,
      serviceRate,
      insuranceRate,
      subtotal,
      serviceFee,
      insuranceFee,
      total
    });

    return {
      days,
      dailyRate,
      subtotal,
      serviceFee,
      insuranceFee,
      total,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para fazer uma reserva",
        variant: "destructive",
      });
      return;
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      toast({
        title: "Datas obrigatórias",
        description: "Selecione as datas de retirada e devolução",
        variant: "destructive",
      });
      return;
    }

    const pricing = calculatePricing();
    
    // Prepare checkout data
    const checkoutData = {
      vehicleId: vehicle.id,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalPrice: pricing.total.toFixed(2),
      serviceFee: pricing.serviceFee.toFixed(2),
      insuranceFee: pricing.insuranceFee.toFixed(2),
      includeInsurance: bookingData.includeInsurance,
      vehicle: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        pricePerDay: vehicle.pricePerDay,
        images: vehicle.images || []
      }
    };

    // Store data on server and redirect with checkoutId to avoid URL length issues
    try {
      const response = await apiRequest("POST", "/api/store-checkout-data", checkoutData);
      const result = await response.json();
      
      // Redirect to checkout with checkout ID
      window.location.href = `/checkout/${vehicle.id}?checkoutId=${result.checkoutId}`;
    } catch (error) {
      console.error("Error storing checkout data:", error);
      toast({
        title: "Erro",
        description: "Erro ao preparar checkout. Tente novamente.",
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
            {/* Date Selection */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Retirada</Label>
                <Input 
                  type="date" 
                  required
                  className="h-12 text-sm"
                  value={bookingData.startDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Devolução</Label>
                <Input 
                  type="date" 
                  required
                  className="h-12 text-sm"
                  value={bookingData.endDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* Insurance Option */}
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
                      ? `+ ${formatCurrency(pricing.subtotal * ((adminSettings?.insuranceFeePercentage || 15) / 100))}`
                      : '+ Calculado automaticamente (15% do valor do aluguel)'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            {pricing.days > 0 && (
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(pricing.dailyRate)} x {pricing.days} dias
                  </span>
                  <span className="text-gray-800">{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxa de serviço</span>
                  <span className="text-gray-800">{formatCurrency(pricing.serviceFee)}</span>
                </div>
                {bookingData.includeInsurance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seguro</span>
                    <span className="text-gray-800">{formatCurrency(pricing.insuranceFee)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors"
              disabled={!user || !bookingData.startDate || !bookingData.endDate}
              data-testid="button-book-now"
            >
              Alugar Agora
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              {user 
                ? "Você será redirecionado para finalizar o pagamento de forma segura."
                : "Você precisa estar logado para fazer uma reserva."
              }
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
