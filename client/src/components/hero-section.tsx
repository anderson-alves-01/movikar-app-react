import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Search, Shield, Clock, DollarSign } from "lucide-react";
import { SearchFilters } from "@/types";

interface HeroSectionProps {
  onSearch: (filters: SearchFilters) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchData, setSearchData] = useState({
    location: '',
    startDate: '',
    endDate: '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      location: searchData.location,
      startDate: searchData.startDate ? new Date(searchData.startDate) : undefined,
      endDate: searchData.endDate ? new Date(searchData.endDate) : undefined,
    });
  };

  return (
    <section className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&h=1080')"
        }}
      ></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Alugue o carro perfeito<br />
            <span className="text-primary">na sua cidade</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto">
            Conectamos pessoas que precisam de um carro com donos que querem compartilhar. Seguro, fácil e econômico.
          </p>

          {/* Search Form */}
          <Card className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto text-gray-800">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Localização</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="São Paulo, SP" 
                      className="pl-10"
                      value={searchData.location}
                      onChange={(e) => setSearchData(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Retirada</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="datetime-local" 
                      className="pl-10"
                      value={searchData.startDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Devolução</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      type="datetime-local" 
                      className="pl-10"
                      value={searchData.endDate}
                      onChange={(e) => setSearchData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full bg-primary text-white font-semibold hover:bg-red-600 transition-colors shadow-lg">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Seguro</h3>
              <p className="text-gray-300">Seguro completo e verificação de documentos para sua tranquilidade</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Disponível 24/7</h3>
              <p className="text-gray-300">Alugue quando precisar, onde precisar, na hora que precisar</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Preços Justos</h3>
              <p className="text-gray-300">Economia real comparado às locadoras tradicionais</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
