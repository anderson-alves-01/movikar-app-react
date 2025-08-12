import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, Car } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface InspectionData {
  id?: number;
  reservationId: number;
  inspectorId: number;
  vehicleCondition: 'excelente' | 'bom' | 'regular' | 'ruim';
  exteriorCondition: 'excelente' | 'bom' | 'regular' | 'ruim';
  interiorCondition: 'excelente' | 'bom' | 'regular' | 'ruim';
  engineCondition: 'excelente' | 'bom' | 'regular' | 'ruim';
  tiresCondition: 'excelente' | 'bom' | 'regular' | 'ruim';
  fuelLevel: number;
  mileage: number;
  observations: string;
  photos: string[];
  approved: boolean;
  completedAt: string;
}

export default function VehicleInspection() {
  const [match, params] = useRoute('/inspection/:reservationId');
  const reservationId = params?.reservationId ? parseInt(params.reservationId) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<InspectionData>>({
    vehicleCondition: 'bom',
    exteriorCondition: 'bom',
    interiorCondition: 'bom',
    engineCondition: 'bom',
    tiresCondition: 'bom',
    fuelLevel: 100,
    mileage: 0,
    observations: '',
    photos: [],
    approved: true
  });

  // Buscar dados da reserva
  const { data: reservation, isLoading: loadingReservation } = useQuery({
    queryKey: ['/api/reservations', reservationId],
    enabled: !!reservationId,
  });

  // Buscar vistoria existente (se houver)
  const { data: existingInspection, isLoading: loadingInspection } = useQuery({
    queryKey: ['/api/inspections/reservation', reservationId],
    enabled: !!reservationId,
  });

  // Carregar dados da vistoria existente
  useEffect(() => {
    if (existingInspection) {
      setFormData(existingInspection);
    }
  }, [existingInspection]);

  // Mutation para salvar vistoria
  const saveInspectionMutation = useMutation({
    mutationFn: async (data: Partial<InspectionData>) => {
      const method = existingInspection ? 'PUT' : 'POST';
      const url = existingInspection 
        ? `/api/inspections/${(existingInspection as any)?.id}`
        : '/api/inspections';
      
      return apiRequest(method, url, {
        ...data,
        reservationId: reservationId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Vistoria salva",
        description: "Vistoria realizada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inspections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      // Redirecionar para o histórico
      window.location.href = '/inspection-history';
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar vistoria",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservationId) {
      toast({
        title: "Erro",
        description: "ID da reserva não encontrado",
        variant: "destructive",
      });
      return;
    }

    // Validações básicas
    if (!formData.mileage || formData.mileage < 0) {
      toast({
        title: "Erro",
        description: "Quilometragem é obrigatória e deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fuelLevel || formData.fuelLevel < 0 || formData.fuelLevel > 100) {
      toast({
        title: "Erro",
        description: "Nível de combustível deve estar entre 0 e 100",
        variant: "destructive",
      });
      return;
    }

    saveInspectionMutation.mutate(formData);
  };

  if (!match || !reservationId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Reserva não encontrada</h2>
            <p className="text-gray-600 mb-4">O ID da reserva não foi fornecido ou é inválido.</p>
            <Button onClick={() => window.location.href = '/inspection-history'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Histórico
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingReservation || loadingInspection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <Loading variant="car" className="mx-auto mb-4" />
            <p>Carregando dados da vistoria...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isReadOnly = existingInspection && (existingInspection as any)?.completedAt;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/inspection-history'}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Histórico
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <Car className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">
            {isReadOnly ? 'Detalhes da Vistoria' : 'Realizar Vistoria'}
          </h1>
        </div>
        
        {reservation && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">
              {(reservation as any)?.vehicle?.brand} {(reservation as any)?.vehicle?.model} ({(reservation as any)?.vehicle?.year})
            </h3>
            <p className="text-blue-700">
              Reserva #{(reservation as any)?.id} - {(reservation as any)?.renterName}
            </p>
            <p className="text-sm text-blue-600">
              {new Date((reservation as any)?.startDate).toLocaleDateString()} até {new Date((reservation as any)?.endDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Condições do Veículo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Condições do Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Estado Geral</Label>
                <Select 
                  value={formData.vehicleCondition} 
                  onValueChange={(value) => handleInputChange('vehicleCondition', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger data-testid="select-vehicle-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Exterior</Label>
                <Select 
                  value={formData.exteriorCondition} 
                  onValueChange={(value) => handleInputChange('exteriorCondition', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger data-testid="select-exterior-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Interior</Label>
                <Select 
                  value={formData.interiorCondition} 
                  onValueChange={(value) => handleInputChange('interiorCondition', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger data-testid="select-interior-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Motor</Label>
                <Select 
                  value={formData.engineCondition} 
                  onValueChange={(value) => handleInputChange('engineCondition', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger data-testid="select-engine-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Pneus</Label>
                <Select 
                  value={formData.tiresCondition} 
                  onValueChange={(value) => handleInputChange('tiresCondition', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger data-testid="select-tires-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dados Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mileage">Quilometragem Atual</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={formData.mileage || ''}
                  onChange={(e) => handleInputChange('mileage', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 85000"
                  disabled={isReadOnly}
                  data-testid="input-mileage"
                />
              </div>

              <div>
                <Label htmlFor="fuelLevel">Nível de Combustível (%)</Label>
                <Input
                  id="fuelLevel"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.fuelLevel || ''}
                  onChange={(e) => handleInputChange('fuelLevel', parseInt(e.target.value) || 0)}
                  placeholder="Ex: 75"
                  disabled={isReadOnly}
                  data-testid="input-fuel-level"
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={formData.observations || ''}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Descreva qualquer dano, problema ou observação importante..."
                  rows={4}
                  disabled={isReadOnly}
                  data-testid="textarea-observations"
                />
              </div>

              {!isReadOnly && (
                <div>
                  <Label>Resultado da Vistoria</Label>
                  <Select 
                    value={formData.approved ? 'approved' : 'rejected'} 
                    onValueChange={(value) => handleInputChange('approved', value === 'approved')}
                  >
                    <SelectTrigger data-testid="select-approval-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Aprovado - Veículo em condições adequadas</SelectItem>
                      <SelectItem value="rejected">Reprovado - Veículo precisa de reparos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fotos da Vistoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Fotos da Vistoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isReadOnly ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">Adicione fotos do veículo</p>
                <p className="text-sm text-gray-500">
                  Recomendamos fotos do exterior, interior, painel e possíveis danos
                </p>
                <Button type="button" variant="outline" className="mt-4">
                  Adicionar Fotos
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                {formData.photos && formData.photos.length > 0 
                  ? `${formData.photos.length} foto(s) anexada(s)`
                  : 'Nenhuma foto foi anexada'
                }
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        {!isReadOnly && (
          <div className="flex gap-4 justify-end">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.location.href = '/inspection-history'}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={saveInspectionMutation.isPending}
              data-testid="button-save-inspection"
            >
              {saveInspectionMutation.isPending ? (
                <>
                  <Loading variant="spinner" className="mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : (
                'Concluir Vistoria'
              )}
            </Button>
          </div>
        )}

        {/* Status da Vistoria Concluída */}
        {isReadOnly && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">
                  Vistoria concluída em {new Date((existingInspection as any)?.completedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Status: {formData.approved ? 'Aprovado' : 'Reprovado'}
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}