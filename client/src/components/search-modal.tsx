import { useState, useEffect } from "react";
import { Search, Clock, Bookmark, X, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/contexts/SearchContext";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  category: string;
  timestamp: Date;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"recentes" | "salvas">("recentes");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { updateFilter, category, priceRange, fuelType, transmission } = useSearch();

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('search-history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (error) {
        console.error('Error parsing search history:', error);
        setSearchHistory([]);
      }
    }
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Add to search history
      const newHistoryItem: SearchHistoryItem = {
        id: Date.now().toString(),
        query: query.trim(),
        category: "Carros, vans e utilitários",
        timestamp: new Date()
      };

      const updatedHistory = [newHistoryItem, ...searchHistory.filter(item => item.query !== query.trim()).slice(0, 9)];
      setSearchHistory(updatedHistory);
      localStorage.setItem('search-history', JSON.stringify(updatedHistory));

      // Apply search filter - this will trigger the search
      updateFilter('location', query.trim());
      
      // Navigate to vehicles page if not already there
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/home') {
        window.location.href = '/#resultados';
      } else {
        // Scroll to results if already on vehicles page
        setTimeout(() => {
          const resultadosSection = document.getElementById('resultados') || document.querySelector('[data-testid="vehicles-grid"]');
          if (resultadosSection) {
            resultadosSection.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      }
      
      onClose();
    }
  };

  const removeFromHistory = (id: string) => {
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    localStorage.setItem('search-history', JSON.stringify(updatedHistory));
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4">
      <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Buscar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className="bg-gray-50 border border-gray-200 text-base h-11 pl-4 pr-10 rounded-lg focus-visible:ring-2 focus-visible:ring-red-500"
                autoFocus
                data-testid="input-search-modal"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === "recentes" 
                ? "text-purple-600 border-b-2 border-purple-600" 
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("recentes")}
          >
            <Clock className="h-4 w-4" />
            Recentes
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === "salvas" 
                ? "text-purple-600 border-b-2 border-purple-600" 
                : "text-gray-600"
            }`}
            onClick={() => setActiveTab("salvas")}
          >
            <Bookmark className="h-4 w-4" />
            Buscas Salvas
          </button>
        </div>

        {/* Quick Filters Bar */}
        <div className="px-4 py-2 border-b border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros Avançados
          </Button>
        </div>

        {/* Advanced Filters (when expanded) */}
        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Categoria</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  value={category || ''}
                  onChange={(e) => updateFilter('category', e.target.value)}
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
                  value={priceRange || ''}
                  onChange={(e) => updateFilter('priceRange', e.target.value)}
                >
                  <option value="">Qualquer</option>
                  <option value="0-100">Até R$ 100</option>
                  <option value="100-200">R$ 100-200</option>
                  <option value="200+">R$ 200+</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Combustível</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  value={fuelType || ''}
                  onChange={(e) => updateFilter('fuelType', e.target.value)}
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
                  value={transmission || ''}
                  onChange={(e) => updateFilter('transmission', e.target.value)}
                >
                  <option value="">Qualquer</option>
                  <option value="Automático">Automático</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-96">
          {activeTab === "recentes" && (
            <div className="p-2">
              {searchHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma busca recente</p>
                  <p className="text-sm">Suas pesquisas aparecerão aqui</p>
                </div>
              ) : (
                searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group"
                  >
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleSearch(item.query)}
                    >
                      <div className="font-medium text-gray-900">{item.query}</div>
                      <div className="text-sm text-purple-600">{item.category}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 p-1"
                      onClick={() => removeFromHistory(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "salvas" && (
            <div className="p-2">
              <div className="text-center py-8 text-gray-500">
                <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma busca salva</p>
                <p className="text-sm">Salve suas pesquisas favoritas</p>
              </div>
            </div>
          )}
        </div>

        {/* Security Banner */}
        <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <div className="font-semibold text-sm">Fique ligado em nossas dicas</div>
              <div className="text-xs opacity-90">para evitar golpes e fraudes</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}