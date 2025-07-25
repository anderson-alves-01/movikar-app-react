import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface BookingFormProps {
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    pricePerDay: string;
    rating: string;
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
  });

  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const serviceRate = 0.09; // 9% service fee
    const insuranceRate = 0.075; // 7.5% insurance fee
    
    const serviceFee = subtotal * serviceRate;
    const insuranceFee = subtotal * insuranceRate;
    const total = subtotal + serviceFee + insuranceFee;

    return {
      days,
      dailyRate,
      subtotal,
      serviceFee,
      insuranceFee,
      total,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    
    bookingMutation.mutate({
      vehicleId: vehicle.id,
      ownerId: vehicle.owner.id,
      startDate: new Date(bookingData.startDate),
      endDate: new Date(bookingData.endDate),
      totalPrice: pricing.total,
      servicefee: pricing.serviceFee,
      insuranceFee: pricing.insuranceFee,
    });
  };

  const pricing = calculatePricing();



  return (
    <div className="space-y-6">
      {/* Pricing Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <span className="text-3xl font-bold text-gray-800">
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
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Selection */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Retirada</Label>
                <Input 
                  type="datetime-local" 
                  required
                  value={bookingData.startDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Devolução</Label>
                <Input 
                  type="datetime-local" 
                  required
                  value={bookingData.endDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, endDate: e.target.value }))}
                />
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Seguro</span>
                  <span className="text-gray-800">{formatCurrency(pricing.insuranceFee)}</span>
                </div>
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
              disabled={bookingMutation.isPending || !user}
            >
              {bookingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                'Solicitar Reserva'
              )}
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              {user 
                ? "Você não será cobrado ainda. A reserva precisa ser aprovada pelo proprietário."
                : "Você precisa estar logado para fazer uma reserva."
              }
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
