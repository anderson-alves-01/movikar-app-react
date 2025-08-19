import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, User, Car, Clock, MessageSquare } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";

interface PendingBooking {
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
    ownerId: number;
  };
  renter: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    rating: string;
  };
}

interface ReviewForm {
  bookingId: number;
  revieweeId: number;
  vehicleId?: number;
  rating: number;
  comment: string;
  type: 'renter_to_owner' | 'owner_to_renter';
}

function StarRating({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="text-2xl transition-colors"
          data-testid={`star-rating-${star}`}
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
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
  booking: PendingBooking; 
  isOwner: boolean; 
  onClose: () => void;
  onSubmit: (data: ReviewForm) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    const reviewData: ReviewForm = {
      bookingId: booking.id,
      revieweeId: isOwner ? booking.renterId : booking.ownerId,
      vehicleId: !isOwner ? booking.vehicleId : undefined, // Apenas locatários avaliam veículos
      rating,
      comment,
      type: isOwner ? 'owner_to_renter' : 'renter_to_owner'
    };
    
    onSubmit(reviewData);
  };

  const revieweeName = isOwner ? booking.renter.name : 'Proprietário';
  const vehicleInfo = `${booking.vehicle.brand} ${booking.vehicle.model} ${booking.vehicle.year}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliar {isOwner ? 'Locatário' : 'Locação'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              {vehicleInfo}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {revieweeName}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="text-center">
              <label className="block text-sm font-medium mb-2">
                {isOwner ? 'Como foi sua experiência com este locatário?' : 'Como foi sua experiência com este veículo e proprietário?'}
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
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-review"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              data-testid="button-submit-review"
            >
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
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(null);

  const { data: user } = useQuery<{ id: number; name: string; email: string }>({
    queryKey: ["/api/auth/user"],
  });

  // Tentativa com endpoint principal primeiro, fallback para alternativo
  const { data: pendingReviews, isLoading, error } = useQuery<PendingBooking[]>({
    queryKey: ["/api/bookings/pending-reviews"],
    enabled: !!user,
    retry: false,
    meta: {
      errorBoundary: false
    }
  });

  // Fallback query para endpoint alternativo se o principal falhar
  const { data: fallbackReviews } = useQuery<PendingBooking[]>({
    queryKey: ["/api/reviews/pending"], 
    enabled: !!user && !!error,
    retry: false
  });

  // Usar dados do fallback se o endpoint principal falhou
  const reviewsData = error ? fallbackReviews : pendingReviews;

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewForm) => {
      return apiRequest("POST", "/api/reviews", reviewData);
    },
    onSuccess: () => {
      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi registrada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/pending-reviews"] });
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

  const handleSubmitReview = (reviewData: ReviewForm) => {
    createReviewMutation.mutate(reviewData);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="pt-20 pb-8"> {/* Adiciona padding-top para compensar header fixo */}
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
      <div className="pt-20 pb-8"> {/* Adiciona padding-top para compensar header fixo */}
        <div className="container mx-auto px-4">
      <div className="flex items-center gap-3 mb-8">
        <Star className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Avaliações Pendentes</h1>
          <p className="text-muted-foreground">
            Avalie suas experiências de aluguel recentes
          </p>
        </div>
      </div>

      {!reviewsData || (Array.isArray(reviewsData) && reviewsData.length === 0) ? (
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
          {Array.isArray(reviewsData) ? reviewsData.map((booking: PendingBooking) => {
            const isOwner = booking.ownerId === user?.id;
            const isRenter = booking.renterId === user?.id;
            
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
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Car className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {booking.vehicle.brand} {booking.vehicle.model} {booking.vehicle.year}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isOwner ? `Locatário: ${booking.renter.name}` : `Proprietário`}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.startDate), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(booking.endDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            Finalizado
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            R$ {parseFloat(booking.totalPrice).toFixed(2)}
                          </span>
                        </div>
                        
                        <Button
                          onClick={() => setSelectedBooking(booking)}
                          className="flex items-center gap-2"
                          data-testid={`button-review-${booking.id}`}
                        >
                          <Star className="h-4 w-4" />
                          Avaliar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : null}
        </div>
      )}

      {selectedBooking && (
        <ReviewModal
          booking={selectedBooking}
          isOwner={selectedBooking?.ownerId === user?.id}
          onClose={() => setSelectedBooking(null)}
          onSubmit={handleSubmitReview}
        />
      )}
        </div>
      </div>
    </>
  );
}