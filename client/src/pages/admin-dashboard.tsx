import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import AdminLayout from "@/components/admin-layout";
import { Loading } from "@/components/ui/loading";
import {
  Users,
  Car,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  Clock,
  AlertTriangle,
  Ticket,
  CreditCard
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  // Fetch dashboard metrics with proper error handling
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/metrics'],
    enabled: !!user && user.role === 'admin',
    retry: 2,
    staleTime: 60000, // 1 minute
  });

  console.log('🔍 Admin Dashboard - User:', user?.email, 'Role:', user?.role);
  console.log('🔍 Admin Dashboard - Metrics data:', metrics);
  console.log('🔍 Admin Dashboard - Loading:', isLoading, 'Error:', error);

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 text-sm sm:text-base px-4">Você precisa de privilégios de administrador para acessar esta página.</p>
          <Link href="/">
            <Button className="mt-4 w-full sm:w-auto">Voltar ao Início</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const adminModules = [
    {
      title: "Aprovar Veículos",
      description: "Revisar e aprovar veículos cadastrados pelos usuários",
      icon: Car,
      href: "/admin/vehicle-approval",
      color: "bg-red-500",
      stats: "Aguardando aprovação",
      priority: true
    },
    {
      title: "Verificar Documentos",
      description: "Analisar e validar documentos enviados pelos usuários",
      icon: FileText,
      href: "/admin/document-verification",
      color: "bg-yellow-500",
      stats: "Documentos pendentes",
      priority: true
    },
    {
      title: "Gerenciar Contratos",
      description: "Visualizar e gerenciar todos os contratos da plataforma",
      icon: FileText,
      href: "/admin/contracts",
      color: "bg-blue-500",
      stats: "Contratos ativos"
    },
    {
      title: "Marcas de Veículos",
      description: "Administrar marcas e modelos de veículos aceitos",
      icon: Settings,
      href: "/admin/vehicle-brands",
      color: "bg-green-500",
      stats: "Marcas cadastradas"
    },
    {
      title: "Usuários",
      description: "Gerenciar usuários, verificações e permissões",
      icon: Users,
      href: "/admin/users",
      color: "bg-purple-500",
      stats: "Usuários ativos"
    },
    {
      title: "Relatórios",
      description: "Acessar relatórios de uso e performance da plataforma",
      icon: BarChart3,
      href: "/admin/reports",
      color: "bg-orange-500",
      stats: "Dados em tempo real"
    },
    {
      title: "Reservas",
      description: "Monitorar todas as reservas e status",
      icon: Calendar,
      href: "/admin/bookings",
      color: "bg-indigo-500",
      stats: "Reservas ativas"
    },
    {
      title: "Configurações",
      description: "Taxas de serviço, seguro e políticas do sistema",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-gray-500",
      stats: "Taxas e políticas",
      priority: false
    },
    {
      title: "Cupons de Desconto",
      description: "Criar e gerenciar cupons promocionais para a plataforma",
      icon: Ticket,
      href: "/admin/coupons",
      color: "bg-orange-500",
      stats: "Cupons ativos",
      priority: false
    },
    {
      title: "Assinaturas",
      description: "Gerenciar assinaturas e planos da plataforma",
      icon: CreditCard,
      href: "/admin/subscriptions",
      color: "bg-teal-500",
      stats: "Assinaturas ativas",
      priority: false
    }
  ];

  const quickStats = metrics ? [
    { 
      label: "Total de Usuários", 
      value: (metrics as any).totalUsers?.toString() || "0", 
      change: `${(metrics as any).userGrowth > 0 ? '+' : ''}${(metrics as any).userGrowth}%`, 
      trend: (metrics as any).userGrowth >= 0 ? "up" : "down" 
    },
    { 
      label: "Veículos Ativos", 
      value: (metrics as any).activeVehicles?.toString() || "0", 
      change: "+8%", 
      trend: "up" 
    },
    { 
      label: "Reservas Hoje", 
      value: (metrics as any).todayBookings?.toString() || "0", 
      change: `${(metrics as any).bookingGrowth > 0 ? '+' : ''}${(metrics as any).bookingGrowth}%`, 
      trend: (metrics as any).bookingGrowth >= 0 ? "up" : "down" 
    },
    { 
      label: "Receita Mensal", 
      value: `R$ ${(metrics as any).monthlyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`, 
      change: `${(metrics as any).revenueGrowth > 0 ? '+' : ''}${(metrics as any).revenueGrowth}%`, 
      trend: (metrics as any).revenueGrowth >= 0 ? "up" : "down" 
    },
  ] : [
    { label: "Total de Usuários", value: "...", change: "", trend: "up" },
    { label: "Veículos Ativos", value: "...", change: "", trend: "up" },
    { label: "Reservas Hoje", value: "...", change: "", trend: "up" },
    { label: "Receita Mensal", value: "...", change: "", trend: "up" },
  ];

  const recentAlerts = [
    { type: "warning", message: "3 contratos pendentes de assinatura", time: "2h atrás" },
    { type: "info", message: "Novo veículo aguardando verificação", time: "4h atrás" },
    { type: "error", message: "Problema reportado no sistema de pagamento", time: "6h atrás" }
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          <Loading />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600 mt-2">Bem-vindo, {user.name}</p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <Shield className="h-4 w-4 mr-1" />
                Administrador
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            quickStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    {stat.change && (
                      <div className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Admin Modules */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Módulos Administrativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminModules.map((module, index) => {
                const IconComponent = module.icon;
                return (
                  <Link key={index} href={module.href}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-lg ${module.color} text-white`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          {module.priority && (
                            <Badge variant="destructive" className="text-xs">
                              Prioridade
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{module.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        <p className="text-xs text-gray-500">{module.stats}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'error' ? 'bg-red-500' :
                      alert.type === 'warning' ? 'bg-yellow-500' : 
                      'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/vehicle-approval">
                  <Button variant="outline" className="w-full justify-start">
                    <Car className="h-4 w-4 mr-2" />
                    Aprovar Veículos
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Visualizar Relatórios
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}