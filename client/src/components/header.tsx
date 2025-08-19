import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, Menu, User, MessageCircle, Car, LogOut, Shield, Bell, Gift, Sparkles, BarChart3, RotateCcw, DollarSign, BookmarkCheck, Crown, Star } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useSearch } from "@/contexts/SearchContext";
import { buildSearchParams } from "@/lib/searchUtils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AdminSettings } from "@shared/admin-settings";
import SearchModal from "./search-modal";

// import AddVehicleModal from "./add-vehicle-modal";

export default function Header() {
  const [, setLocation] = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced filter states
  const [category, setCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");

  const { user, token, clearAuth } = useAuthStore();
  const { updateFilter, clearFilters } = useSearch();


  // Fetch feature toggles (public endpoint)
  const { data: featureToggles } = useQuery({
    queryKey: ['/api/public/feature-toggles'],
    queryFn: async () => {
      const response = await fetch('/api/public/feature-toggles');
      if (!response.ok) {
        throw new Error('Failed to fetch feature toggles');
      }
      const data = await response.json();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false
  });

  // Disable unread message count to prevent auth loops
  const unreadCount = 0;

  const handleLogout = async () => {
    try {
      // Call server logout endpoint to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      console.log('✅ Header - Server logout successful');
    } catch (error) {
      console.log('❌ Header - Server logout error:', error);
    } finally {
      // Clear client-side auth state
      clearAuth();
      
      // Clear any remaining localStorage/sessionStorage data
      sessionStorage.clear();
      localStorage.removeItem('checkoutPlan');
      localStorage.removeItem('pendingSubscription');
      localStorage.removeItem('returnUrl');
      localStorage.removeItem('auth_token');
      
      console.log('🧹 Header - All session data cleared');
      
      // Redirect to home
      setLocation('/');
      
      // Force page reload to ensure clean state
      window.location.reload();
    }
  };

  const handleClearSearch = () => {
    setSearchLocation("");
    setStartDate("");
    setEndDate("");
    setCategory("");
    setPriceRange("");
    setFuelType("");
    setTransmission("");
    clearFilters();
  };

  const handleSearch = () => {
    // Apply all filters including advanced ones
    updateFilter('location', searchLocation);
    updateFilter('startDate', startDate);
    updateFilter('endDate', endDate);
    updateFilter('category', category);
    updateFilter('priceRange', priceRange);
    updateFilter('fuelType', fuelType);
    updateFilter('transmission', transmission);
    
    // Always redirect to home page to show results
    setLocation('/');
    
    // Scroll to results after navigation
    setTimeout(() => {
      const resultadosSection = document.getElementById('resultados');
      if (resultadosSection) {
        resultadosSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 300);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <img 
                  src="/logo.png" 
                  alt="ALUGAE" 
                  className="h-8 sm:h-10 w-auto mr-2 sm:mr-3 min-h-[32px] sm:min-h-[40px] object-contain flex-shrink-0"
                  style={{ imageRendering: 'crisp-edges', minWidth: '80px' }}
                  onError={(e) => {
                    // Fallback para texto se imagem não carregar
                    e.currentTarget.style.display = 'none';
                    const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextElement) {
                      nextElement.style.display = 'block';
                    }
                  }}
                />
                <h1 className="text-2xl font-bold text-primary hidden">alugae.mobi</h1>
              </div>
            </Link>

            {/* Search Bar (Desktop) */}
            <div 
              className="hidden md:flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-2 cursor-pointer min-w-[300px]"
              onClick={() => setShowSearchModal(true)}
            >
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500 flex-1">Buscar veículos...</span>
            </div>


            {/* Right Side */}
            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* Mobile Search */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
                onClick={() => setShowSearchModal(true)}
                data-testid="button-mobile-search"
              >
                <Search className="h-4 w-4" />
              </Button>

              {user ? (
                <>
                  {/* Subscription Button */}
                  <Link href="/subscription-plans">
                    <Button
                      variant="default"
                      size="sm"
                      title="Fazer upgrade do plano"
                      className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-md p-2"
                    >
                      <Crown className="h-4 w-4" />
                    </Button>
                  </Link>

                  {/* Add Vehicle Button - Hidden on mobile */}
                  <Link href="/vehicles">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Anunciar
                    </Button>
                  </Link>

                  {/* Message Notification Bell */}
                  <Link href="/messages">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      title="Ver mensagens"
                      className="relative p-2"
                    >
                      <Bell className="h-4 w-4 text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 px-1 py-0.5 text-xs min-w-[1rem] h-4 flex items-center justify-center rounded-full"
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="flex items-center space-x-1 sm:space-x-2 bg-white border border-gray-300 rounded-full px-2 sm:px-3 py-2 hover:shadow-md transition-shadow"
                        data-testid="header-user-menu"
                      >
                        <Menu className="h-4 w-4 text-gray-600" />
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-800" data-testid="text-user-name">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/reservations" className="cursor-pointer">
                          <Car className="h-4 w-4 mr-2" />
                          Minhas Reservas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/vehicles" className="cursor-pointer">
                          <Car className="h-4 w-4 mr-2" />
                          Meus Veículos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/messages" className="cursor-pointer">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Mensagens
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/rewards" className="cursor-pointer">
                          <Gift className="h-4 w-4 mr-2" />
                          Recompensas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/reviews" className="cursor-pointer">
                          <Star className="h-4 w-4 mr-2" />
                          Avaliações
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/suggestions" className="cursor-pointer">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Sugestões
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/saved-vehicles" className="cursor-pointer">
                          <BookmarkCheck className="h-4 w-4 mr-2" />
                          Veículos Salvos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/subscription-plans" className="cursor-pointer">
                          <Crown className="h-4 w-4 mr-2 text-purple-600" />
                          <span className="text-purple-600 font-medium">Planos Premium</span>
                        </Link>
                      </DropdownMenuItem>
                      {featureToggles?.enableRentNowCheckout && (
                        <DropdownMenuItem asChild>
                          <Link href="/earnings" className="cursor-pointer">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Meus Ganhos
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/document-verification" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          Verificação
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/support" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          Suporte & FAQ
                        </Link>
                      </DropdownMenuItem>
                      {user.role === 'admin' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="cursor-pointer">
                              <Shield className="h-4 w-4 mr-2" />
                              Painel Admin
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button asChild data-testid="button-login">
                  <Link href="/auth">Entrar</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          {showSearch && (
            <div className="md:hidden px-3 pb-4">
              <div className="flex flex-col gap-3 bg-gray-50 rounded-lg p-3">
                <div className="flex items-center bg-white rounded-lg p-2 border">
                  <Search className="h-4 w-4 text-gray-400 mr-2" />
                  <Input 
                    type="text" 
                    placeholder="Onde?" 
                    value={searchLocation}
                    className="bg-transparent outline-none flex-1 text-gray-700 border-none focus-visible:ring-0" 
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    type="date" 
                    value={startDate}
                    placeholder="Check-in"
                    className="flex-1 text-sm border border-gray-300 rounded-lg p-2"
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input 
                    type="date" 
                    value={endDate}
                    placeholder="Check-out"
                    className="flex-1 text-sm border border-gray-300 rounded-lg p-2"
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1 bg-primary text-white hover:bg-red-600"
                    onClick={() => {
                      handleSearch();
                      setShowSearch(false);
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Filtros
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleClearSearch}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Mobile Advanced Filters */}
                {showFilters && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="">Todas</option>
                          <option value="Sedã">Sedã</option>
                          <option value="SUV">SUV</option>
                          <option value="Hatch">Hatch</option>
                          <option value="Picape">Picape</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Preço/dia</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={priceRange}
                          onChange={(e) => setPriceRange(e.target.value)}
                        >
                          <option value="">Qualquer</option>
                          <option value="0-100">Até R$ 100</option>
                          <option value="100-200">R$ 100-200</option>
                          <option value="200+">R$ 200+</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Combustível</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={fuelType}
                          onChange={(e) => setFuelType(e.target.value)}
                        >
                          <option value="">Qualquer</option>
                          <option value="Flex">Flex</option>
                          <option value="Gasolina">Gasolina</option>
                          <option value="Etanol">Etanol</option>
                          <option value="Diesel">Diesel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Transmissão</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                          value={transmission}
                          onChange={(e) => setTransmission(e.target.value)}
                        >
                          <option value="">Qualquer</option>
                          <option value="Automático">Automático</option>
                          <option value="Manual">Manual</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Filters Panel (Desktop) */}
          {showFilters && (
            <div className="hidden md:block absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40">
              <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      data-testid="select-category"
                    >
                      <option value="">Todas as categorias</option>
                      <option value="Sedã">Sedã</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatch">Hatch</option>
                      <option value="Picape">Picape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preço por dia</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      data-testid="select-price"
                    >
                      <option value="">Qualquer preço</option>
                      <option value="0-100">Até R$ 100</option>
                      <option value="100-200">R$ 100 - R$ 200</option>
                      <option value="200-300">R$ 200 - R$ 300</option>
                      <option value="300+">Acima de R$ 300</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Combustível</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value)}
                      data-testid="select-fuel"
                    >
                      <option value="">Qualquer</option>
                      <option value="Flex">Flex</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Etanol">Etanol</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transmissão</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      value={transmission}
                      onChange={(e) => setTransmission(e.target.value)}
                      data-testid="select-transmission"
                    >
                      <option value="">Qualquer</option>
                      <option value="Automático">Automático</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>
                
                {/* Apply Filters Button for Desktop */}
                <div className="mt-4 flex justify-end">
                  <Button 
                    size="sm" 
                    className="bg-primary text-white hover:bg-red-600 px-6"
                    onClick={handleSearch}
                    data-testid="button-apply-filters"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </>
  );
}
