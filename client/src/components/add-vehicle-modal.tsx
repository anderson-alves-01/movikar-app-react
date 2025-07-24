import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddVehicleModal({ open, onOpenChange }: AddVehicleModalProps) {
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
    description: '',
    features: [] as string[],
    images: [] as string[],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/vehicles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Veículo cadastrado!",
        description: "Seu veículo foi cadastrado com sucesso e será analisado em breve.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao cadastrar veículo",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setVehicleData({
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
      description: '',
      features: [],
      images: [],
    });
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!vehicleData.brand || !vehicleData.model || !vehicleData.year || 
        !vehicleData.transmission || !vehicleData.fuel || !vehicleData.seats ||
        !vehicleData.category || !vehicleData.location || !vehicleData.pricePerDay) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const dataToSubmit = {
      ...vehicleData,
      year: parseInt(vehicleData.year),
      seats: parseInt(vehicleData.seats),
      pricePerDay: parseFloat(vehicleData.pricePerDay),
      pricePerWeek: vehicleData.pricePerWeek ? parseFloat(vehicleData.pricePerWeek) : null,
      pricePerMonth: vehicleData.pricePerMonth ? parseFloat(vehicleData.pricePerMonth) : null,
    };

    vehicleMutation.mutate(dataToSubmit);
  };

  const availableFeatures = [
    'Ar condicionado',
    'Direção hidráulica',
    'Vidro elétrico',
    'Trava elétrica',
    'Som Bluetooth',
    'GPS'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Anunciar meu veículo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Photos */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Fotos do veículo *
            </Label>
            <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
              <CardContent className="p-6 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Clique para adicionar fotos ou arraste aqui</p>
                <p className="text-sm text-gray-500">Adicione pelo menos 3 fotos (máx. 10)</p>
                <Input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                />
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Marca *</Label>
              <Select 
                value={vehicleData.brand} 
                onValueChange={(value) => setVehicleData(prev => ({ ...prev, brand: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Honda">Honda</SelectItem>
                  <SelectItem value="Toyota">Toyota</SelectItem>
                  <SelectItem value="Volkswagen">Volkswagen</SelectItem>
                  <SelectItem value="Ford">Ford</SelectItem>
                  <SelectItem value="Chevrolet">Chevrolet</SelectItem>
                  <SelectItem value="BMW">BMW</SelectItem>
                  <SelectItem value="Audi">Audi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Modelo *</Label>
              <Input 
                type="text" 
                placeholder="Civic, Corolla, etc."
                value={vehicleData.model}
                onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Ano *</Label>
              <Input 
                type="number" 
                min="2000" 
                max="2024" 
                placeholder="2023"
                value={vehicleData.year}
                onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Cor</Label>
              <Input 
                type="text" 
                placeholder="Branco, Prata, etc."
                value={vehicleData.color}
                onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Transmissão *</Label>
              <Select 
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
              <Label className="block text-sm font-medium text-gray-700 mb-2">Combustível *</Label>
              <Select 
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
                  <SelectItem value="hybrid">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Lugares *</Label>
              <Select 
                value={vehicleData.seats} 
                onValueChange={(value) => setVehicleData(prev => ({ ...prev, seats: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 lugares</SelectItem>
                  <SelectItem value="4">4 lugares</SelectItem>
                  <SelectItem value="5">5 lugares</SelectItem>
                  <SelectItem value="7">7 lugares</SelectItem>
                  <SelectItem value="8">8+ lugares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</Label>
            <Select 
              value={vehicleData.category} 
              onValueChange={(value) => setVehicleData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hatch">Hatch</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Features */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">Recursos</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox 
                    id={feature}
                    checked={vehicleData.features.includes(feature)}
                    onCheckedChange={() => handleFeatureToggle(feature)}
                  />
                  <Label htmlFor={feature} className="text-sm text-gray-700">
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Localização *</Label>
            <Input 
              type="text" 
              placeholder="Endereço, bairro ou ponto de referência"
              value={vehicleData.location}
              onChange={(e) => setVehicleData(prev => ({ ...prev, location: e.target.value }))}
            />
            <p className="text-sm text-gray-500 mt-1">
              Locatários verão apenas a região aproximada
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Preço por dia *</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="120"
                  className="pl-10"
                  value={vehicleData.pricePerDay}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerDay: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Preço por semana</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="700"
                  className="pl-10"
                  value={vehicleData.pricePerWeek}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerWeek: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Preço por mês</Label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">R$</span>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="2500"
                  className="pl-10"
                  value={vehicleData.pricePerMonth}
                  onChange={(e) => setVehicleData(prev => ({ ...prev, pricePerMonth: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Descrição</Label>
            <Textarea 
              rows={3} 
              placeholder="Descreva seu veículo, condições especiais, etc."
              value={vehicleData.description}
              onChange={(e) => setVehicleData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Terms */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox required />
                <span className="text-sm text-gray-700">
                  Aceito os{" "}
                  <a href="#" className="text-primary hover:text-red-600">
                    termos de uso
                  </a>{" "}
                  e confirmo que possuo todos os documentos necessários para o aluguel do veículo.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline"
              className="flex-1" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-red-600 transition-colors"
              disabled={vehicleMutation.isPending}
            >
              {vehicleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Publicando...
                </>
              ) : (
                'Publicar Anúncio'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}