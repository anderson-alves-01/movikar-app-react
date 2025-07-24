import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, Bell, CheckCircle } from "lucide-react";

export default function SimpleReleaseDemo() {
  const handleTestRelease = async () => {
    try {
      console.log("🚗 Testando sistema de liberação automática...");
      
      // Simulate the release process
      const response = await fetch("/api/vehicles/auto-release");
      const result = await response.json();
      
      console.log("Resultado:", result);
      alert(`Sistema executado! ${result.releasedCount || 0} veículos liberados, ${result.notifiedCount || 0} usuários notificados`);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao executar liberação automática");
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Sistema de Liberação Automática
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm">Verifica reservas com data final vencida</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">Remove bloqueios de calendário expirados</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Notifica próximo usuário na fila de espera</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <Button 
            onClick={handleTestRelease}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Executar Liberação Automática
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
          <strong>💡 Funcionamento:</strong>
          <br />
          1. Sistema verifica diariamente reservas expiradas
          <br />
          2. Remove bloqueios automáticos do calendário
          <br />
          3. Notifica próximo da fila por ordem de chegada
          <br />
          4. Usuário recebe aviso para reservar rapidamente
        </div>
      </CardContent>
    </Card>
  );
}