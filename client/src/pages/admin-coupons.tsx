import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Ticket, Plus, Edit, Trash2, Copy, Calendar, Users, DollarSign } from "lucide-react";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";
import { Link } from "wouter";
import type { Coupon, InsertCoupon } from "@shared/coupon-schema";

export default function AdminCouponsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  // Debug authentication state
  console.log("Admin Coupons Page - User:", user);
  console.log("Admin Coupons Page - Auth Storage:", localStorage.getItem('auth-storage'));
  
  const getAuthToken = () => {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const authData = JSON.parse(authStorage);
        return authData.state?.token || authData.token;
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
    return null;
  };
  
  console.log("Admin Coupons Page - Token:", getAuthToken());
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<InsertCoupon>>({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    maxUses: 1,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  });

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
              <p className="text-gray-600">Você precisa de privilégios de administrador para acessar esta página.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: couponsData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/coupons'],
    retry: false,
    enabled: !!user && user.role === 'admin', // Only run query if user is admin
  });

  const coupons = Array.isArray(couponsData) ? couponsData : [];
  
  console.log("🎫 Final coupons array:", coupons);
  console.log("🎫 Coupons length:", coupons.length);

  const createCouponMutation = useMutation({
    mutationFn: async (couponData: InsertCoupon) => {
      return await apiRequest('POST', '/api/admin/coupons', couponData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({
        title: "Cupom Criado",
        description: "Cupom de desconto criado com sucesso.",
      });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar cupom.",
        variant: "destructive",
      });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, ...couponData }: Partial<InsertCoupon> & { id: number }) => {
      return await apiRequest('PUT', `/api/admin/coupons/${id}`, couponData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({
        title: "Cupom Atualizado",
        description: "Cupom de desconto atualizado com sucesso.",
      });
      setEditingCoupon(null);
      resetForm();
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({
        title: "Cupom Excluído",
        description: "Cupom de desconto excluído com sucesso.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 0,
      maxUses: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.description || !formData.validUntil) {
      toast({
        title: "Erro de Validação",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const couponData = {
      ...formData,
      createdBy: user.id,
    } as InsertCoupon;

    if (editingCoupon) {
      updateCouponMutation.mutate({ id: editingCoupon.id, ...couponData });
    } else {
      createCouponMutation.mutate(couponData);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código Copiado",
      description: `Código ${code} copiado para a área de transferência.`,
    });
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}% OFF`;
    } else {
      return `R$ ${(coupon.discountValue / 100).toFixed(2)} OFF`;
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { label: "Inativo", variant: "secondary" as const };
    if (coupon.validUntil && now > new Date(coupon.validUntil)) return { label: "Expirado", variant: "destructive" as const };
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { label: "Esgotado", variant: "outline" as const };
    return { label: "Ativo", variant: "default" as const };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Ticket className="h-8 w-8 text-primary" />
                Cupons de Desconto
              </h1>
              <p className="text-gray-600 mt-2">
                Gerencie cupons de desconto para a plataforma
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  ← Voltar ao Painel
                </Button>
              </Link>
              <Dialog open={isCreateModalOpen || !!editingCoupon} onOpenChange={(open) => {
                if (!open) {
                  setIsCreateModalOpen(false);
                  setEditingCoupon(null);
                  resetForm();
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Cupom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCoupon ? "Modifique as informações do cupom de desconto" : "Preencha os dados para criar um novo cupom de desconto"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code">Código do Cupom *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        placeholder="ex: DESCONTO10"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição do cupom de desconto"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tipo de Desconto</Label>
                        <Select
                          value={formData.discountType}
                          onValueChange={(value: "percentage" | "fixed") => setFormData(prev => ({ ...prev, discountType: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentual</SelectItem>
                            <SelectItem value="fixed">Valor Fixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Valor do Desconto</Label>
                        <Input
                          type="number"
                          value={formData.discountValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseInt(e.target.value) || 0 }))}
                          placeholder={formData.discountType === "percentage" ? "10" : "1000"}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.discountType === "percentage" ? "% de desconto" : "Centavos (ex: 1000 = R$10,00)"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Valor Mínimo (centavos)</Label>
                        <Input
                          type="number"
                          value={formData.minOrderValue}
                          onChange={(e) => setFormData(prev => ({ ...prev, minOrderValue: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Máximo de Usos</Label>
                        <Input
                          type="number"
                          value={formData.maxUses}
                          onChange={(e) => setFormData(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                          placeholder="1"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Data de Expiração *</Label>
                      <Input
                        type="datetime-local"
                        value={formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUntil: new Date(e.target.value) }))}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setEditingCoupon(null);
                          resetForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={createCouponMutation.isPending || updateCouponMutation.isPending}
                      >
                        {editingCoupon ? "Atualizar" : "Criar"} Cupom
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando cupons...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Erro ao carregar cupons
              </h3>
              <p className="text-gray-500 mb-4">
                {error.message?.includes('401') || error.message?.includes('403') 
                  ? "Você precisa estar logado como administrador para acessar esta página"
                  : error.message || "Verifique sua conexão e permissões"}
              </p>
              {error.message?.includes('401') || error.message?.includes('403') ? (
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Fazer Login
                </Button>
              ) : (
                <Button 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] })}
                  variant="outline"
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(coupons) && coupons.map((coupon: Coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-primary/10 p-2 rounded-lg">
                            <Ticket className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold">
                              {coupon.code}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyCouponCode(coupon.code)}
                                className="ml-2 h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </CardTitle>
                            <Badge variant={status.variant} className="text-xs">
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{coupon.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Desconto:</span>
                          <span className="font-semibold text-green-600">
                            {formatDiscount(coupon)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Usos:</span>
                          <span>{coupon.usedCount || 0}/{coupon.maxUses}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Expira em:</span>
                          <span>{new Date(coupon.validUntil).toLocaleDateString()}</span>
                        </div>
                        
                        {(coupon.minOrderValue || 0) > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Valor mín.:</span>
                            <span>R$ {((coupon.minOrderValue || 0) / 100).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCoupon(coupon);
                            setFormData({
                              code: coupon.code,
                              description: coupon.description,
                              discountType: coupon.discountType as "percentage" | "fixed",
                              discountValue: coupon.discountValue,
                              minOrderValue: coupon.minOrderValue || 0,
                              maxUses: coupon.maxUses || 1,
                              validUntil: new Date(coupon.validUntil),
                            });
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          disabled={deleteCouponMutation.isPending}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {Array.isArray(coupons) && coupons.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum cupom criado</h3>
                  <p className="text-gray-600">Crie seu primeiro cupom de desconto para começar.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}