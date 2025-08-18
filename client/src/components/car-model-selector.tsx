import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Car, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface CarModelSelectorProps {
  selectedBrand?: string;
  selectedModel?: string;
  selectedSpecificModel?: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onSpecificModelChange: (specificModel: string) => void;
  disabled?: boolean;
}

interface CarBrand {
  brand: string;
  models: string[];
}

interface CarModel {
  id: number;
  brand: string;
  model: string;
  specificModel: string;
  year: number;
  category: string;
  transmission: string;
  fuel: string;
  engineSize?: string;
  doors: number;
  seats: number;
}

export default function CarModelSelector({
  selectedBrand,
  selectedModel,
  selectedSpecificModel,
  onBrandChange,
  onModelChange,
  onSpecificModelChange,
  disabled = false,
}: CarModelSelectorProps) {
  const [brandOpen, setBrandOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [specificModelOpen, setSpecificModelOpen] = useState(false);

  // Fetch car brands and models from database
  const { data: carModels = [], isLoading } = useQuery({
    queryKey: ['/api/car-models'],
    queryFn: async (): Promise<CarModel[]> => {
      try {
        const response = await apiRequest('GET', '/api/car-models');
        return (response as any).data || response as CarModel[];
      } catch (error) {
        console.warn('Failed to load car models from database, using fallback');
        return getFallbackCarModels();
      }
    },
  });

  // Process data for brand selection
  const brands = Array.from(
    new Set((carModels as CarModel[]).map((car: CarModel) => car.brand))
  ).sort();

  // Get models for selected brand
  const modelsForBrand = selectedBrand
    ? Array.from(
        new Set(
          (carModels as CarModel[])
            .filter((car: CarModel) => car.brand === selectedBrand)
            .map((car: CarModel) => car.model)
        )
      ).sort()
    : [];

  // Get specific models for selected brand and model
  const specificModelsForSelection = selectedBrand && selectedModel
    ? (carModels as CarModel[])
        .filter((car: CarModel) => 
          car.brand === selectedBrand && car.model === selectedModel
        )
        .sort((a: CarModel, b: CarModel) => b.year - a.year) // Sort by year descending
    : [];

  // Reset dependent selections when parent changes
  useEffect(() => {
    if (selectedBrand && !modelsForBrand.includes(selectedModel || '')) {
      onModelChange('');
      onSpecificModelChange('');
    }
  }, [selectedBrand, selectedModel, modelsForBrand, onModelChange, onSpecificModelChange]);

  useEffect(() => {
    if (selectedModel && !specificModelsForSelection.some((car: CarModel) => car.specificModel === selectedSpecificModel)) {
      onSpecificModelChange('');
    }
  }, [selectedModel, selectedSpecificModel, specificModelsForSelection, onSpecificModelChange]);

  const handleSpecificModelSelect = (carModel: CarModel) => {
    onSpecificModelChange(carModel.specificModel);
    setSpecificModelOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brand Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca do Veículo *
          </label>
          <Popover open={brandOpen} onOpenChange={setBrandOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={brandOpen}
                className="w-full justify-between"
                disabled={disabled || isLoading}
                data-testid="select-car-brand"
              >
                {selectedBrand ? (
                  <span className="flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    {selectedBrand}
                  </span>
                ) : (
                  <span className="text-gray-500">Selecione a marca...</span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar marca..." />
                <CommandList>
                  <CommandEmpty>Nenhuma marca encontrada.</CommandEmpty>
                  <CommandGroup>
                    {brands.map((brand: string) => (
                      <CommandItem
                        key={brand}
                        onSelect={() => {
                          onBrandChange(brand === selectedBrand ? '' : brand);
                          setBrandOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedBrand === brand ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {brand}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modelo *
          </label>
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={modelOpen}
                className="w-full justify-between"
                disabled={disabled || !selectedBrand || isLoading}
                data-testid="select-car-model"
              >
                {selectedModel ? (
                  <span>{selectedModel}</span>
                ) : (
                  <span className="text-gray-500">
                    {selectedBrand ? 'Selecione o modelo...' : 'Primeiro selecione a marca'}
                  </span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar modelo..." />
                <CommandList>
                  <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                  <CommandGroup>
                    {modelsForBrand.map((model: string) => (
                      <CommandItem
                        key={model}
                        onSelect={() => {
                          onModelChange(model === selectedModel ? '' : model);
                          setModelOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedModel === model ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {model}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Specific Model Selection */}
      {selectedBrand && selectedModel && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Versão Específica (Opcional)
          </label>
          <Popover open={specificModelOpen} onOpenChange={setSpecificModelOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={specificModelOpen}
                className="w-full justify-between"
                disabled={disabled || isLoading}
                data-testid="select-specific-model"
              >
                {selectedSpecificModel ? (
                  <span className="truncate">{selectedSpecificModel}</span>
                ) : (
                  <span className="text-gray-500">Selecione a versão específica...</span>
                )}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar versão..." />
                <CommandList>
                  <CommandEmpty>Nenhuma versão encontrada.</CommandEmpty>
                  <CommandGroup>
                    {specificModelsForSelection.map((carModel: CarModel) => (
                      <CommandItem
                        key={carModel.id}
                        onSelect={() => handleSpecificModelSelect(carModel)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSpecificModel === carModel.specificModel ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{carModel.specificModel}</span>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {carModel.year}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {carModel.transmission === 'manual' ? 'Manual' : 'Automático'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {carModel.fuel === 'gasoline' ? 'Gasolina' : 
                               carModel.fuel === 'ethanol' ? 'Etanol' : 
                               carModel.fuel === 'flex' ? 'Flex' : 'Diesel'}
                            </Badge>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500 mt-1">
            A versão específica ajuda os locatários a encontrar exatamente o que procuram
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Search className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-gray-500">Carregando modelos...</span>
        </div>
      )}
    </div>
  );
}

// Fallback data in case database is not available
function getFallbackCarModels(): CarModel[] {
  return [
    // Toyota
    { id: 1, brand: 'Toyota', model: 'Corolla', specificModel: 'Corolla XEi 2.0 16V Flex Aut', year: 2024, category: 'sedan', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
    { id: 2, brand: 'Toyota', model: 'Corolla', specificModel: 'Corolla GLi 1.8 16V Flex Manual', year: 2024, category: 'sedan', transmission: 'manual', fuel: 'flex', doors: 4, seats: 5 },
    { id: 3, brand: 'Toyota', model: 'Hilux', specificModel: 'Hilux SR 2.7 16V Flex CD 4x2 Manual', year: 2024, category: 'pickup', transmission: 'manual', fuel: 'flex', doors: 4, seats: 5 },
    { id: 4, brand: 'Toyota', model: 'RAV4', specificModel: 'RAV4 2.0 16V CVT', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'gasoline', doors: 4, seats: 5 },
    
    // Honda
    { id: 5, brand: 'Honda', model: 'Civic', specificModel: 'Civic LX 1.8 16V Flex Aut', year: 2024, category: 'sedan', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
    { id: 6, brand: 'Honda', model: 'Civic', specificModel: 'Civic Sport 1.5 Turbo CVT', year: 2024, category: 'sedan', transmission: 'automatic', fuel: 'gasoline', doors: 4, seats: 5 },
    { id: 7, brand: 'Honda', model: 'CR-V', specificModel: 'CR-V EX 1.5 Turbo CVT', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'gasoline', doors: 4, seats: 5 },
    
    // Volkswagen
    { id: 8, brand: 'Volkswagen', model: 'Jetta', specificModel: 'Jetta Comfortline 1.4 TSI Aut', year: 2024, category: 'sedan', transmission: 'automatic', fuel: 'gasoline', doors: 4, seats: 5 },
    { id: 9, brand: 'Volkswagen', model: 'Tiguan', specificModel: 'Tiguan Allspace 1.4 TSI Aut', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'gasoline', doors: 4, seats: 7 },
    
    // Chevrolet
    { id: 10, brand: 'Chevrolet', model: 'Onix', specificModel: 'Onix Plus Premier 1.0 Turbo Aut', year: 2024, category: 'sedan', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
    { id: 11, brand: 'Chevrolet', model: 'Tracker', specificModel: 'Tracker Premier 1.0 Turbo Aut', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
    
    // Ford
    { id: 12, brand: 'Ford', model: 'Ka', specificModel: 'Ka SE 1.0 12V Flex Manual', year: 2024, category: 'hatchback', transmission: 'manual', fuel: 'flex', doors: 4, seats: 5 },
    { id: 13, brand: 'Ford', model: 'EcoSport', specificModel: 'EcoSport Titanium 2.0 16V Flex Aut', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
    
    // Hyundai
    { id: 14, brand: 'Hyundai', model: 'HB20', specificModel: 'HB20 Comfort Plus 1.0 12V Flex Manual', year: 2024, category: 'hatchback', transmission: 'manual', fuel: 'flex', doors: 4, seats: 5 },
    { id: 15, brand: 'Hyundai', model: 'Creta', specificModel: 'Creta Ultimate 2.0 16V Flex Aut', year: 2024, category: 'suv', transmission: 'automatic', fuel: 'flex', doors: 4, seats: 5 },
  ];
}