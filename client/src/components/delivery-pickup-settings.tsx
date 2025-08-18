import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Plane, Home, Navigation, DollarSign, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface DeliveryPickupSettingsProps {
  deliveryOptions: {
    homeDelivery: boolean;
    airportDelivery: boolean;
    customLocation: boolean;
    deliveryFee: number;
    deliveryRadius: number;
  };
  pickupTimeFlexibility: {
    flexible24h: boolean;
    specificHours: string;
    weekendAvailable: boolean;
    emergencyPickup: boolean;
  };
  onDeliveryOptionsChange: (options: any) => void;
  onPickupFlexibilityChange: (options: any) => void;
  disabled?: boolean;
}

export default function DeliveryPickupSettings({
  deliveryOptions,
  pickupTimeFlexibility,
  onDeliveryOptionsChange,
  onPickupFlexibilityChange,
  disabled = false,
}: DeliveryPickupSettingsProps) {
  
  const handleDeliveryChange = (field: string, value: any) => {
    onDeliveryOptionsChange({
      ...deliveryOptions,
      [field]: value,
    });
  };

  const handlePickupChange = (field: string, value: any) => {
    onPickupFlexibilityChange({
      ...pickupTimeFlexibility,
      [field]: value,
    });
  };

  const hasDeliveryOptions = deliveryOptions.homeDelivery || 
                            deliveryOptions.airportDelivery || 
                            deliveryOptions.customLocation;

  const hasFlexiblePickup = pickupTimeFlexibility.flexible24h || 
                           pickupTimeFlexibility.weekendAvailable || 
                           pickupTimeFlexibility.emergencyPickup;

  return (
    <div className="space-y-6">
      {/* Delivery Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Opções de Entrega</span>
            {hasDeliveryOptions && (
              <Badge variant="secondary" className="ml-2">
                Flexível
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Ofereça maior comodidade aos locatários com opções de entrega flexíveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Home Delivery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Home className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Entrega em Casa</Label>
                <p className="text-xs text-gray-500">
                  Entregar o veículo na residência do locatário
                </p>
              </div>
            </div>
            <Switch
              checked={deliveryOptions.homeDelivery}
              onCheckedChange={(value) => handleDeliveryChange('homeDelivery', value)}
              disabled={disabled}
              data-testid="switch-home-delivery"
            />
          </div>

          {/* Airport Delivery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plane className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Entrega no Aeroporto</Label>
                <p className="text-xs text-gray-500">
                  Ideal para turistas e viajantes a negócios
                </p>
              </div>
            </div>
            <Switch
              checked={deliveryOptions.airportDelivery}
              onCheckedChange={(value) => handleDeliveryChange('airportDelivery', value)}
              disabled={disabled}
              data-testid="switch-airport-delivery"
            />
          </div>

          {/* Custom Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Navigation className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium">Local Personalizado</Label>
                <p className="text-xs text-gray-500">
                  Entrega em qualquer local dentro do raio de atendimento
                </p>
              </div>
            </div>
            <Switch
              checked={deliveryOptions.customLocation}
              onCheckedChange={(value) => handleDeliveryChange('customLocation', value)}
              disabled={disabled}
              data-testid="switch-custom-location"
            />
          </div>

          {/* Delivery Settings - only show if any delivery option is enabled */}
          {hasDeliveryOptions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="delivery-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10"
                    value={deliveryOptions.deliveryFee || ''}
                    onChange={(e) => handleDeliveryChange('deliveryFee', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    data-testid="input-delivery-fee"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Taxa adicional por entrega (opcional)
                </p>
              </div>

              <div>
                <Label htmlFor="delivery-radius">Raio de Atendimento (km)</Label>
                <Input
                  id="delivery-radius"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="20"
                  value={deliveryOptions.deliveryRadius || ''}
                  onChange={(e) => handleDeliveryChange('deliveryRadius', parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  data-testid="input-delivery-radius"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Distância máxima para entrega
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pickup Time Flexibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-600" />
            <span>Flexibilidade de Horários</span>
            {hasFlexiblePickup && (
              <Badge variant="secondary" className="ml-2">
                24h Disponível
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Configure a disponibilidade de horários para retirada e devolução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 24/7 Availability */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Disponível 24 Horas</Label>
              <p className="text-xs text-gray-500">
                Permite retirada e devolução a qualquer horário
              </p>
            </div>
            <Switch
              checked={pickupTimeFlexibility.flexible24h}
              onCheckedChange={(value) => handlePickupChange('flexible24h', value)}
              disabled={disabled}
              data-testid="switch-24h-availability"
            />
          </div>

          {/* Specific Hours - only show if 24h is disabled */}
          {!pickupTimeFlexibility.flexible24h && (
            <div>
              <Label htmlFor="specific-hours">Horário de Funcionamento</Label>
              <Input
                id="specific-hours"
                placeholder="08:00-18:00"
                value={pickupTimeFlexibility.specificHours}
                onChange={(e) => handlePickupChange('specificHours', e.target.value)}
                disabled={disabled}
                data-testid="input-specific-hours"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ex: 08:00-18:00 (formato 24h com hífen)
              </p>
            </div>
          )}

          {/* Weekend Availability */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Fins de Semana</Label>
              <p className="text-xs text-gray-500">
                Disponível aos sábados e domingos
              </p>
            </div>
            <Switch
              checked={pickupTimeFlexibility.weekendAvailable}
              onCheckedChange={(value) => handlePickupChange('weekendAvailable', value)}
              disabled={disabled}
              data-testid="switch-weekend-availability"
            />
          </div>

          {/* Emergency Pickup */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Retirada de Emergência</Label>
              <p className="text-xs text-gray-500">
                Disponível para situações urgentes (taxa adicional pode ser aplicada)
              </p>
            </div>
            <Switch
              checked={pickupTimeFlexibility.emergencyPickup}
              onCheckedChange={(value) => handlePickupChange('emergencyPickup', value)}
              disabled={disabled}
              data-testid="switch-emergency-pickup"
            />
          </div>
        </CardContent>
      </Card>

      {/* Benefits Info */}
      {(hasDeliveryOptions || hasFlexiblePickup) && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">
                  Benefícios da Flexibilidade
                </h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Maior atratividade para locatários</li>
                  <li>• Possibilidade de cobrança de taxas adicionais</li>
                  <li>• Diferencial competitivo no mercado</li>
                  <li>• Melhor experiência do usuário</li>
                  <li>• Maior ocupação do veículo</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}