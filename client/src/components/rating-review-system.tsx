import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  User,
  Calendar,
  Award,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RatingReviewSystemProps {
  bookingId?: number;
  vehicleId?: number;
  userId?: number;
  trigger?: React.ReactNode;
  type?: 'create' | 'view';
}

interface Review {
  id: number;
  bookingId: number;
  reviewerId: number;
  revieweeId: number;
  vehicleId: number;
  rating: number;
  comment: string;
  type: 'renter_to_owner' | 'owner_to_renter' | 'vehicle_review';
  createdAt: string;
  reviewer?: {
    id: number;
    name: string;
    avatar?: string;
  };
  responses?: ReviewResponse[];
}

interface ReviewResponse {
  id: number;
  reviewId: number;
  responderId: number;
  response: string;
  createdAt: string;
  responder?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

const RATING_DESCRIPTIONS = {
  1: { text: 'Muito Ruim', color: 'text-red-500' },
  2: { text: 'Ruim', color: 'text-orange-500' },
  3: { text: 'Regular', color: 'text-yellow-500' },
  4: { text: 'Bom', color: 'text-blue-500' },
  5: { text: 'Excelente', color: 'text-green-500' },
};

const REVIEW_TYPES = {
  'renter_to_owner': 'Avaliação do Proprietário',
  'owner_to_renter': 'Avaliação do Locatário',
  'vehicle_review': 'Avaliação do Veículo',
};

export default function RatingReviewSystem({
  bookingId,
  vehicleId,
  userId,
  trigger,
  type = 'view',
}: RatingReviewSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewType, setReviewType] = useState<'renter_to_owner' | 'owner_to_renter' | 'vehicle_review'>('vehicle_review');
  const [responseText, setResponseText] = useState('');
  const [respondingToReview, setRespondingToReview] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reviews based on context
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['/api/reviews', { bookingId, vehicleId, userId }],
    enabled: isOpen,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: (reviewData: {
      bookingId?: number;
      vehicleId?: number;
      revieweeId?: number;
      rating: number;
      comment: string;
      type: string;
    }) => apiRequest('POST', '/api/reviews', reviewData),
    onSuccess: () => {
      toast({
        title: "Avaliação Enviada",
        description: "Sua avaliação foi registrada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      resetForm();
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Enviar Avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create response mutation
  const createResponseMutation = useMutation({
    mutationFn: (responseData: { reviewId: number; response: string }) =>
      apiRequest('POST', `/api/reviews/${responseData.reviewId}/responses`, {
        response: responseData.response,
      }),
    onSuccess: () => {
      toast({
        title: "Resposta Enviada",
        description: "Sua resposta foi registrada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      setResponseText('');
      setRespondingToReview(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Enviar Resposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedRating(0);
    setHoverRating(0);
    setComment('');
    setReviewType('vehicle_review');
  };

  const handleSubmitReview = () => {
    if (selectedRating === 0) {
      toast({
        title: "Avaliação Obrigatória",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive",
      });
      return;
    }

    createReviewMutation.mutate({
      bookingId,
      vehicleId,
      revieweeId: userId,
      rating: selectedRating,
      comment: comment.trim(),
      type: reviewType,
    });
  };

  const handleSubmitResponse = (reviewId: number) => {
    if (!responseText.trim()) {
      toast({
        title: "Resposta Obrigatória",
        description: "Por favor, escreva uma resposta.",
        variant: "destructive",
      });
      return;
    }

    createResponseMutation.mutate({
      reviewId,
      response: responseText.trim(),
    });
  };

  const renderStars = (rating: number, interactive = false, size = 'h-5 w-5') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} cursor-pointer transition-colors ${
              star <= (interactive ? (hoverRating || selectedRating) : rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            data-testid={`star-${star}`}
          />
        ))}
      </div>
    );
  };

  const getRatingStats = (reviews: Review[]) => {
    if (reviews.length === 0) return { average: 0, distribution: {} };
    
    const ratings = reviews.map(r => r.rating);
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    const distribution = ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { average, distribution };
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" data-testid="button-open-reviews">
      <Star className="h-4 w-4 mr-2" />
      {type === 'create' ? 'Avaliar' : 'Ver Avaliações'}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>
              {type === 'create' ? 'Nova Avaliação' : 'Avaliações e Reviews'}
            </span>
          </DialogTitle>
          <DialogDescription>
            {type === 'create' 
              ? 'Compartilhe sua experiência para ajudar outros usuários'
              : 'Veja o que outros usuários estão falando'
            }
          </DialogDescription>
        </DialogHeader>

        {type === 'create' ? (
          /* Create Review Form */
          <div className="space-y-6">
            {bookingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Avaliação
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={reviewType}
                  onChange={(e) => setReviewType(e.target.value as any)}
                  data-testid="select-review-type"
                >
                  <option value="vehicle_review">Avaliar Veículo</option>
                  <option value="renter_to_owner">Avaliar Proprietário</option>
                  <option value="owner_to_renter">Avaliar Locatário</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sua Avaliação *
              </label>
              <div className="flex items-center space-x-4">
                {renderStars(selectedRating, true, 'h-8 w-8')}
                {selectedRating > 0 && (
                  <span className={`text-sm font-medium ${RATING_DESCRIPTIONS[selectedRating as keyof typeof RATING_DESCRIPTIONS].color}`}>
                    {RATING_DESCRIPTIONS[selectedRating as keyof typeof RATING_DESCRIPTIONS].text}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentário (Opcional)
              </label>
              <Textarea
                rows={4}
                placeholder="Compartilhe detalhes sobre sua experiência..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                data-testid="textarea-review-comment"
              />
              <p className="text-xs text-gray-500 mt-1">
                Seja específico e construtivo para ajudar outros usuários
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={createReviewMutation.isPending || selectedRating === 0}
                className="flex-1"
                data-testid="button-submit-review"
              >
                {createReviewMutation.isPending ? 'Enviando...' : 'Enviar Avaliação'}
              </Button>
            </div>
          </div>
        ) : (
          /* Reviews List */
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <Star className="h-8 w-8 animate-spin mx-auto mb-2 text-yellow-500" />
                <p className="text-gray-500">Carregando avaliações...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Ainda não há avaliações</p>
                <p className="text-xs text-gray-400">Seja o primeiro a compartilhar sua experiência!</p>
              </div>
            ) : (
              <>
                {/* Rating Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl font-bold">
                          {getRatingStats(reviews).average.toFixed(1)}
                        </span>
                        {renderStars(Math.round(getRatingStats(reviews).average))}
                      </div>
                      <p className="text-sm text-gray-600">
                        Baseado em {reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''}
                      </p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map((review: Review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {review.reviewer?.avatar ? (
                                <img
                                  src={review.reviewer.avatar}
                                  alt={review.reviewer.name}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {review.reviewer?.name || 'Usuário'}
                              </p>
                              <div className="flex items-center space-x-2">
                                {renderStars(review.rating, false, 'h-4 w-4')}
                                <Badge variant="outline" className="text-xs">
                                  {REVIEW_TYPES[review.type]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(review.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="text-gray-700 mb-3 text-sm leading-relaxed">
                            {review.comment}
                          </p>
                        )}

                        {/* Review Responses */}
                        {review.responses && review.responses.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-gray-200">
                            {review.responses.map((response: ReviewResponse) => (
                              <div key={response.id} className="mb-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <User className="h-3 w-3 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-600">
                                    {response.responder?.name || 'Proprietário'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(response.createdAt), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{response.response}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Response Form */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          {respondingToReview === review.id ? (
                            <div className="space-y-2">
                              <Textarea
                                rows={2}
                                placeholder="Escreva uma resposta..."
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                data-testid={`textarea-response-${review.id}`}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRespondingToReview(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitResponse(review.id)}
                                  disabled={createResponseMutation.isPending}
                                  data-testid={`button-submit-response-${review.id}`}
                                >
                                  {createResponseMutation.isPending ? 'Enviando...' : 'Responder'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setRespondingToReview(review.id)}
                              className="text-xs"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Responder
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}