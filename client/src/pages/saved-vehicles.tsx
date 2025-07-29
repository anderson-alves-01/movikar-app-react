import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { BookmarkCheck, Search, Filter, Car, Clock, Heart, Plus } from "lucide-react";
import VehicleCard from "@/components/vehicle-card";
import { Loading } from "@/components/ui/loading";
import Header from "@/components/header";

// Helper function to get token from localStorage
const getToken = () => {
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

export default function SavedVehicles() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch saved vehicles
  const { data: savedVehicles, isLoading: vehiclesLoading, error: vehiclesError } = useQuery({
    queryKey: ["/api/saved-vehicles"],
    enabled: !!getToken(),
    retry: false,
    queryFn: async () => {
      const token = getToken();
      console.log('🔄 [SavedVehicles] Query function executing, token:', token ? 'present' : 'missing');
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/saved-vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 [SavedVehicles] API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ [SavedVehicles] API Success:', data);
      return data;
    },
  });
  
  console.log('🔍 [SavedVehicles] Query data:', {
    savedVehicles,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    selectedCategory,
    hasToken: !!getToken(),
    tokenValue: getToken() ? 'Token presente' : 'Token ausente'
  });
  
  if (vehiclesError) {
    console.error('🚨 [SavedVehicles] Query error:', vehiclesError);
  }
  
  // Manual API test if data is undefined
  if (!vehiclesLoading && !savedVehicles && !vehiclesError) {
    console.log('🔧 [SavedVehicles] Data is undefined, testing API manually...');
    const testAPI = async () => {
      try {
        const token = getToken();
        if (token) {
          const response = await fetch('/api/saved-vehicles', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          console.log('🧪 [SavedVehicles] Manual API test result:', data);
        }
      } catch (error) {
        console.error('🚨 [SavedVehicles] Manual API test error:', error);
      }
    };
    testAPI();
  }

  // Fetch saved vehicle categories  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["/api/saved-vehicles/categories"],
    enabled: !!getToken(),
    retry: false,
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch('/api/saved-vehicles/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return response.json();
    },
  });

  const isLoading = vehiclesLoading || categoriesLoading;

  const filteredVehicles = Array.isArray(savedVehicles) ? savedVehicles.filter((saved: any) => {
    // First filter by category
    if (selectedCategory !== "all" && saved.category !== selectedCategory) {
      return false;
    }
    
    // Then filter by search query
    if (searchQuery.trim() === "") {
      return true;
    }
    
    const vehicle = saved?.vehicle || saved; // Handle both formats
    const searchLower = searchQuery.toLowerCase();
    return (
      (vehicle.brand && vehicle.brand.toLowerCase().includes(searchLower)) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchLower)) ||
      (vehicle.location && vehicle.location.toLowerCase().includes(searchLower))
    );
  }) : [];

  console.log('🔍 [SavedVehicles] Filtered vehicles:', filteredVehicles);
  console.log('🔍 [SavedVehicles] Raw savedVehicles:', savedVehicles);

  const allCategories = ["all", ...(Array.isArray(categories) ? categories : [])];

  // Check if user is not authenticated
  const token = getToken();
  console.log('Saved Vehicles - Token:', token);
  
  if (!token) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center">
                  <BookmarkCheck className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Login necessário
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Você precisa estar logado para ver seus veículos salvos.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/auth'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Fazer Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Loading variant="car" size="lg" />
              <p className="mt-4 text-gray-600">Carregando veículos salvos...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <BookmarkCheck className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Veículos Salvos</h1>
            </div>
            <p className="text-gray-600">
              Gerencie seus veículos favoritos e encontre rapidamente opções que chamaram sua atenção.
            </p>
          </div>

        {(!savedVehicles || (Array.isArray(savedVehicles) && savedVehicles.length === 0)) ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center">
                <BookmarkCheck className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Nenhum veículo salvo ainda
                </h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Comece a explorar veículos e use o botão de bookmark para salvar seus favoritos aqui.
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Explorar Veículos
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por marca, modelo ou localização..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Tabs */}
              {allCategories.length > 1 && (
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
                    <TabsTrigger value="all" className="text-xs">
                      Todos ({(savedVehicles && Array.isArray(savedVehicles)) ? savedVehicles.length : 0})
                    </TabsTrigger>
                    {Array.isArray(categories) && categories.map((category: string) => {
                      const count = (savedVehicles && Array.isArray(savedVehicles)) ? savedVehicles.filter((s: any) => s.category === category).length : 0;
                      return (
                        <TabsTrigger key={category} value={category} className="text-xs">
                          {category} ({count})
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookmarkCheck className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Salvos</p>
                      <p className="text-2xl font-bold text-gray-900">{(savedVehicles && Array.isArray(savedVehicles)) ? savedVehicles.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Filter className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Categorias</p>
                      <p className="text-2xl font-bold text-gray-900">{Array.isArray(categories) ? categories.length : 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Último salvo</p>
                        <p className="text-sm font-bold text-gray-900">
                          {Array.isArray(savedVehicles) && savedVehicles.length > 0 ? "Hoje" : "Nenhum"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Vehicles Grid */}
            {filteredVehicles.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Nenhum veículo encontrado
                  </h3>
                  <p className="text-gray-500">
                    Tente ajustar os filtros ou termo de busca.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredVehicles.map((saved: any) => {
                  // Handle both formats: saved.vehicle or direct vehicle data
                  const vehicleData = saved.vehicle || saved;
                  console.log('🚗 [SavedVehicles] Rendering vehicle:', vehicleData);
                  
                  return (
                    <div key={saved.id} className="relative">
                      <VehicleCard vehicle={vehicleData} />
                      {saved.category && saved.category !== "Geral" && (
                        <Badge 
                          variant="secondary" 
                          className="absolute top-2 left-2 z-20 bg-white bg-opacity-90 text-xs"
                        >
                          {saved.category}
                        </Badge>
                      )}
                      {saved.notes && (
                        <div className="mt-2 p-2 bg-gray-100 rounded-md">
                          <p className="text-xs text-gray-600">{saved.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </>
  );
}