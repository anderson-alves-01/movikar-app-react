import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Users, 
  Calendar, 
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  Target,
  Award,
  BarChart3
} from "lucide-react";

interface PerformanceMetrics {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completedBookings: number;
  pendingBookings: number;
  verifiedUsers: number;
  activeListings: number;
  monthlyGrowth: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface ChartData {
  name: string;
  value: number;
  revenue?: number;
  bookings?: number;
  users?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: metrics, isLoading: metricsLoading } = useQuery<PerformanceMetrics>({
    queryKey: ['/api/dashboard/metrics', timeRange],
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<{
    monthly: ChartData[];
    bookingStatus: ChartData[];
    vehicleCategories: ChartData[];
    userActivity: ChartData[];
  }>({
    queryKey: ['/api/dashboard/charts', timeRange],
  });

  const { data: goals, isLoading: goalsLoading } = useQuery<{
    monthlyRevenue: { current: number; target: number };
    newUsers: { current: number; target: number };
    bookingRate: { current: number; target: number };
    satisfaction: { current: number; target: number };
  }>({
    queryKey: ['/api/dashboard/goals'],
  });

  if (metricsLoading || chartLoading || goalsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const getGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    growth, 
    suffix = "",
    prefix = ""
  }: {
    title: string;
    value: number;
    icon: any;
    growth?: number;
    suffix?: string;
    prefix?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {prefix}{value.toLocaleString('pt-BR')}{suffix}
            </p>
            {growth !== undefined && (
              <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(growth)}`}>
                {getGrowthIndicator(growth)}
                <span>{Math.abs(growth)}% vs mês anterior</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const GoalCard = ({ 
    title, 
    current, 
    target, 
    icon: Icon,
    formatter = (val: number) => val.toString()
  }: {
    title: string;
    current: number;
    target: number;
    icon: any;
    formatter?: (val: number) => string;
  }) => {
    const progress = Math.min((current / target) * 100, 100);
    const isCompleted = current >= target;
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Icon className={`w-5 h-5 ${isCompleted ? 'text-green-600' : 'text-primary'}`} />
              <h3 className="font-medium">{title}</h3>
            </div>
            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Atual: {formatter(current)}</span>
              <span>Meta: {formatter(target)}</span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${isCompleted ? 'bg-green-100' : ''}`}
            />
            <p className="text-xs text-gray-600">
              {progress.toFixed(1)}% da meta alcançada
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <span>Dashboard de Performance</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Acompanhe métricas, metas e progresso da plataforma em tempo real
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' && '7 dias'}
              {range === '30d' && '30 dias'}
              {range === '90d' && '90 dias'}
              {range === '1y' && '1 ano'}
            </Button>
          ))}
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Usuários Totais"
          value={metrics?.totalUsers || 0}
          icon={Users}
          growth={metrics?.userGrowth}
        />
        <MetricCard
          title="Veículos Ativos"
          value={metrics?.activeListings || 0}
          icon={Car}
          growth={metrics?.monthlyGrowth}
        />
        <MetricCard
          title="Reservas Totais"
          value={metrics?.totalBookings || 0}
          icon={Calendar}
          growth={12}
        />
        <MetricCard
          title="Receita Total"
          value={metrics?.totalRevenue || 0}
          icon={DollarSign}
          growth={metrics?.revenueGrowth}
          prefix="R$ "
        />
      </div>

      {/* Métricas Secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avaliação Média"
          value={metrics?.averageRating || 0}
          icon={Star}
          suffix="/5"
        />
        <MetricCard
          title="Usuários Verificados"
          value={metrics?.verifiedUsers || 0}
          icon={CheckCircle}
        />
        <MetricCard
          title="Reservas Concluídas"
          value={metrics?.completedBookings || 0}
          icon={CheckCircle}
        />
        <MetricCard
          title="Reservas Pendentes"
          value={metrics?.pendingBookings || 0}
          icon={Clock}
        />
      </div>

      {/* Metas e Objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-6 h-6" />
            <span>Metas do Mês</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {goals && (
              <>
                <GoalCard
                  title="Receita Mensal"
                  current={goals.monthlyRevenue.current}
                  target={goals.monthlyRevenue.target}
                  icon={DollarSign}
                  formatter={formatCurrency}
                />
                <GoalCard
                  title="Novos Usuários"
                  current={goals.newUsers.current}
                  target={goals.newUsers.target}
                  icon={Users}
                />
                <GoalCard
                  title="Taxa de Reservas"
                  current={goals.bookingRate.current}
                  target={goals.bookingRate.target}
                  icon={Calendar}
                  formatter={(val) => `${val}%`}
                />
                <GoalCard
                  title="Satisfação"
                  current={goals.satisfaction.current}
                  target={goals.satisfaction.target}
                  icon={Star}
                  formatter={(val) => `${val}/5`}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0088FE" 
                    fill="#0088FE" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Reservas por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData?.monthly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Reservas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData?.bookingStatus || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(chartData?.bookingStatus || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData?.monthly || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#FFBB28" 
                    strokeWidth={3}
                    dot={{ fill: '#FFBB28', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Veículos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData?.vehicleCategories || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Awards e Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-6 h-6" />
            <span>Conquistas Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium">100+ Usuários</p>
                <p className="text-sm text-gray-600">Meta alcançada este mês</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Star className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium">Avaliação 4.5+</p>
                <p className="text-sm text-gray-600">Excelente satisfação</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium">Crescimento 25%</p>
                <p className="text-sm text-gray-600">Aumento mensal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}