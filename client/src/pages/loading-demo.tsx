import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/header";
import { 
  Loading, 
  CarLoading, 
  PageLoading, 
  ButtonLoading, 
  InlineLoading,
  VehicleCardSkeleton,
  TableSkeleton,
  DashboardSkeleton
} from "@/components/ui/loading";
import { Spinner, CarSpinner, ButtonSpinner, PageSpinner } from "@/components/ui/spinner";

export default function LoadingDemo() {
  const [showPageLoading, setShowPageLoading] = useState(false);
  const [loadingButtons, setLoadingButtons] = useState<Record<string, boolean>>({});

  const handleButtonClick = (buttonId: string) => {
    setLoadingButtons(prev => ({ ...prev, [buttonId]: true }));
    setTimeout(() => {
      setLoadingButtons(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  const togglePageLoading = () => {
    setShowPageLoading(true);
    setTimeout(() => setShowPageLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showPageLoading && <PageLoading text="Simulando carregamento da página..." />}
      
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎨 Sistema de Loading CarShare
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Demonstração completa dos componentes de loading personalizados criados para uma melhor experiência do usuário.
            </p>
          </div>

          {/* Loading Components Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Default Loading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Padrão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading variant="default" size="sm" text="Pequeno" />
                <Loading variant="default" size="md" text="Médio" />
                <Loading variant="default" size="lg" text="Grande" />
                <Loading variant="default" size="xl" text="Extra Grande" />
              </CardContent>
            </Card>

            {/* Car Loading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Carro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading variant="car" size="sm" text="Carregando..." />
                <Loading variant="car" size="md" text="Buscando veículos..." />
                <Loading variant="car" size="lg" text="Processando..." />
                <CarLoading text="Componente especializado" />
              </CardContent>
            </Card>

            {/* Dots Loading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Pontos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading variant="dots" size="sm" text="Salvando..." />
                <Loading variant="dots" size="md" text="Sincronizando..." />
                <Loading variant="dots" size="lg" text="Finalizando..." />
                <InlineLoading text="Inline loading" />
              </CardContent>
            </Card>

            {/* Pulse Loading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Pulse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading variant="pulse" size="sm" />
                <Loading variant="pulse" size="md" />
                <Loading variant="pulse" size="lg" />
                <Loading variant="pulse" size="xl" />
              </CardContent>
            </Card>

            {/* Spinner Loading */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Loading Spinner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Loading variant="spinner" size="sm" text="Carregando..." />
                <Loading variant="spinner" size="md" text="Processando..." />
                <Loading variant="spinner" size="lg" text="Aguarde..." />
                <Spinner variant="primary" size="lg" />
              </CardContent>
            </Card>

            {/* Specialized Spinners */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spinners Especializados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <CarSpinner size="sm" />
                  <span className="text-sm">Car Spinner</span>
                </div>
                <div className="flex items-center gap-2">
                  <ButtonSpinner />
                  <span className="text-sm">Button Spinner</span>
                </div>
                <PageSpinner />
              </CardContent>
            </Card>
          </div>

          {/* Interactive Examples */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Button Loading Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Botões com Loading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleButtonClick('save')}
                  disabled={loadingButtons.save}
                  className="w-full"
                >
                  {loadingButtons.save ? <ButtonLoading /> : null}
                  {loadingButtons.save ? 'Salvando...' : 'Salvar Dados'}
                </Button>
                
                <Button 
                  onClick={() => handleButtonClick('process')}
                  disabled={loadingButtons.process}
                  variant="secondary"
                  className="w-full"
                >
                  {loadingButtons.process ? <ButtonLoading /> : null}
                  {loadingButtons.process ? 'Processando...' : 'Processar Pagamento'}
                </Button>
                
                <Button 
                  onClick={() => handleButtonClick('upload')}
                  disabled={loadingButtons.upload}
                  variant="outline"
                  className="w-full"
                >
                  {loadingButtons.upload ? <ButtonLoading /> : null}
                  {loadingButtons.upload ? 'Enviando...' : 'Upload Documento'}
                </Button>
              </CardContent>
            </Card>

            {/* Full Screen Loading */}
            <Card>
              <CardHeader>
                <CardTitle>Loading Tela Cheia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Teste o loading que cobre toda a tela:
                </p>
                <Button onClick={togglePageLoading} className="w-full">
                  Mostrar Page Loading
                </Button>
                <div className="text-xs text-gray-500">
                  ⚡ Será removido automaticamente em 3 segundos
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skeleton Loading Examples */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading - Cards de Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <VehicleCardSkeleton key={i} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading - Tabela</CardTitle>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={5} columns={4} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skeleton Loading - Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardSkeleton />
              </CardContent>
            </Card>
          </div>

          {/* Usage Examples */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>💡 Como Usar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Importação:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { 
  Loading, 
  CarLoading, 
  VehicleCardSkeleton 
} from "@/components/ui/loading";`}
                  </pre>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Uso Básico:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{isLoading && (
  <CarLoading 
    text="Carregando veículos..." 
  />
)}`}
                  </pre>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>✨ Personalização:</strong> Todos os componentes suportam props como 
                  <Badge variant="outline" className="mx-1">size</Badge>, 
                  <Badge variant="outline" className="mx-1">variant</Badge>, 
                  <Badge variant="outline" className="mx-1">text</Badge> e 
                  <Badge variant="outline" className="mx-1">className</Badge> 
                  para máxima flexibilidade.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}