import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useComparisonStore } from "@/lib/comparison";
import { formatCurrency } from "@/lib/currency";
import { X, Star, MapPin, Users, Fuel, Settings, Calendar, Check, Minus } from "lucide-react";
import { Link } from "wouter";

export default function VehicleComparison() {
  const { vehicles, isOpen, toggleComparison, removeVehicle, clearComparison } = useComparisonStore();

  if (vehicles.length === 0) return null;

  const getFeatureComparison = () => {
    const allFeatures = new Set<string>();
    vehicles.forEach(vehicle => {
      vehicle.features.forEach(feature => allFeatures.add(feature));
    });
    return Array.from(allFeatures);
  };

  const getFeatureLabel = (feature: string) => {
    const featureLabels: Record<string, string> = {
      'air_conditioning': 'Ar Condicionado',
      'bluetooth': 'Bluetooth',
      'gps': 'GPS',
      'backup_camera': 'Câmera de Ré',
      'parking_sensors': 'Sensor de Estacionamento',
      'cruise_control': 'Piloto Automático',
      'sunroof': 'Teto Solar',
      'leather_seats': 'Bancos de Couro',
      'heated_seats': 'Bancos Aquecidos',
      'usb_ports': 'Portas USB'
    };
    return featureLabels[feature] || feature;
  };

  const getCategoryLabel = (category: string) => {
    const categoryLabels: Record<string, string> = {
      'hatch': 'Hatch',
      'sedan': 'Sedan',
      'suv': 'SUV',
      'pickup': 'Pickup'
    };
    return categoryLabels[category] || category;
  };

  const getTransmissionLabel = (transmission: string) => {
    const transmissionLabels: Record<string, string> = {
      'manual': 'Manual',
      'automatic': 'Automático',
      'cvt': 'CVT'
    };
    return transmissionLabels[transmission] || transmission;
  };

  const getFuelLabel = (fuel: string) => {
    const fuelLabels: Record<string, string> = {
      'gasoline': 'Gasolina',
      'ethanol': 'Etanol',
      'flex': 'Flex',
      'electric': 'Elétrico',
      'hybrid': 'Híbrido',
      'diesel': 'Diesel'
    };
    return fuelLabels[fuel] || fuel;
  };

  return (
    <>
      {/* Floating Compare Button */}
      {vehicles.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleComparison}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2"
          >
            Comparar ({vehicles.length})
          </Button>
        </div>
      )}

      {/* Comparison Dialog */}
      <Dialog open={isOpen} onOpenChange={toggleComparison}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Comparação de Veículos</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearComparison}>
                  Limpar Tudo
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleComparison}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => removeVehicle(vehicle.id)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardHeader className="pb-4">
                  <div className="relative">
                    <img
                      src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200"}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Badge
                      variant={vehicle.isAvailable ? "default" : "secondary"}
                      className={`absolute top-2 left-2 ${vehicle.isAvailable ? 'bg-green-600' : 'bg-gray-500'}`}
                    >
                      {vehicle.isAvailable ? 'Disponível' : 'Indisponível'}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{vehicle.rating}</span>
                    {vehicle.reviewCount && <span>({vehicle.reviewCount} avaliações)</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(parseFloat(vehicle.pricePerDay))}
                    </div>
                    <div className="text-sm text-gray-500">por dia</div>
                  </div>

                  <Separator />

                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{vehicle.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{vehicle.seats} assentos</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{getTransmissionLabel(vehicle.transmission)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{getFuelLabel(vehicle.fuel)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{getCategoryLabel(vehicle.category)}</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Features Comparison */}
                  <div>
                    <h4 className="font-medium mb-2">Recursos</h4>
                    <div className="space-y-1">
                      {getFeatureComparison().map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          {vehicle.features.includes(feature) ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-300" />
                          )}
                          <span className={vehicle.features.includes(feature) ? '' : 'text-gray-400'}>
                            {getFeatureLabel(feature)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Owner Info */}
                  <div>
                    <h4 className="font-medium mb-2">Proprietário</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        {vehicle.owner.avatar ? (
                          <img src={vehicle.owner.avatar} alt={vehicle.owner.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <span className="text-xs">{vehicle.owner.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{vehicle.owner.name}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{vehicle.owner.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button asChild className="w-full mt-4">
                    <Link href={`/vehicle/${vehicle.id}`}>
                      Ver Detalhes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {vehicles.length < 3 && (
            <div className="text-center text-gray-500 text-sm mt-4">
              Você pode comparar até 3 veículos simultaneamente
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}