import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X, CameraIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Link } from "wouter";

export default function VehicleEdit() {
  const [, params] = useRoute("/vehicle/:id/edit");
  const [, setLocation] = useLocation();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const vehicleId = params?.id;

  const [vehicleData, setVehicleData] = useState({
    brand: '',
    model: '',
    year: '',
    color: '',
    transmission: '',
    fuel: '',
    seats: '',
    category: '',
    location: '',
    pricePerDay: '',
    pricePerWeek: '',
    pricePerMonth: '',
    securityDepositValue: '20.00',
    securityDepositType: 'percentage' as 'percentage' | 'fixed',
    description: '',
    images: [] as string[],
    features: [] as string[]
  });

  // Fetch current vehicle data
  const { data: vehicle, isLoading } = useQuery({
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

  // Update local state when vehicle data is loaded
  useEffect(() => {
    if (vehicle) {
      setVehicleData({
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year?.toString() || '',
        color: vehicle.color || '',
        transmission: vehicle.transmission || '',
        fuel: vehicle.fuel || '',
        seats: vehicle.seats?.toString() || '',
        category: vehicle.category || '',
        location: vehicle.location || '',
        pricePerDay: vehicle.pricePerDay?.toString() || '',
        pricePerWeek: vehicle.pricePerWeek?.toString() || '',
        pricePerMonth: vehicle.pricePerMonth?.toString() || '',
        securityDepositValue: vehicle.securityDepositValue?.toString() || '20.00',
        securityDepositType: vehicle.securityDepositType || 'percentage',
        description: vehicle.description || '',
        images: vehicle.images || [],
        features: vehicle.features || []
      });
    }
  }, [vehicle]);

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/vehicles/${vehicleId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Veículo atualizado com sucesso",
      });
      // Force immediate cache invalidation with refetch
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users/my/vehicles"],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vehicles', vehicleId],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vehicles'],
        refetchType: 'active'
      });
      // Force a complete cache reset for vehicle-related data
      queryClient.removeQueries({ 
        queryKey: ["/api/users/my/vehicles"] 
      });
      // Add a small delay to ensure cache is cleared before navigation
      setTimeout(() => {
        setLocation('/vehicles');
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar veículo",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setVehicleData(prev => ({
            ...prev,
            images: [...prev.images, result]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setVehicleData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (vehicleData.images.length < 3) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos 3 imagens do veículo",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      ...vehicleData,
      year: parseInt(vehicleData.year),
      seats: parseInt(vehicleData.seats),
      pricePerDay: parseFloat(vehicleData.pricePerDay),
      pricePerWeek: parseFloat(vehicleData.pricePerWeek),
      pricePerMonth: parseFloat(vehicleData.pricePerMonth),
      securityDepositValue: parseFloat(vehicleData.securityDepositValue),
      securityDepositType: vehicleData.securityDepositType,
    };

    updateVehicleMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center pt-20 pb-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!vehicle || vehicle.ownerId !== user?.id) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Veículo não encontrado</h1>
          <p className="text-gray-600 mb-8">Este veículo não existe ou você não tem permissão para editá-lo.</p>
          <Button asChild>
            <Link href="/vehicles">Voltar aos Meus Veículos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/vehicles">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Meus Veículos
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CameraIcon className="h-5 w-5 mr-2" />
              Editar Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Images Section - Highlighted */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <Label className="block text-lg font-semibold text-blue-800 mb-4">
                  <CameraIcon className="h-5 w-5 inline mr-2" />
                  Imagens do Veículo *
                </Label>
                
                <div className="space-y-4">
                  {/* Upload Button */}
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="vehicle-images"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="vehicle-images" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                      <p className="text-blue-600 font-medium">Clique para adicionar imagens</p>
                      <p className="text-sm text-blue-500">Suporte para PNG, JPG, GIF</p>
                    </label>
                  </div>

                  {/* Image Preview Grid */}
                  {vehicleData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {vehicleData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border-2 border-blue-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {vehicleData.images.length < 3 && (
                    <p className="text-amber-600 text-sm flex items-center">
                      <CameraIcon className="h-4 w-4 mr-1" />
                      Adicione pelo menos 3 fotos para continuar ({vehicleData.images.length}/3)
                    </p>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Marca *</Label>
                  <Input
                    value={vehicleData.brand}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, brand: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Modelo *</Label>
                  <Input
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Ano *</Label>
                  <Input
                    type="number"
                    min="1990"
                    max="2025"
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Cor *</Label>
                  <Input
                    value={vehicleData.color}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Lugares *</Label>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    value={vehicleData.seats}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, seats: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Transmissão *</Label>
                  <Select 
                    key={`transmission-${vehicleId}-${vehicleData.transmission}`}
                    value={vehicleData.transmission} 
                    onValueChange={(value) => setVehicleData(prev => ({ ...prev, transmission: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automático</SelectItem>
                      <SelectItem value="cvt">CVT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Combustível *</Label>
                  <Select 
                    key={`fuel-${vehicleId}-${vehicleData.fuel}`}
                    value={vehicleData.fuel} 
                    onValueChange={(value) => setVehicleData(prev => ({ ...prev, fuel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flex">Flex</SelectItem>
                      <SelectItem value="gasoline">Gasolina</SelectItem>
                      <SelectItem value="ethanol">Etanol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="electric">Elétrico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria *</Label>
                  <Select 
                    key={`category-${vehicleId}-${vehicleData.category}`}
                    value={vehicleData.category} 
                    onValueChange={(value) => setVehicleData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">Econômico</SelectItem>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="luxury">Luxo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location and Pricing */}
              <div>
                <Label>Localização *</Label>
                <Input
                  value={vehicleData.location}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: São Paulo, SP"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Preço por dia (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={vehicleData.pricePerDay}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Preço por semana (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={vehicleData.pricePerWeek}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerWeek: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Preço por mês (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={vehicleData.pricePerMonth}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerMonth: e.target.value }))}
                  />
                </div>
              </div>

              {/* Security Deposit */}
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Caução</Label>
                  <Select
                    key={`security-${vehicleId}-${vehicleData.securityDepositType}`}
                    value={vehicleData.securityDepositType}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setVehicleData(prev => ({ ...prev, securityDepositType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    {vehicleData.securityDepositType === 'percentage' 
                      ? 'Percentual da caução (%)' 
                      : 'Valor da caução (R$)'
                    }
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={vehicleData.securityDepositType === 'percentage' ? "100" : undefined}
                    value={vehicleData.securityDepositValue}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, securityDepositValue: e.target.value }))}
                    placeholder={vehicleData.securityDepositType === 'percentage' ? "Ex: 20.00" : "Ex: 200.00"}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    {vehicleData.securityDepositType === 'percentage' 
                      ? 'A caução será calculada sobre o valor da diária (ex: 20% de uma diária de R$ 100,00 = R$ 20,00)'
                      : 'Valor fixo que será somado ao total do aluguel como caução'
                    }
                  </p>
                </div>

                {vehicleData.pricePerDay && vehicleData.securityDepositValue && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800">Valor da caução:</p>
                    <p className="text-lg font-bold text-blue-900">
                      R$ {vehicleData.securityDepositType === 'percentage' 
                        ? (parseFloat(vehicleData.pricePerDay) * parseFloat(vehicleData.securityDepositValue) / 100).toFixed(2)
                        : parseFloat(vehicleData.securityDepositValue).toFixed(2)
                      }
                    </p>
                    <p className="text-xs text-blue-600">
                      {vehicleData.securityDepositType === 'percentage' 
                        ? `${vehicleData.securityDepositValue}% de R$ ${parseFloat(vehicleData.pricePerDay).toFixed(2)}`
                        : 'Valor fixo'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <Label>Descrição</Label>
                <RichTextEditor
                  key={`description-${vehicleId}`}
                  value={vehicleData.description}
                  onChange={(value) => setVehicleData(prev => ({ ...prev, description: value }))}
                  placeholder="Descreva seu veículo, condições especiais, etc."
                  data-testid="editor-description"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/vehicles">Cancelar</Link>
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateVehicleMutation.isPending || vehicleData.images.length < 3}
                  className="bg-primary hover:bg-primary/90"
                >
                  {updateVehicleMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}