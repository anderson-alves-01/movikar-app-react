import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings, DollarSign, Shield, Clock, Mail, Phone, Save, AlertCircle, Smartphone, CreditCard, Crown } from "lucide-react";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";
import { Link } from "wouter";
import type { AdminSettings } from "@shared/admin-settings";

function AdminSettingsPage() {
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
    supportEmail: "sac@alugae.mobi",
    supportPhone: "(11) 9999-9999",
    enablePixPayment: false,
    enablePixTransfer: true,
    pixTransferDescription: "Repasse alugae",
    essentialPlanPrice: 29.90,
    plusPlanPrice: 59.90,
    annualDiscountPercentage: 20.00,
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
      const data = await response.json();
      console.log('📋 Admin settings loaded from API:', data);
      return data as AdminSettings;
    },
    staleTime: 0, // Consider data immediately stale
    gcTime: 0, // Don't cache the data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Update settings when data is loaded
  React.useEffect(() => {
    if (currentSettings && typeof currentSettings === 'object') {
      console.log('🔄 Atualizando interface com dados do banco:', currentSettings);
      setSettings({
        serviceFeePercentage: currentSettings.serviceFeePercentage || 10,
        insuranceFeePercentage: currentSettings.insuranceFeePercentage || 15,
        minimumBookingDays: currentSettings.minimumBookingDays || 1,
        maximumBookingDays: currentSettings.maximumBookingDays || 30,
        cancellationPolicyDays: currentSettings.cancellationPolicyDays || 2,
        currency: currentSettings.currency || "BRL",
        supportEmail: currentSettings.supportEmail || "sac@alugae.mobi",
        supportPhone: currentSettings.supportPhone || "(11) 9999-9999",
        enablePixPayment: currentSettings.enablePixPayment || false,
        enablePixTransfer: currentSettings.enablePixTransfer || true,
        pixTransferDescription: currentSettings.pixTransferDescription || "Repasse alugae",
        essentialPlanPrice: parseFloat(currentSettings.essentialPlanPrice) || 29.90,
        plusPlanPrice: parseFloat(currentSettings.plusPlanPrice) || 59.90,
        annualDiscountPercentage: parseFloat(currentSettings.annualDiscountPercentage) || 20.00,
      });
    }
  }, [currentSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: AdminSettings) => {
      console.log('💾 Enviando configurações para salvar:', newSettings);
      const response = await apiRequest('PUT', '/api/admin/settings', newSettings);
      const data = await response.json();
      console.log('💾 Resposta do servidor após salvar:', data);
      return data;
    },
    onSuccess: (updatedData) => {
      console.log('✅ Configurações salvas com sucesso:', updatedData);
      
      // Force aggressive cache invalidation and refetch
      queryClient.removeQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.refetchQueries({ queryKey: ['/api/admin/settings'] });
      
      // Also update the local state immediately to prevent UI lag
      if (updatedData && typeof updatedData === 'object') {
        setSettings({
          serviceFeePercentage: updatedData.serviceFeePercentage || 10,
          insuranceFeePercentage: updatedData.insuranceFeePercentage || 15,
          minimumBookingDays: updatedData.minimumBookingDays || 1,
          maximumBookingDays: updatedData.maximumBookingDays || 30,
          cancellationPolicyDays: updatedData.cancellationPolicyDays || 2,
          currency: updatedData.currency || "BRL",
          supportEmail: updatedData.supportEmail || "sac@alugae.mobi",
          supportPhone: updatedData.supportPhone || "(11) 9999-9999",
          enablePixPayment: updatedData.enablePixPayment || false,
          enablePixTransfer: updatedData.enablePixTransfer || true,
          pixTransferDescription: updatedData.pixTransferDescription || "Repasse alugae",
          essentialPlanPrice: parseFloat(updatedData.essentialPlanPrice) || 29.90,
          plusPlanPrice: parseFloat(updatedData.plusPlanPrice) || 59.90,
          annualDiscountPercentage: parseFloat(updatedData.annualDiscountPercentage) || 20.00,
        });
      }
      
      toast({
        title: "Configurações Atualizadas",
        description: "As configurações do sistema foram salvas com sucesso no banco de dados.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      console.error('❌ Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar as configurações no banco de dados.",
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

  const handleInputChange = (field: keyof AdminSettings, value: string | number | boolean) => {
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            
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

            {/* Configurações de Planos de Assinatura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  Planos de Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="essentialPrice">Preço Plano Essencial (R$)</Label>
                  <Input
                    id="essentialPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.essentialPlanPrice}
                    onChange={(e) => handleInputChange('essentialPlanPrice', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço mensal do plano Essencial (destaque prata)
                  </p>
                </div>

                <div>
                  <Label htmlFor="plusPrice">Preço Plano Plus (R$)</Label>
                  <Input
                    id="plusPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.plusPlanPrice}
                    onChange={(e) => handleInputChange('plusPlanPrice', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Preço mensal do plano Plus (destaque diamante)
                  </p>
                </div>

                <div>
                  <Label htmlFor="annualDiscount">Desconto Anual (%)</Label>
                  <Input
                    id="annualDiscount"
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={settings.annualDiscountPercentage}
                    onChange={(e) => handleInputChange('annualDiscountPercentage', parseFloat(e.target.value) || 0)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Percentual de desconto para pagamento anual
                  </p>
                </div>

                {/* Preview de preços anuais */}
                <div className="bg-purple-50 p-4 rounded-lg mt-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Preview de Preços Anuais:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Essencial mensal:</span>
                      <span>R$ {settings.essentialPlanPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Essencial anual:</span>
                      <span>R$ {(settings.essentialPlanPrice * 12 * (1 - settings.annualDiscountPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plus mensal:</span>
                      <span>R$ {settings.plusPlanPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Plus anual:</span>
                      <span>R$ {(settings.plusPlanPrice * 12 * (1 - settings.annualDiscountPercentage / 100)).toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-purple-600 mt-2">
                      Economia anual: {settings.annualDiscountPercentage}% ({(settings.annualDiscountPercentage * 12 / 100).toFixed(1)} meses grátis)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Pagamento PIX */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  Sistema de Pagamento PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="enablePixPayment" className="text-sm font-medium">
                      Aceitar PIX como Pagamento
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Permite que locatários paguem via PIX (requer configuração Stripe PIX)
                    </p>
                  </div>
                  <Switch
                    id="enablePixPayment"
                    checked={settings.enablePixPayment}
                    onCheckedChange={(checked) => handleInputChange('enablePixPayment', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="enablePixTransfer" className="text-sm font-medium">
                      Repasses PIX Automáticos
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Ativa repasses automáticos via PIX para proprietários
                    </p>
                  </div>
                  <Switch
                    id="enablePixTransfer"
                    checked={settings.enablePixTransfer}
                    onCheckedChange={(checked) => handleInputChange('enablePixTransfer', checked)}
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="pixTransferDescription">Descrição do PIX</Label>
                  <Input
                    id="pixTransferDescription"
                    value={settings.pixTransferDescription}
                    onChange={(e) => handleInputChange('pixTransferDescription', e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                    placeholder="Ex: Repasse alugae"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Texto que aparece na transferência PIX para os proprietários
                  </p>
                </div>

                {/* PIX Status Cards */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Pagamentos</span>
                    </div>
                    <p className="text-xs text-green-600">
                      {settings.enablePixPayment ? 'PIX Ativo' : 'Apenas Cartão'}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Repasses</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      {settings.enablePixTransfer ? 'Automático' : 'Manual'}
                    </p>
                  </div>
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

export default AdminSettingsPage;