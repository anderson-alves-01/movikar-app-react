import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Crown, Zap, Calendar, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HighlightOption {
  type: string;
  name: string;
  description: string;
  duration: string;
  available: boolean;
}

interface HighlightData {
  vehicle: {
    id: number;
    isHighlighted: boolean;
    highlightType?: string;
    highlightExpiresAt?: string;
  };
  user: {
    subscriptionPlan?: string;
    highlightsAvailable: number;
    highlightsUsed: number;
  };
  availableHighlights: HighlightOption[];
}

interface VehicleHighlightManagerProps {
  vehicleId: number;
  onHighlightApplied?: () => void;
}

export default function VehicleHighlightManager({ vehicleId, onHighlightApplied }: VehicleHighlightManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedHighlight, setSelectedHighlight] = useState<string>('');

  // Fetch highlight options
  const { data: highlightData, isLoading } = useQuery<HighlightData>({
    queryKey: [`/api/vehicles/${vehicleId}/highlight-options`],
  });

  // Apply highlight mutation
  const highlightMutation = useMutation({
    mutationFn: async (highlightType: string) => {
      const response = await apiRequest("POST", `/api/vehicles/${vehicleId}/highlight`, {
        highlightType
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Destaque aplicado!",
        description: `Seu veículo foi destacado com sucesso. ${data.message}`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/vehicles/${vehicleId}/highlight-options`] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      onHighlightApplied?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar destaque",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleApplyHighlight = () => {
    if (!selectedHighlight) {
      toast({
        title: "Selecione um tipo de destaque",
        description: "Escolha entre as opções disponíveis.",
        variant: "destructive",
      });
      return;
    }

    highlightMutation.mutate(selectedHighlight);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!highlightData) {
    return null;
  }

  const { vehicle, user, availableHighlights } = highlightData;

  // Show current highlight status if vehicle is highlighted
  if (vehicle.isHighlighted && vehicle.highlightExpiresAt) {
    const expiresAt = new Date(vehicle.highlightExpiresAt);
    const timeRemaining = formatDistanceToNow(expiresAt, { 
      addSuffix: true, 
      locale: ptBR 
    });

    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            {vehicle.highlightType === 'diamante' ? (
              <Crown className="h-5 w-5 mr-2" />
            ) : (
              <Star className="h-5 w-5 mr-2" />
            )}
            Veículo em Destaque
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Seu veículo está recebendo mais visualizações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {vehicle.highlightType === 'diamante' ? 'Destaque Diamante' : 'Destaque Prata'}
            </Badge>
            
            <div className="flex items-center text-sm text-yellow-700">
              <Calendar className="h-4 w-4 mr-2" />
              Expira {timeRemaining}
            </div>
            
            <div className="flex items-center text-sm text-yellow-700">
              <Users className="h-4 w-4 mr-2" />
              {vehicle.highlightType === 'diamante' ? '10x mais visualizações' : '3x mais visualizações'}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show upgrade message if no subscription
  if (!user.subscriptionPlan || user.subscriptionPlan === 'free') {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <Zap className="h-5 w-5 mr-2" />
            Destacar Veículo
          </CardTitle>
          <CardDescription className="text-blue-700">
            Faça upgrade do seu plano para destacar seus veículos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-blue-600">
              Com um plano pago, você pode destacar seus veículos e receber até 10x mais visualizações.
            </p>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/subscription-plans'}
            >
              Ver Planos de Assinatura
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show highlight options if user has paid subscription
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          Destacar Veículo
        </CardTitle>
        <CardDescription>
          Destaque seu veículo para receber mais visualizações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Destaques disponíveis: <span className="font-medium">{user.highlightsAvailable}</span>
        </div>

        {availableHighlights.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Nenhuma opção de destaque disponível no seu plano atual.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {availableHighlights.map((highlight) => (
              <div 
                key={highlight.type}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedHighlight === highlight.type 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                } ${!highlight.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => highlight.available && setSelectedHighlight(highlight.type)}
                data-testid={`highlight-option-${highlight.type}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {highlight.type === 'diamante' ? (
                        <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                      ) : (
                        <Star className="h-4 w-4 mr-2 text-gray-500" />
                      )}
                      <h4 className="font-medium">{highlight.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {highlight.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duração: {highlight.duration}
                    </p>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="highlightType"
                      value={highlight.type}
                      checked={selectedHighlight === highlight.type}
                      onChange={() => setSelectedHighlight(highlight.type)}
                      disabled={!highlight.available}
                      className="ml-2"
                      data-testid={`radio-highlight-${highlight.type}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {user.highlightsAvailable === 0 ? (
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700">
              Você não possui destaques disponíveis. Considere fazer upgrade do seu plano.
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.href = '/subscription-plans'}
            >
              Ver Planos
            </Button>
          </div>
        ) : (
          <Button 
            onClick={handleApplyHighlight}
            disabled={!selectedHighlight || highlightMutation.isPending}
            className="w-full"
            data-testid="button-apply-highlight"
          >
            {highlightMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Aplicando destaque...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Aplicar Destaque
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}