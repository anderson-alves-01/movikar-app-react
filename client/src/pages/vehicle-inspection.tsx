import { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';
import { ArrowLeft, Camera, CheckCircle, AlertTriangle, Car, Upload, X } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
    queryKey: ['/api/bookings', reservationId],
    enabled: !!reservationId,
  });

  // Buscar vistoria existente (se houver) - 404 é normal se não existe ainda
  const { data: existingInspection, isLoading: loadingInspection } = useQuery({
    queryKey: ['/api/inspections/reservation', reservationId],
    enabled: !!reservationId,
    retry: false, // Não retentar no 404
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
      
      // Convert form data to match backend expectations
      const fuelLevelMapping: Record<number, string> = {
        0: "empty",
        25: "quarter", 
        50: "half",
        75: "three_quarters",
        100: "full"
      };
      
      const conditionMapping: Record<string, string> = {
        "excelente": "excellent",
        "bom": "good", 
        "regular": "fair",
        "ruim": "poor"
      };

      const inspectionData = {
        ...data,
        fuelLevel: fuelLevelMapping[Number(data.fuelLevel)] || data.fuelLevel?.toString() || "full",
        vehicleCondition: conditionMapping[String(data.vehicleCondition)] || data.vehicleCondition || "good",
        reservationId: reservationId,
        bookingId: Number(reservationId), // Backend expects bookingId as number
        vehicleId: Number((reservation as any)?.vehicleId || (reservation as any)?.vehicle?.id),
        approvalDecision: Boolean(data.approved)
      };
      
      // Use apiRequest which handles authentication properly
      return apiRequest(method, url, inspectionData);
    },
    onSuccess: () => {
      toast({
        title: "Vistoria salva",
        description: "Vistoria realizada com sucesso!",
      });
      
      // Invalidar TODAS as queries relacionadas para forçar refetch completo
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ['/api/inspections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });  
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['inspection'] });
      
      // Redirecionar imediatamente para ver as mudanças
      window.location.href = '/reservations';
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

  // Upload de fotos
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    const uploadedPhotos: string[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        const file = files[i];
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Erro",
            description: `${file.name} não é uma imagem válida`,
            variant: "destructive",
          });
          continue;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Erro", 
            description: `${file.name} é muito grande. Máximo 5MB por foto`,
            variant: "destructive",
          });
          continue;
        }

        // Criar FormData para upload
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('type', 'inspection');

        try {
          // Upload via apiRequest que já inclui autenticação
          const response = await apiRequest('POST', '/api/upload/photo', formData);
          const result = await response.json();

          if (result && result.url) {
            uploadedPhotos.push(result.url);
          } else {
            throw new Error(`Erro no upload de ${file.name}`);
          }
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}`,
            variant: "destructive",
          });
        }
      }

      if (uploadedPhotos.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...uploadedPhotos]
        }));
        
        toast({
          title: "Fotos enviadas",
          description: `${uploadedPhotos.length} foto(s) adicionada(s) com sucesso`,
        });
      }
    } finally {
      setUploadingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index) || []
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
              {String((reservation as any)?.vehicle?.brand || '')} {String((reservation as any)?.vehicle?.model || '')} ({String((reservation as any)?.vehicle?.year || '')})
            </h3>
            <p className="text-blue-700">
              Reserva #{String((reservation as any)?.id || '')} - {String((reservation as any)?.renterName || '')}
            </p>
            <p className="text-sm text-blue-600">
              {(reservation as any)?.startDate ? new Date((reservation as any).startDate).toLocaleDateString() : ''} até {(reservation as any)?.endDate ? new Date((reservation as any).endDate).toLocaleDateString() : ''}
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
                    defaultValue="approved"
                  >
                    <SelectTrigger data-testid="select-approval-status">
                      <SelectValue placeholder="Selecionar resultado" />
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
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  data-testid="file-input-photos"
                />
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Adicione fotos do veículo</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Recomendamos fotos do exterior, interior, painel e possíveis danos.<br/>
                    Máximo 6 fotos, até 5MB cada.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos}
                    data-testid="button-add-photos"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Upload className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Adicionar Fotos
                      </>
                    )}
                  </Button>
                </div>

                {/* Exibir fotos adicionadas */}
                {formData.photos && formData.photos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Fotos adicionadas ({formData.photos.length}/6):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-remove-photo-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                {formData.photos && formData.photos.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Fotos da vistoria ({formData.photos.length}):
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    Nenhuma foto foi anexada
                  </div>
                )}
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