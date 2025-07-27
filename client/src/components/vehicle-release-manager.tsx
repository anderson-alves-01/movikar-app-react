import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, Bell, Car, Calendar, Users } from "lucide-react";

export default function VehicleReleaseManager() {
  const { toast } = useToast();
  const [lastResult, setLastResult] = useState<any>(null);

  const releaseExpiredMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/vehicles/release-expired");
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: "Liberação Concluída",
        description: `${data.releasedBlocks} veículos liberados, ${data.notifiedUsers} usuários notificados`,
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao liberar veículos expirados",
        variant: "destructive",
      });
    },
  });

  const handleReleaseExpired = () => {
    releaseExpiredMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Gerenciador de Liberação de Veículos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Este sistema automaticamente:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Libera veículos após término das reservas</li>
              <li>Notifica usuários na fila de espera</li>
              <li>Remove bloqueios expirados do calendário</li>
            </ul>
          </div>

          <Button
            onClick={handleReleaseExpired}
            disabled={releaseExpiredMutation.isPending}
            className="w-full"
          >
            {releaseExpiredMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Liberar Veículos Expirados
              </>
            )}
          </Button>

          {lastResult && (
            <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Última Execução
                </Badge>
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-green-600" />
                  <span>{lastResult.releasedBlocks} veículos liberados</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-600" />
                  <span>{lastResult.notifiedUsers} usuários notificados</span>
                </div>
              </div>

              {lastResult.notifications && lastResult.notifications.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-medium text-green-900 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Notificações Enviadas:
                  </h5>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {lastResult.notifications.map((notification: any, index: number) => (
                      <div key={index} className="text-xs bg-white p-2 rounded border">
                        <div className="font-medium">{notification.userName}</div>
                        <div className="text-gray-600">{notification.vehicleName}</div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {notification.desiredDates}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-1">💡 Sistema Automático:</h5>
            <p>
              Em produção, este processo pode ser executado automaticamente todos os dias através de um agendador (cron job) 
              que chama o endpoint <code>/api/vehicles/auto-release</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}