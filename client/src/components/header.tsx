import { useState } from "react";
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
import { Search, Menu, User, MessageCircle, Car, LogOut, Shield, Bell, Gift, Sparkles, BarChart3, RotateCcw, DollarSign, BookmarkCheck, Crown } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { useSearch } from "@/contexts/SearchContext";
import { buildSearchParams } from "@/lib/searchUtils";
// import AddVehicleModal from "./add-vehicle-modal";

export default function Header() {
  const [, setLocation] = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { user, token, clearAuth } = useAuthStore();
  const { updateFilter, clearFilters } = useSearch();

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
    clearFilters();
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <h1 className="text-2xl font-bold text-primary">alugae.mobi</h1>
              </div>
            </Link>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-2">
              <Input 
                type="text" 
                placeholder="Onde?" 
                value={searchLocation}
                className="border-none outline-none text-sm font-medium text-gray-800 bg-transparent w-32 focus-visible:ring-0" 
                onChange={(e) => {
                  setSearchLocation(e.target.value);
                  const trimmedValue = e.target.value.trim();
                  if (trimmedValue.length > 2) {
                    updateFilter('location', trimmedValue);
                  } else if (trimmedValue.length === 0) {
                    updateFilter('location', '');
                  }
                }}
                data-testid="input-search-header"
              />
              <div className="border-l border-gray-300 h-6 mx-4"></div>
              <Input 
                type="date" 
                value={startDate}
                placeholder="Check-in"
                className="border-none outline-none text-sm text-gray-600 bg-transparent focus-visible:ring-0" 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  updateFilter('startDate', e.target.value);
                }}
              />
              <div className="border-l border-gray-300 h-6 mx-4"></div>
              <Input 
                type="date" 
                value={endDate}
                placeholder="Check-out"
                className="border-none outline-none text-sm text-gray-600 bg-transparent focus-visible:ring-0" 
                onChange={(e) => {
                  setEndDate(e.target.value);
                  updateFilter('endDate', e.target.value);
                }}
              />
              <Button 
                size="sm" 
                className="bg-gray-500 text-white p-2 rounded-full ml-4 hover:bg-gray-600 transition-colors"
                onClick={handleClearSearch}
                title="Limpar busca"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {user ? (
                <>
                  {/* Subscription Button */}
                  <Link href="/subscription-plans">
                    <Button
                      variant="default"
                      size="sm"
                      className="hidden sm:flex bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-md"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  </Link>

                  {/* Add Vehicle Button */}
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
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full"
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
                        className="flex items-center space-x-2 bg-white border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition-shadow"
                        data-testid="header-user-menu"
                      >
                        <Menu className="h-4 w-4 text-gray-600" />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
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
                      <DropdownMenuItem asChild>
                        <Link href="/earnings" className="cursor-pointer">
                          <DollarSign className="h-4 w-4 mr-2" />
                          Meus Ganhos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/document-verification" className="cursor-pointer">
                          <Shield className="h-4 w-4 mr-2" />
                          Verificação
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
                      <DropdownMenuItem onClick={handleLogout}>
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
            <div className="md:hidden px-4 pb-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-3">
                <Search className="h-5 w-5 text-gray-400 mr-3" />
                <Input 
                  type="text" 
                  placeholder="Buscar carros..." 
                  className="bg-transparent outline-none flex-1 text-gray-700 border-none focus-visible:ring-0" 
                />
              </div>
            </div>
          )}
        </div>
      </header>


    </>
  );
}
