import { useAuthStore } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
  Ticket
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuthStore();

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
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
    }
  ];

  const quickStats = [
    { label: "Total de Usuários", value: "1,234", change: "+5%", trend: "up" },
    { label: "Veículos Ativos", value: "456", change: "+12%", trend: "up" },
    { label: "Reservas Hoje", value: "78", change: "-2%", trend: "down" },
    { label: "Receita Mensal", value: "R$ 45.6k", change: "+18%", trend: "up" }
  ];

  const recentAlerts = [
    { type: "warning", message: "3 contratos pendentes de assinatura", time: "2h atrás" },
    { type: "info", message: "Novo veículo aguardando verificação", time: "4h atrás" },
    { type: "error", message: "Problema reportado no sistema de pagamento", time: "6h atrás" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600 mt-2">Bem-vindo, {user.name}</p>
            </div>
            <div className="flex gap-2 items-center">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  🏠 Ir para o Site
                </Button>
              </Link>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                <Shield className="h-4 w-4 mr-1" />
                Administrador
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${module.color} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {module.stats}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.type === 'error' ? 'bg-red-500' : 
                      alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {alert.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Verificar Usuários Pendentes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Car className="h-4 w-4 mr-2" />
                  Aprovar Veículos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Revisar Contratos
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pagamentos</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}