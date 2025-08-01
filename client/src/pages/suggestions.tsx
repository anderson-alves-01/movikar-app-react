import React, { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VehicleCard from '@/components/vehicle-card';
import Header from '@/components/header';
import { Sparkles, Eye, Search, TrendingUp } from 'lucide-react';

interface VehicleWithOwner {
  id: number;
  ownerId: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: string;
  fuel: string;
  seats: number;
  category: string;
  features: string[];
  images: string[];
  location: string;
  latitude: string;
  longitude: string;
  pricePerDay: string;
  pricePerWeek: string;
  pricePerMonth: string;
  description: string;
  isAvailable: boolean;
  isVerified: boolean;
  rating: string;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    isVerified: boolean;
    rating: string;
  };
}

export default function Suggestions() {
  // Track page view activity
  const trackActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      const response = await fetch('/api/activity/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error('Erro ao registrar atividade');
      }

      return response.json();
    },
  });

  // Fetch personalized suggestions
  const { data: suggestions, isLoading, error } = useQuery<VehicleWithOwner[]>({
    queryKey: ['/api/suggestions/personalized'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Track page view on component mount
  useEffect(() => {
    trackActivityMutation.mutate({
      activityType: 'suggestions_view',
      sessionId: `session_${Date.now()}`,
    });
  }, []);

  // Track vehicle view activity
  const handleVehicleView = (vehicleId: number) => {
    trackActivityMutation.mutate({
      activityType: 'vehicle_view',
      vehicleId,
      sessionId: `session_${Date.now()}`,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sugestões Personalizadas</h1>
          <p className="text-gray-600">Veículos recomendados baseados no seu histórico</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-64 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="bg-red-50 rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar sugestões</h2>
            <p className="text-red-600">Tente novamente mais tarde</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Sugestões Personalizadas</h1>
          </div>
          <p className="text-gray-600">
            Veículos recomendados baseados nas suas pesquisas e preferências
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Baseado em</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pesquisas</div>
              <p className="text-xs text-muted-foreground">
                Suas buscas anteriores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Histórico de</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Visualizações</div>
              <p className="text-xs text-muted-foreground">
                Veículos que você viu
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Algoritmo</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Inteligente</div>
              <p className="text-xs text-muted-foreground">
                Aprende suas preferências
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 ? (
          <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Recomendações para Você
            </h2>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {suggestions.length} sugestões
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((vehicle) => (
              <div 
                key={vehicle.id} 
                onClick={() => handleVehicleView(vehicle.id)}
                className="cursor-pointer"
              >
                <VehicleCard 
                  vehicle={vehicle}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-blue-50 rounded-lg p-8 max-w-md mx-auto">
            <Sparkles className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Construindo suas sugestões
            </h2>
            <p className="text-blue-600 mb-4">
              Faça algumas pesquisas para começar a receber recomendações personalizadas
            </p>
            <Button 
              onClick={() => window.location.href = '/vehicles'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Explorar Veículos
            </Button>
          </div>
        </div>
        )}

        {/* Tips */}
        <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Como funciona?
            </CardTitle>
            <CardDescription>
              Nosso sistema de sugestões personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">🔍 Análise de Comportamento</h4>
                <p className="text-sm text-gray-600">
                  Analisamos suas pesquisas, filtros utilizados e veículos visualizados para entender suas preferências.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🎯 Recomendações Inteligentes</h4>
                <p className="text-sm text-gray-600">
                  Sugerimos veículos que combinam com seu perfil, localização preferida e faixa de preço.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">📈 Melhoria Contínua</h4>
                <p className="text-sm text-gray-600">
                  Quanto mais você usar a plataforma, mais precisas ficam nossas sugestões.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">🔄 Atualização em Tempo Real</h4>
                <p className="text-sm text-gray-600">
                  As sugestões são atualizadas constantemente com base em novos veículos e suas atividades.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}