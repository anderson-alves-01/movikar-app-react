import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, User, Car, Clock, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/header";

interface CompletedBooking {
  id: number;
  vehicleId: number;
  renterId: number;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalPrice: string;
  status: string;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    year: number;
    images: string[];
    licensePlate: string;
  };
  renter: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  owner: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface ReviewForm {
  bookingId: number;
  revieweeId: number;
  vehicleId?: number;
  rating: number;
  comment: string;
  type: 'renter_to_owner' | 'owner_to_renter' | 'renter_to_vehicle';
}

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="text-2xl transition-colors hover:scale-110"
          data-testid={`star-rating-${star}`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300 hover:text-yellow-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewModal({ 
  booking, 
  isOwner, 
  onClose, 
  onSubmit 
}: { 
  booking: CompletedBooking; 
  isOwner: boolean; 
  onClose: () => void;
  onSubmit: (data: ReviewForm | ReviewForm[]) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewType, setReviewType] = useState<'person' | 'vehicle' | 'both'>('person');

  const handleSubmit = () => {
    if (isOwner) {
      // Proprietário avalia o locatário
      const reviewData: ReviewForm = {
        bookingId: booking.id,
        revieweeId: booking.renterId,
        rating,
        comment,
        type: 'owner_to_renter'
      };
      onSubmit(reviewData);
    } else if (reviewType === 'both') {
      // Avaliação dupla - proprietário e veículo
      const ownerReview: ReviewForm = {
        bookingId: booking.id,
        revieweeId: booking.ownerId,
        rating,
        comment,
        type: 'renter_to_owner'
      };
      
      const vehicleReview: ReviewForm = {
        bookingId: booking.id,
        revieweeId: booking.ownerId,
        vehicleId: booking.vehicleId,
        rating,
        comment,
        type: 'renter_to_vehicle'
      };
      
      // Enviar as duas avaliações como array
      onSubmit([ownerReview, vehicleReview]);
    } else {
      // Avaliação simples - proprietário ou veículo
      const reviewData: ReviewForm = {
        bookingId: booking.id,
        revieweeId: booking.ownerId,
        vehicleId: reviewType === 'vehicle' ? booking.vehicleId : undefined,
        rating,
        comment,
        type: reviewType === 'person' ? 'renter_to_owner' : 'renter_to_vehicle'
      };
      onSubmit(reviewData);
    }
  };

  const vehicleInfo = `${booking.vehicle.brand} ${booking.vehicle.model} ${booking.vehicle.year}`;
  const revieweeName = isOwner ? booking.renter.name : booking.owner.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Nova Avaliação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Car className="h-4 w-4" />
              {vehicleInfo}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Clock className="h-4 w-4" />
              {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          <Separator />

          {!isOwner && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Avaliar:</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={reviewType === 'person' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReviewType('person')}
                  data-testid="review-type-person"
                >
                  <User className="h-4 w-4 mr-1" />
                  Proprietário
                </Button>
                <Button
                  variant={reviewType === 'vehicle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReviewType('vehicle')}
                  data-testid="review-type-vehicle"
                >
                  <Car className="h-4 w-4 mr-1" />
                  Veículo
                </Button>
                <Button
                  variant={reviewType === 'both' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReviewType('both')}
                  data-testid="review-type-both"
                  className={reviewType === 'both' 
                    ? "bg-gradient-to-r from-blue-500 to-green-500 text-white border-0 hover:from-blue-600 hover:to-green-600" 
                    : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50"
                  }
                >
                  <Star className="h-4 w-4 mr-1" />
                  Ambos
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-center">
              <label className="block text-sm font-medium mb-2">
                {isOwner 
                  ? `Como foi sua experiência com ${booking.renter.name}?`
                  : reviewType === 'person'
                    ? `Como foi sua experiência com ${revieweeName}?`
                    : reviewType === 'vehicle'
                      ? `Como foi sua experiência com este veículo?`
                      : `Como foi sua experiência geral?`
                }
              </label>
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comentário (opcional)
              </label>
              <Textarea
                placeholder="Conte como foi sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                data-testid="review-comment"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} className="flex-1" data-testid="submit-review">
              Enviar Avaliação
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Reviews() {
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);

  const { data: user } = useQuery<{ id: number; name: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Buscar reservas completadas que podem ser avaliadas
  const { data: completedBookings, isLoading } = useQuery<CompletedBooking[]>({
    queryKey: ["/api/reviews/completed-bookings"],
    enabled: !!user,
  });

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewForm | ReviewForm[]) => {
      // Se for array (avaliação dupla), envia as duas separadamente
      if (Array.isArray(reviewData)) {
        const results = [];
        for (const review of reviewData) {
          const result = await apiRequest("POST", "/api/reviews", review);
          results.push(result);
        }
        return results;
      } else {
        // Avaliação simples
        return apiRequest("POST", "/api/reviews", reviewData);
      }
    },
    onSuccess: (data) => {
      const count = Array.isArray(data) ? data.length : 1;
      toast({
        title: count > 1 ? "Avaliações enviadas" : "Avaliação enviada",
        description: count > 1 
          ? "Suas avaliações do proprietário e veículo foram registradas com sucesso!"
          : "Sua avaliação foi registrada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/completed-bookings"] });
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message || "Não foi possível enviar sua avaliação",
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (reviewData: ReviewForm | ReviewForm[]) => {
    createReviewMutation.mutate(reviewData);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="pt-20 pb-8">
          <div className="container mx-auto px-4">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold">Avaliações</h1>
              <p className="text-muted-foreground">
                Avalie suas experiências de aluguel recentes
              </p>
            </div>
          </div>

          {!completedBookings || completedBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma avaliação pendente</h3>
                <p className="text-muted-foreground">
                  Você não tem reservas finalizadas esperando avaliação no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {completedBookings.map((booking) => {
                const isOwner = booking.ownerId === user?.id;
                
                return (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                              {booking.vehicle.images?.[0] ? (
                                <img
                                  src={booking.vehicle.images[0]}
                                  alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Car className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {isOwner ? `Locatário: ${booking.renter.name}` : `Proprietário: ${booking.owner.name}`}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Concluída
                            </Badge>
                            <div className="text-lg font-semibold text-green-600">
                              R$ {parseFloat(booking.totalPrice).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => setSelectedBooking(booking)}
                          className="shrink-0"
                          data-testid={`review-booking-${booking.id}`}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Avaliar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          isOwner={selectedBooking.ownerId === user?.id}
          onClose={() => setSelectedBooking(null)}
          onSubmit={handleSubmitReview}
        />
      )}
    </>
  );
}