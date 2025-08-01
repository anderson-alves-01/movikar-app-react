import { useState, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VehicleBrand {
  id: number;
  name: string;
  isActive: boolean;
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
    licensePlate: '',
    renavam: '',
    features: [] as string[],
    images: [] as string[],
    crlvDocument: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const crlvInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCRLV, setUploadingCRLV] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicle brands
  const { data: brands } = useQuery<VehicleBrand[]>({
    queryKey: ["/api/vehicle-brands"],
    select: (data) => data?.filter(brand => brand.isActive) || [],
  });

  const vehicleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/vehicles', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Veículo cadastrado!",
        description: "Seu veículo foi cadastrado e está aguardando aprovação da documentação.",
      });
      // Force cache invalidation for all vehicle-related queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/vehicles'],
        refetchType: 'active'
      });
      queryClient.removeQueries({ 
        predicate: (query) => 
          query.queryKey[0] === '/api/vehicles' || 
          query.queryKey[0] === '/api/users/my/vehicles' ||
          (typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/vehicles'))
      });
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
      licensePlate: '',
      renavam: '',
      features: [] as string[],
      images: [] as string[],
      crlvDocument: '',
    });
    setUploadingCRLV(false);
  };

  const handleFeatureToggle = (feature: string) => {
    setVehicleData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = 10;
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `${file.name} não é um tipo de imagem válido. Use JPEG, PNG ou WebP.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxFileSize) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} é muito grande. Tamanho máximo: 5MB.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (vehicleData.images.length + validFiles.length > maxFiles) {
      toast({
        title: "Muitas imagens",
        description: `Máximo de ${maxFiles} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    // Convert files to base64 URLs for preview
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setVehicleData(prev => ({
          ...prev,
          images: [...prev.images, result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setVehicleData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCRLVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Apenas arquivos PDF, JPG ou PNG são permitidos",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingCRLV(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setVehicleData(prev => ({
          ...prev,
          crlvDocument: result
        }));
        setUploadingCRLV(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Falha ao carregar o documento",
        variant: "destructive",
      });
      setUploadingCRLV(false);
    }
  };

  const triggerCRLVInput = () => {
    crlvInputRef.current?.click();
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

    // Image validation
    if (vehicleData.images.length < 3) {
      toast({
        title: "Fotos obrigatórias",
        description: "Adicione pelo menos 3 fotos do seu veículo",
        variant: "destructive",
      });
      return;
    }

    // CRLV validation
    if (!vehicleData.crlvDocument) {
      toast({
        title: "CRLV obrigatório",
        description: "Faça o upload do documento CRLV do veículo",
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
              Fotos do veículo * ({vehicleData.images.length}/10)
            </Label>
            
            {/* Upload Area */}
            <Card 
              className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer mb-4"
              onClick={triggerFileInput}
            >
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Clique para adicionar fotos</p>
                <p className="text-sm text-gray-500">Adicione pelo menos 3 fotos (máx. 10, 5MB cada)</p>
                <p className="text-xs text-gray-400 mt-1">Formatos: JPEG, PNG, WebP</p>
              </CardContent>
            </Card>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
            
            {/* Hidden CRLV Input */}
            <input 
              ref={crlvInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleCRLVUpload}
              className="hidden"
            />

            {/* Image Preview Grid */}
            {vehicleData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {vehicleData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
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
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Principal
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {vehicleData.images.length < 3 && (
              <p className="text-amber-600 text-sm mt-2 flex items-center">
                <Camera className="h-4 w-4 mr-1" />
                Adicione pelo menos 3 fotos para continuar
              </p>
            )}
          </div>

          {/* CRLV Document Upload */}
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-3">
              Documento CRLV *
            </Label>
            
            <Card 
              className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
              onClick={triggerCRLVInput}
            >
              <CardContent className="p-6 text-center">
                {uploadingCRLV ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <span className="text-gray-600">Carregando documento...</span>
                  </div>
                ) : vehicleData.crlvDocument ? (
                  <div className="flex items-center justify-center text-green-600">
                    <Upload className="h-6 w-6 mr-2" />
                    <span>Documento CRLV carregado</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Clique para enviar o CRLV</p>
                    <p className="text-sm text-gray-500">Documento obrigatório para aprovação</p>
                    <p className="text-xs text-gray-400 mt-1">Formatos: PDF, JPEG, PNG (máx. 5MB)</p>
                  </>
                )}
              </CardContent>
            </Card>
            
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ Seu veículo ficará com status "Pendente" até a aprovação da documentação pela equipe.
            </p>
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
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.name}>
                      {brand.name}
                    </SelectItem>
                  ))}
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
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Placa *</Label>
              <Input 
                type="text" 
                placeholder="ABC-1234 ou ABC1D23"
                value={vehicleData.licensePlate}
                onChange={(e) => setVehicleData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                maxLength={8}
              />
              <p className="text-sm text-gray-500 mt-1">
                Formato padrão (ABC-1234) ou Mercosul (ABC1D23)
              </p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">RENAVAM *</Label>
              <Input 
                type="text" 
                placeholder="12345678901"
                value={vehicleData.renavam}
                onChange={(e) => setVehicleData(prev => ({ ...prev, renavam: e.target.value.replace(/\D/g, '') }))}
                maxLength={11}
              />
              <p className="text-sm text-gray-500 mt-1">
                Código de 11 dígitos do documento do veículo
              </p>
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