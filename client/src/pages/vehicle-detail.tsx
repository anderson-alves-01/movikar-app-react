import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Header from "@/components/header";
import BookingForm from "@/components/booking-form";
import MessageCenter from "@/components/message-center";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  MapPin, 
  User, 
  MessageCircle, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Loader2,
  Settings,
  Fuel,
  Users,
  Calendar,
  CheckCircle,
  Shield,
  Clock,
  DollarSign
} from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/currency";
import WaitingQueueButton from "@/components/waiting-queue-button";
import UnlockContactButton from "@/components/unlock-contact-button";

export default function VehicleDetail() {
  const [, params] = useRoute("/vehicle/:id");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showMessages, setShowMessages] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const vehicleId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuthStore();
  const { toast } = useToast();

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['/api/vehicles', vehicleId],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}`);
      if (!response.ok) {
        throw new Error('Vehicle not found');
      }
      return response.json();
    },
    enabled: !!vehicleId,
  });

  const { data: reviews } = useQuery({
    queryKey: ['/api/vehicles', vehicleId, 'reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${vehicleId}/reviews`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return response.json();
    },
    enabled: !!vehicleId,
  });



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFeatureIcon = (feature: string) => {
    const iconMap: { [key: string]: any } = {
      'Ar condicionado': '❄️',
      'Direção hidráulica': '🚗',
      'Vidro elétrico': '🪟',
      'Trava elétrica': '🔒',
      'Som Bluetooth': '🎵',
      'GPS': '🗺️',
    };
    return iconMap[feature] || '✓';
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}`,
        text: `Confira este ${vehicle?.brand} ${vehicle?.model} disponível para aluguel`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando veículo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Veículo não encontrado</h2>
              <p className="text-gray-600 mb-6">O veículo que você está procurando não existe ou foi removido.</p>
              <Button asChild>
                <Link href="/">Voltar à página inicial</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const defaultImages = [
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    "https://images.unsplash.com/photo-1554744512-d6c603f27c54?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
  ];

  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : defaultImages;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="vehicle-detail-container">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Title */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  <span data-testid="text-vehicle-brand">{vehicle.brand}</span>{" "}
                  <span data-testid="text-vehicle-model">{vehicle.model}</span>{" "}
                  <span data-testid="text-vehicle-year">{vehicle.year}</span>
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{vehicle.location}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="space-y-4" data-testid="vehicle-images">
                  {/* Main Image */}
                  <img 
                    src={images[selectedImageIndex]}
                    alt={`${vehicle.brand} ${vehicle.model} main view`}
                    className="w-full h-80 object-cover rounded-t-xl"
                  />
                  
                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {images.map((image: string, index: number) => (
                      <img 
                        key={index}
                        src={image}
                        alt={`${vehicle.brand} ${vehicle.model} view ${index + 1}`}
                        className={`w-full h-20 object-cover rounded-lg cursor-pointer border-2 transition-all ${
                          index === selectedImageIndex 
                            ? 'border-primary' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            <Card data-testid="vehicle-features">
              <CardContent className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Detalhes do Veículo</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Settings className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Transmissão</div>
                      <div className="font-medium capitalize">{vehicle.transmission}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Fuel className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Combustível</div>
                      <div className="font-medium capitalize">{vehicle.fuel}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Users className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Lugares</div>
                      <div className="font-medium">{vehicle.seats}</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                      <div className="text-sm text-gray-600">Ano</div>
                      <div className="font-medium">{vehicle.year}</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Recursos</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicle.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-2">{getFeatureIcon(feature)}</span>
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {vehicle.description && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Descrição</h3>
                    <p className="text-gray-700 leading-relaxed">{vehicle.description}</p>
                  </div>
                )}

                {/* Safety Features */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Segurança e Proteção</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-800">Seguro Completo</div>
                        <div className="text-sm text-green-600">Proteção total inclusa</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-blue-800">Verificado</div>
                        <div className="text-sm text-blue-600">Documentos validados</div>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                      <Clock className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <div className="font-medium text-purple-800">Suporte 24/7</div>
                        <div className="text-sm text-purple-600">Assistência completa</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Proprietário</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-16 w-16 flex-shrink-0">
                    <AvatarImage src={vehicle.owner.avatar} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="font-semibold text-lg text-gray-800 truncate">{vehicle.owner.name}</div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-medium">{vehicle.owner.rating}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{vehicle.owner.totalRentals}</span> aluguéis
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Membro desde {vehicle.owner?.createdAt ? new Date(vehicle.owner.createdAt).getFullYear() : new Date().getFullYear()}
                    </div>
                  </div>
                  
                  <Button 
                    className="bg-secondary text-white hover:bg-teal-600 transition-colors w-full sm:w-auto flex-shrink-0 mt-2 sm:mt-0"
                    onClick={() => setShowMessages(!showMessages)}
                    data-testid="button-contact-owner"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Conversar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Unlock Contact Section */}
            {user && user.id !== vehicle.owner.id && (
              <UnlockContactButton
                vehicleId={vehicle.id}
                ownerId={vehicle.owner.id}
                ownerName={vehicle.owner.name}
                className="mb-8"
              />
            )}

            {/* Reviews */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Avaliações</h3>
                  <div className="flex items-center">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{vehicle.rating}</span>
                    <span className="text-gray-600 ml-1">
                      ({reviews?.length || 0} avaliações)
                    </span>
                  </div>
                </div>

                {reviews && reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review: any) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-800">Usuário</div>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 ml-11">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600">
                    Ainda não há avaliações para este veículo
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messages */}
            {showMessages && user && (
              <MessageCenter
                otherUserId={vehicle.owner.id}
                otherUserName={vehicle.owner.name}
                otherUserAvatar={vehicle.owner.avatar}
              />
            )}
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <BookingForm vehicle={vehicle} />
              
              {/* Waiting Queue Button (only if vehicle is not available) */}
              <WaitingQueueButton 
                vehicleId={vehicleId!}
                vehicleName={`${vehicle.brand} ${vehicle.model}`}
                isAvailable={vehicle.isAvailable}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
