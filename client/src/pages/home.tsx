import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import VehicleCard from "@/components/vehicle-card";
import VehicleFilters from "@/components/vehicle-filters";
import { useState, useEffect } from "react";
import { SearchFilters } from "@/types";
import { Loader2, Crown, Sparkles } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSearch } from "@/contexts/SearchContext";
import { CarLoading, VehicleCardSkeleton } from "@/components/ui/loading";
import { useAuthStore } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import PrivacyPolicyModal from "@/components/privacy-policy-modal";
import TermsOfUseModal from "@/components/terms-of-use-modal";

export default function Home() {
  const { filters, clearFilters } = useSearch();
  const [localFilters, setLocalFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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

  const { 
    vehicles, 
    totalCount, 
    isLoading, 
    error, 
    isFetchingNextPage,
    hasNextPage,
    isNearBottom 
  } = useInfiniteScroll({
    queryKey: ['/api/vehicles', combinedFilters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append('page', pageParam.toString());
      params.append('limit', '12');
      
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
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with pagination)
      if (Array.isArray(data)) {
        return {
          vehicles: data,
          pagination: {
            page: pageParam,
            limit: 12,
            total: data.length,
            hasMore: false,
            totalPages: 1
          }
        };
      }
      
      return data;
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
      
      <HeroSection />
      <OnboardingFlow page="home" />
      
      {/* Subscription Banner */}
      <section className="py-12 bg-secondary-light border-y border-secondary-pastel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h3 className="text-xl md:text-2xl font-medium text-gray-800 mb-3">
                Planos Empresariais
              </h3>
              <p className="text-gray-600 text-base max-w-2xl leading-relaxed">
                Aumente a visibilidade dos seus veículos com nossos planos de destaque. 
                <span className="text-secondary font-medium">Resultados comprovados</span> em posicionamento e alcance.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link href="/subscription-plans">
                <Button 
                  size="default" 
                  className="bg-secondary hover:bg-secondary-hover text-white font-medium px-6 py-2 rounded-md transition-colors duration-200 border-0"
                >
                  Consultar Planos
                </Button>
              </Link>
              <div className="text-center bg-white rounded-md p-3 border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-xs font-medium">A partir de</div>
                <div className="text-gray-800 font-semibold text-lg">R$ 29,90</div>
                <div className="text-gray-500 text-xs">/mês</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Vehicle Listings Section */}
      <section id="resultados" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-medium text-gray-800 mb-4">
              Veículos Disponíveis
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              {totalCount > 0 && vehicles.length > 0 
                ? `${vehicles.length} de ${totalCount} opções disponíveis em sua região` 
                : 'Frota diversificada de veículos verificados e prontos para locação'}
            </p>
          </div>

          {/* Performance indicator for scroll loading */}
          {isNearBottom && hasNextPage && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-blue-50 text-blue-600 border border-blue-200">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando mais veículos automaticamente...
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12">
              <CarLoading text="Carregando veículos disponíveis..." />
              
              {/* Enhanced loading skeletons with staggered animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                    <VehicleCardSkeleton />
                  </div>
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
            <>
              <div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 vehicle-grid"
                data-testid="vehicle-grid"
              >
                {vehicles.map((vehicle: any) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
              
              {/* Loading more vehicles indicator */}
              {isFetchingNextPage && (
                <div className="flex justify-center mt-8">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-gray-600">Carregando mais veículos...</span>
                  </div>
                </div>
              )}
              
              {/* End of results indicator */}
              {!hasNextPage && vehicles.length > 12 && (
                <div className="text-center mt-8">
                  <div className="inline-block px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm border border-green-200">
                    ✓ Todos os {totalCount} veículos foram carregados
                  </div>
                </div>
              )}
            </>
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
      <section className="py-16 bg-primary-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-medium text-gray-800 mb-6 leading-tight">
                Solução para Proprietários de Veículos
              </h2>
              <p className="text-lg mb-8 text-gray-600 leading-relaxed">
                Monetize seu ativo com nossa plataforma de aluguel peer-to-peer. 
                <span className="text-primary font-medium">Rentabilidade média de R$ 1.800/mês</span> 
                com total segurança e controle.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-base text-gray-700">Cobertura de seguro integral</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-base text-gray-700">Autonomia na precificação e disponibilidade</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-base text-gray-700">Atendimento especializado</span>
                </div>
              </div>
              
              <Link href="/vehicles">
                <Button className="bg-primary hover:bg-primary-hover text-white font-medium px-6 py-2 rounded-md transition-colors duration-200">
                  Cadastrar Veículo
                </Button>
              </Link>
            </div>
            
            <div className="text-center lg:text-right">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm max-w-sm mx-auto lg:mx-0">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-primary mb-1">R$ 1.800</div>
                  <div className="text-sm text-gray-600 mb-3">Receita média mensal</div>
                  <div className="text-xs text-gray-500 px-3 py-2 bg-gray-50 rounded">
                    Dados baseados em proprietários ativos na plataforma
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
                <li><a href="/support#como-alugar" className="hover:text-white transition-colors">Como alugar</a></li>
                <li><a href="/support#seguros" className="hover:text-white transition-colors">Seguros</a></li>
                <li><a href="/support#documentos-necessarios" className="hover:text-white transition-colors">Documentos necessários</a></li>
                <li><a href="/support" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Para Proprietários</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/support#como-anunciar" className="hover:text-white transition-colors">Como anunciar</a></li>
                <li><a href="/support#precificacao" className="hover:text-white transition-colors">Precificação</a></li>
                <li><a href="/support#protecao-total" className="hover:text-white transition-colors">Proteção total</a></li>
                <li><a href="/support#suporte-24-7" className="hover:text-white transition-colors">Suporte 24/7</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/support#central-de-ajuda" className="hover:text-white transition-colors">Central de ajuda</a></li>
                <li><a href="/support#contato" className="hover:text-white transition-colors">Contato</a></li>
                <li>
                  <button 
                    onClick={() => setShowTermsModal(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Termos de uso
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setShowPrivacyModal(true)}
                    className="hover:text-white transition-colors text-left"
                  >
                    Política de privacidade
                  </button>
                </li>
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

      {/* Modais */}
      <PrivacyPolicyModal
        open={showPrivacyModal}
        onOpenChange={setShowPrivacyModal}
        onAccept={() => setShowPrivacyModal(false)}
      />
      
      <TermsOfUseModal
        open={showTermsModal}
        onOpenChange={setShowTermsModal}
        onAccept={() => setShowTermsModal(false)}
      />
    </div>
  );
}
