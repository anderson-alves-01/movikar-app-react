
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import { useAuthStore } from "@/lib/auth";
import { BarChart3, TrendingUp, Users, Car, AlertCircle, DollarSign } from "lucide-react";

export default function AdminReports() {
  const { user } = useAuthStore();

  // Verificar se é admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
              <p className="text-gray-600">Você precisa de privilégios de administrador para acessar esta página.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  interface ReportsData {
    totalUsers?: number;
    totalVehicles?: number;
    totalRevenue?: number;
    activeBookings?: number;
    conversionRate?: number;
    avgRating?: number;
  }

  const { data: reportsData = {} as ReportsData, isLoading } = useQuery<ReportsData>({
    queryKey: ['/api/admin/reports'],
    retry: false,
    enabled: !!user && user.role === 'admin',
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-orange-500" />
                Relatórios Administrativos
              </h1>
              <p className="text-gray-600 mt-2">
                Análises e métricas da plataforma alugae
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin">
                <Button variant="outline">
                  ← Voltar ao Painel
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost">
                  🏠 Ir para o Site
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-300 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total de Usuários */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.totalUsers || "0"}</div>
                  <p className="text-xs text-muted-foreground">
                    Usuários registrados na plataforma
                  </p>
                </CardContent>
              </Card>

              {/* Total de Veículos */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Veículos Cadastrados</CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.totalVehicles || "0"}</div>
                  <p className="text-xs text-muted-foreground">
                    Veículos disponíveis para aluguel
                  </p>
                </CardContent>
              </Card>

              {/* Receita Total */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    R$ {reportsData?.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Receita de reservas concluídas
                  </p>
                </CardContent>
              </Card>

              {/* Reservas Ativas */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.activeBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Reservas em andamento
                  </p>
                </CardContent>
              </Card>

              {/* Taxa de Conversão */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.conversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    Reservas aprovadas / Total de pedidos
                  </p>
                </CardContent>
              </Card>

              {/* Satisfação do Cliente */}
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportsData?.avgRating?.toFixed(1) || '0.0'}/5</div>
                  <p className="text-xs text-muted-foreground">
                    Avaliação média dos usuários
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráficos e Análises Detalhadas */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Análises Detalhadas</CardTitle>
                <CardDescription>
                  Métricas avançadas e tendências da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Relatórios Avançados em Desenvolvimento
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Em breve você terá acesso a gráficos interativos e análises detalhadas.
                  </p>
                  <Badge variant="secondary">Em Breve</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}