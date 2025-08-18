import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { SearchFilters } from "@/types";
import { formatCurrency } from "@/lib/currency";
import { useState } from "react";
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react";

interface VehicleFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function VehicleFilters({ filters, onFiltersChange }: VehicleFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    specs: false,
    features: false
  });

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceChange = (values: number[]) => {
    handleFilterChange('priceMin', values[0]);
    handleFilterChange('priceMax', values[1]);
  };

  const handleYearChange = (values: number[]) => {
    handleFilterChange('yearMin', values[0]);
    handleFilterChange('yearMax', values[1]);
  };

  const handleRatingChange = (values: number[]) => {
    handleFilterChange('rating', values[0]);
  };

  const handleSeatsChange = (values: number[]) => {
    handleFilterChange('seatsMin', values[0]);
    handleFilterChange('seatsMax', values[1]);
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    const currentFeatures = filters.features || [];
    if (checked) {
      handleFilterChange('features', [...currentFeatures, feature]);
    } else {
      handleFilterChange('features', currentFeatures.filter(f => f !== feature));
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'features') return value && (value as string[]).length > 0;
      return value !== undefined && value !== '' && value !== null;
    }).length;
  };

  const availableFeatures = [
    { id: 'air_conditioning', label: 'Ar Condicionado' },
    { id: 'bluetooth', label: 'Bluetooth' },
    { id: 'gps', label: 'GPS' },
    { id: 'backup_camera', label: 'Câmera de Ré' },
    { id: 'parking_sensors', label: 'Sensor de Estacionamento' },
    { id: 'cruise_control', label: 'Piloto Automático' },
    { id: 'sunroof', label: 'Teto Solar' },
    { id: 'leather_seats', label: 'Bancos de Couro' },
    { id: 'heated_seats', label: 'Bancos Aquecidos' },
    { id: 'usb_ports', label: 'Portas USB' }
  ];

  return (
    <Card className="bg-white shadow-lg border border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Categoria</Label>
            <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="hatch">Hatch</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Combustível</Label>
            <Select value={filters.fuel || 'all'} onValueChange={(value) => handleFilterChange('fuel', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="ethanol">Etanol</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="electric">Elétrico</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Transmissão</Label>
            <Select value={filters.transmission || 'all'} onValueChange={(value) => handleFilterChange('transmission', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
                <SelectItem value="cvt">CVT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('price')}
          >
            <Label className="text-sm font-medium text-gray-700">Faixa de Preço (por dia)</Label>
            {expandedSections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.price && (
            <div className="mt-4 space-y-4">
              <div className="px-2">
                <Slider
                  value={[filters.priceMin || 50, filters.priceMax || 500]}
                  onValueChange={handlePriceChange}
                  max={500}
                  min={50}
                  step={10}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatCurrency(filters.priceMin || 50)}</span>
                <span>{formatCurrency(filters.priceMax || 500)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Vehicle Specs */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('specs')}
          >
            <Label className="text-sm font-medium text-gray-700">Especificações do Veículo</Label>
            {expandedSections.specs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.specs && (
            <div className="mt-4 space-y-6">
              {/* Year Range */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Ano do Veículo</Label>
                <div className="px-2">
                  <Slider
                    value={[filters.yearMin || 2015, filters.yearMax || new Date().getFullYear()]}
                    onValueChange={handleYearChange}
                    max={new Date().getFullYear()}
                    min={2010}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{filters.yearMin || 2015}</span>
                  <span>{filters.yearMax || new Date().getFullYear()}</span>
                </div>
              </div>

              {/* Rating */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Avaliação Mínima</Label>
                <div className="px-2">
                  <Slider
                    value={[filters.rating || 3]}
                    onValueChange={handleRatingChange}
                    max={5}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {filters.rating || 3}+ estrelas
                </div>
              </div>

              {/* Seats */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Número de Assentos</Label>
                <div className="px-2">
                  <Slider
                    value={[filters.seatsMin || 2, filters.seatsMax || 7]}
                    onValueChange={handleSeatsChange}
                    max={7}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{filters.seatsMin || 2} assentos</span>
                  <span>{filters.seatsMax || 7} assentos</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => toggleSection('features')}
          >
            <Label className="text-sm font-medium text-gray-700">Recursos Desejados</Label>
            {expandedSections.features ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {expandedSections.features && (
            <div className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.id}
                      checked={(filters.features || []).includes(feature.id)}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked as boolean)}
                    />
                    <Label 
                      htmlFor={feature.id} 
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.category}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('category', undefined)}
                />
              </Badge>
            )}
            {(filters.priceMin || filters.priceMax) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {formatCurrency(filters.priceMin || 50)} - {formatCurrency(filters.priceMax || 500)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    handleFilterChange('priceMin', undefined);
                    handleFilterChange('priceMax', undefined);
                  }}
                />
              </Badge>
            )}
            {filters.fuel && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.fuel}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('fuel', undefined)}
                />
              </Badge>
            )}
            {filters.transmission && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.transmission}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('transmission', undefined)}
                />
              </Badge>
            )}
            {filters.features && filters.features.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.features.length} recursos
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('features', [])}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
