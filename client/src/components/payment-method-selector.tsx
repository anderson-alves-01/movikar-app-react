import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Zap } from "lucide-react";
import { getClientFeatureFlags } from "@shared/feature-flags";

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
}

export default function PaymentMethodSelector({ selectedMethod, onMethodChange }: PaymentMethodSelectorProps) {
  const featureFlags = getClientFeatureFlags();
  
  // If PIX is not enabled, automatically select card
  if (!featureFlags.pixPaymentEnabled && selectedMethod === 'pix') {
    onMethodChange('card');
  }
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Forma de Pagamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedMethod} 
          onValueChange={onMethodChange}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold">Cartão de Crédito/Débito</div>
                <div className="text-sm text-gray-600">Pagamento imediato com cartão</div>
              </div>
            </Label>
          </div>
          
          {/* PIX option - only available in production */}
          {featureFlags.pixPaymentEnabled && (
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix" className="flex items-center gap-3 cursor-pointer flex-1">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    PIX 
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      <Zap className="h-3 w-3" />
                      Instantâneo
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">Pagamento via PIX - aprovação imediata</div>
                </div>
              </Label>
            </div>
          )}
        </RadioGroup>
        
        {/* PIX Instructions - only show if PIX is enabled and selected */}
        {featureFlags.pixPaymentEnabled && selectedMethod === 'pix' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-green-800 mb-1">Como funciona o PIX:</div>
                <ul className="text-green-700 space-y-1">
                  <li>• Você receberá um QR Code para pagamento</li>
                  <li>• Escaneie com o app do seu banco</li>
                  <li>• Confirmação imediata após o pagamento</li>
                  <li>• Disponível 24h por dia, 7 dias por semana</li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}