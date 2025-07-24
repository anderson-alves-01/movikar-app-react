import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchFilters } from "@/types";

interface VehicleFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export default function VehicleFilters({ filters, onFiltersChange }: VehicleFiltersProps) {
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Categoria</Label>
            <Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="hatch">Hatch</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Preço/dia</Label>
            <Select 
              value={filters.priceMax ? `${filters.priceMax}` : ''} 
              onValueChange={(value) => {
                if (value === '') {
                  handleFilterChange('priceMax', undefined);
                  handleFilterChange('priceMin', undefined);
                } else if (value === '100') {
                  handleFilterChange('priceMax', 100);
                  handleFilterChange('priceMin', undefined);
                } else if (value === '200') {
                  handleFilterChange('priceMin', 100);
                  handleFilterChange('priceMax', 200);
                } else if (value === '500') {
                  handleFilterChange('priceMin', 200);
                  handleFilterChange('priceMax', undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="100">Até R$ 100</SelectItem>
                <SelectItem value="200">R$ 100-200</SelectItem>
                <SelectItem value="500">R$ 200+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Combustível</Label>
            <Select value={filters.fuel || ''} onValueChange={(value) => handleFilterChange('fuel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="gasoline">Gasolina</SelectItem>
                <SelectItem value="ethanol">Etanol</SelectItem>
                <SelectItem value="flex">Flex</SelectItem>
                <SelectItem value="electric">Elétrico</SelectItem>
                <SelectItem value="hybrid">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Transmissão</Label>
            <Select value={filters.transmission || ''} onValueChange={(value) => handleFilterChange('transmission', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
                <SelectItem value="cvt">CVT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">Avaliação</Label>
            <Select 
              value={filters.rating ? `${filters.rating}` : ''} 
              onValueChange={(value) => handleFilterChange('rating', value ? parseFloat(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer</SelectItem>
                <SelectItem value="4">4+ estrelas</SelectItem>
                <SelectItem value="4.5">4.5+ estrelas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end space-x-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={clearFilters}
            >
              Limpar
            </Button>
            <Button className="flex-1 bg-gray-800 text-white hover:bg-gray-900 transition-colors">
              Filtrar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
