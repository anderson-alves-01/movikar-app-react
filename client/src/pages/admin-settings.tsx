import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, DollarSign, Shield, Clock, Mail, Phone, Save, AlertCircle } from "lucide-react";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";
import { Link } from "wouter";
import type { AdminSettings } from "@shared/admin-settings";

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>({
    serviceFeePercentage: 10,
    insuranceFeePercentage: 15,
    minimumBookingDays: 1,
    maximumBookingDays: 30,
    cancellationPolicyDays: 2,
    currency: "BRL",
    supportEmail: "suporte@carshare.com",
    supportPhone: "(11) 9999-9999",
  });

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
              <p className="text-gray-600">Você precisa de privilégios de administrador para acessar esta página.</p>
              <Link href="/">
                <Button className="mt-4">Voltar ao Início</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/settings');
      return response;
    },
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
      }
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      return await apiRequest('PUT', '/api/admin/settings', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: "Configurações Atualizadas",
        description: "As configurações do sistema foram salvas com sucesso.",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Validações
    if (settings.serviceFeePercentage < 0 || settings.serviceFeePercentage > 50) {
      toast({
        title: "Erro de Validação",
        description: "Taxa de serviço deve estar entre 0% e 50%.",
        variant: "destructive",
      });
      return;
    }

    if (settings.insuranceFeePercentage < 0 || settings.insuranceFeePercentage > 30) {
      toast({
        title: "Erro de Validação",
        description: "Taxa de seguro deve estar entre 0% e 30%.",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate(settings);
  };

  const handleInputChange = (field: keyof AdminSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                Configurações do Sistema
              </h1>
              <p className="text-gray-600 mt-2">
                Configure taxas, políticas e parâmetros gerais da plataforma
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  ← Voltar ao Painel
                </Button>
              </Link>
              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateSettingsMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Editar Configurações
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Taxas e Fees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Taxas e Tarifas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serviceFee">Taxa de Serviço (%)</Label>
                  <Input
                    id="serviceFee"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={settings.serviceFeePercentage}
                    onChange={(e) => handleInputChange('serviceFeePercentage', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa cobrada sobre o valor da reserva (máx. 50%)
                  </p>
                </div>

                <div>
                  <Label htmlFor="insuranceFee">Taxa de Seguro (%)</Label>
                  <Input
                    id="insuranceFee"
                    type="number"
                    min="0"
                    max="30"
                    step="0.1"
                    value={settings.insuranceFeePercentage}
                    onChange={(e) => handleInputChange('insuranceFeePercentage', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Taxa de seguro cobrada por reserva (máx. 30%)
                  </p>
                </div>

                <div>
                  <Label htmlFor="currency">Moeda</Label>
                  <Input
                    id="currency"
                    value={settings.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Políticas de Reserva */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Políticas de Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="minDays">Mínimo de Dias</Label>
                  <Input
                    id="minDays"
                    type="number"
                    min="1"
                    value={settings.minimumBookingDays}
                    onChange={(e) => handleInputChange('minimumBookingDays', parseInt(e.target.value) || 1)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="maxDays">Máximo de Dias</Label>
                  <Input
                    id="maxDays"
                    type="number"
                    min="1"
                    value={settings.maximumBookingDays}
                    onChange={(e) => handleInputChange('maximumBookingDays', parseInt(e.target.value) || 30)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="cancelDays">Prazo para Cancelamento</Label>
                  <Input
                    id="cancelDays"
                    type="number"
                    min="0"
                    value={settings.cancellationPolicyDays}
                    onChange={(e) => handleInputChange('cancellationPolicyDays', parseInt(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dias de antecedência para cancelamento sem multa
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-purple-600" />
                  Suporte e Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="supportEmail">Email de Suporte</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="supportPhone">Telefone de Suporte</Label>
                  <Input
                    id="supportPhone"
                    value={settings.supportPhone}
                    onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Preview de Cálculo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Simulação de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Exemplo para reserva de R$ 100,00:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Valor base:</span>
                      <span>R$ 100,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de serviço ({settings.serviceFeePercentage}%):</span>
                      <span>R$ {(100 * settings.serviceFeePercentage / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de seguro ({settings.insuranceFeePercentage}%):</span>
                      <span>R$ {(100 * settings.insuranceFeePercentage / 100).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>
                        R$ {(100 + (100 * settings.serviceFeePercentage / 100) + (100 * settings.insuranceFeePercentage / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}