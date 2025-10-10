import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import VehicleCard from "@/components/vehicle-card";
import VehicleFilters from "@/components/vehicle-filters";
import { useState } from "react";
import { SearchFilters } from "@/types";
import { Loader2 } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useSearch } from "@/contexts/SearchContext";
import { CarLoading, VehicleCardSkeleton } from "@/components/ui/loading";

export default function LandingPage() {
  const { filters, clearFilters } = useSearch();
  const [localFilters, setLocalFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Combine global filters from header with local filters
  const combinedFilters = { ...filters, ...localFilters };

  const queryFn = async ({ pageParam }: { pageParam: number }) => {
    const params = new URLSearchParams({
      page: pageParam.toString(),
      limit: '12',
      ...Object.fromEntries(
        Object.entries(combinedFilters).filter(([_, v]) => v !== undefined)
      )
    });

    const response = await fetch(`/api/vehicles?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }

    return response.json();
  };

  const { 
    vehicles, 
    totalCount, 
    isLoading, 
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useInfiniteScroll({
    queryKey: ['/api/vehicles', JSON.stringify(combinedFilters)],
    queryFn,
  });

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setLocalFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearAllFilters = () => {
    clearFilters();
    setLocalFilters({});
  };

  const hasActiveFilters = Object.keys(combinedFilters).some(
    key => combinedFilters[key as keyof SearchFilters] !== undefined
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <HeroSection />

        {/* Filters Section */}
        <section className="py-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-vehicles-available">
                Veículos Disponíveis
              </h2>
              {totalCount > 0 && (
                <span className="text-sm sm:text-base text-muted-foreground" data-testid="text-vehicle-count">
                  ({totalCount} {totalCount === 1 ? 'veículo' : 'veículos'})
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  data-testid="button-clear-filters"
                >
                  Limpar Filtros
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
              </Button>
            </div>
          </div>

          {showFilters && (
            <VehicleFilters
              filters={localFilters}
              onFiltersChange={handleApplyFilters}
            />
          )}
        </section>

        {/* Vehicles Grid */}
        <section className="pb-16">
          {isLoading && vehicles.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Erro ao carregar veículos</p>
              <Button onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {hasActiveFilters 
                  ? "Nenhum veículo encontrado com os filtros aplicados"
                  : "Nenhum veículo disponível no momento"}
              </p>
              {hasActiveFilters && (
                <Button onClick={handleClearAllFilters} variant="outline">
                  Limpar Filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vehicles.map((vehicle) => (
                  <Link key={vehicle.id} href={`/vehicle/${vehicle.id}`}>
                    <VehicleCard vehicle={vehicle} />
                  </Link>
                ))}
              </div>

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    size="lg"
                    variant="outline"
                    data-testid="button-load-more"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar Mais'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
