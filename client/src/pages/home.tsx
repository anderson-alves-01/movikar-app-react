import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import VehicleCard from "@/components/vehicle-card";
import VehicleFilters from "@/components/vehicle-filters";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchFilters } from "@/types";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSearch } from "@/contexts/SearchContext";
import { CarLoading, VehicleCardSkeleton } from "@/components/ui/loading";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function Home() {
  const { filters, clearFilters } = useSearch();
  const [localFilters, setLocalFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  // Handle OAuth success on home page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    
    if (oauthSuccess === '1') {
      console.log('🔍 Home: OAuth success detected, loading user data...');
      
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Force auth check to reload user data
      const checkAuthAfterOAuth = async () => {
        try {
          const response = await fetch('/api/auth/user', {
            method: 'GET',
            credentials: 'include',
          });

          if (response.ok) {
            const userData = await response.json();
            console.log('✅ Home: User data loaded after OAuth:', userData.email);
            setAuth(userData, '');
            
            toast({
              title: "✅ Login realizado com sucesso!",
              description: `Bem-vindo, ${userData.name}!`,
            });
          } else {
            console.error('❌ Home: Failed to load user after OAuth');
          }
        } catch (error) {
          console.error('❌ Home: Error loading user after OAuth:', error);
        }
      };

      checkAuthAfterOAuth();
    }
  }, [setAuth, toast]);
  
  // Combine global filters from header with local filters
  const combinedFilters = { ...filters, ...localFilters };

  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['/api/vehicles', combinedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(combinedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const response = await fetch(`/api/vehicles?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      return response.json();
    },
  });

  const handleSearch = (searchFilters: SearchFilters) => {
    setLocalFilters(searchFilters);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearAllFilters = () => {
    setLocalFilters({});
    clearFilters();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16"></div>
      
      <HeroSection onSearch={handleSearch} />
      <OnboardingFlow page="home" />
      
      {/* Subscription Banner */}
      <section className="py-8 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <div className="flex items-center justify-center md:justify-start mb-2">
                <Crown className="h-6 w-6 text-yellow-300 mr-2" />
                <h3 className="text-2xl font-bold text-white">Destaque seus anúncios</h3>
                <Sparkles className="h-5 w-5 text-yellow-300 ml-2" />
              </div>
              <p className="text-purple-100 text-lg max-w-2xl">
                Com os planos Premium, seus veículos aparecem no topo das pesquisas e recebem até 10x mais visualizações
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/subscription-plans">
                <Button 
                  size="lg" 
                  className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-8 py-3 shadow-lg"
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Ver Planos
                </Button>
              </Link>
              <div className="text-center">
                <div className="text-yellow-300 font-bold text-sm">A partir de</div>
                <div className="text-white font-bold text-xl">R$ 29,90/mês</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Vehicle Listings Section */}
      <section id="resultados" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Carros disponíveis perto de você
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha entre centenas de veículos verificados na sua região
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>
            
            {showFilters && (
              <VehicleFilters 
                filters={combinedFilters} 
                onFiltersChange={handleFilterChange} 
              />
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="py-12">
              <CarLoading text="Carregando veículos disponíveis..." />
              
              {/* Loading skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Erro ao carregar veículos</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {/* Vehicle Grid */}
          {vehicles && vehicles.length > 0 && (
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 vehicle-grid"
              data-testid="vehicle-grid"
            >
              {vehicles.map((vehicle: any) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {vehicles && vehicles.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Nenhum veículo encontrado com os filtros selecionados
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleClearAllFilters}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Owner CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Transforme seu carro em uma fonte de renda
              </h2>
              <p className="text-xl mb-8 text-red-100">
                Alugue seu veículo quando não estiver usando e ganhe até R$ 2.000 por mês. É fácil, seguro e lucrativo.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white">✓</span>
                  </div>
                  <span className="text-lg">Seguro completo incluso</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white">✓</span>
                  </div>
                  <span className="text-lg">Você define suas regras e preços</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white">✓</span>
                  </div>
                  <span className="text-lg">Suporte 24/7 para proprietários</span>
                </div>
              </div>
              
              <Link href="/vehicles">
                <Button variant="secondary" size="lg" className="bg-white text-primary font-bold hover:bg-gray-100">
                  Anunciar meu carro
                </Button>
              </Link>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="bg-white text-gray-800 rounded-lg p-6 shadow-xl max-w-md mx-auto lg:mx-0">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success mb-2">R$ 1.800</div>
                  <div className="text-sm text-gray-600">Ganho médio mensal</div>
                  <div className="text-xs text-gray-500 mt-2">
                    *Baseado em dados de proprietários ativos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary">alugae.mobi</h3>
              <p className="text-gray-300">
                A plataforma que conecta pessoas através do compartilhamento de veículos. Seguro, fácil e econômico.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Para Locatários</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Como alugar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Seguros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentos necessários</a></li>
                <li><a href="/support" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Para Proprietários</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Como anunciar</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Precificação</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Proteção total</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Suporte 24/7</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/support" className="hover:text-white transition-colors">Central de ajuda</a></li>
                <li><a href="/support" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} alugae.mobi. Todos os direitos reservados.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">🛡️</span>
                <span>Pagamentos seguros</span>
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <span className="mr-2">✓</span>
                <span>Verificação completa</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
