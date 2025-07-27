import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WaitingQueueButtonProps {
  vehicleId: number;
  vehicleName: string;
  isAvailable: boolean;
}

export default function WaitingQueueButton({ 
  vehicleId, 
  vehicleName, 
  isAvailable 
}: WaitingQueueButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dates, setDates] = useState({
    startDate: "",
    endDate: "",
  });

  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const joinQueueMutation = useMutation({
    mutationFn: (data: { desiredStartDate: string; desiredEndDate: string }) =>
      apiRequest("POST", `/api/vehicles/${vehicleId}/waiting-queue`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/users", user?.id, "waiting-queue"] 
      });
      setIsOpen(false);
      setDates({ startDate: "", endDate: "" });
      toast({
        title: "Sucesso",
        description: "Você foi adicionado à fila de espera! Te notificaremos quando o veículo estiver disponível.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Falha ao entrar na fila de espera",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!dates.startDate || !dates.endDate) {
      toast({
        title: "Erro",
        description: "Preencha as datas desejadas",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dates.startDate) >= new Date(dates.endDate)) {
      toast({
        title: "Erro",
        description: "A data de início deve ser anterior à data de fim",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dates.startDate) < new Date()) {
      toast({
        title: "Erro",
        description: "A data de início não pode ser no passado",
        variant: "destructive",
      });
      return;
    }

    joinQueueMutation.mutate({
      desiredStartDate: dates.startDate,
      desiredEndDate: dates.endDate,
    });
  };

  if (!user) {
    return null;
  }

  // Don't show button if vehicle is available
  if (isAvailable) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full border-amber-600 text-amber-600 hover:bg-amber-50"
        >
          <Clock className="w-4 h-4 mr-2" />
          Entrar na Fila de Espera
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Fila de Espera
          </DialogTitle>
          <DialogDescription>
            O veículo <strong>{vehicleName}</strong> não está disponível no momento.
            Informe as datas desejadas e te notificaremos quando estiver disponível.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="startDate">Data de Início Desejada</Label>
            <Input
              id="startDate"
              type="date"
              value={dates.startDate}
              onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Data de Fim Desejada</Label>
            <Input
              id="endDate"
              type="date"
              value={dates.endDate}
              onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
              min={dates.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start">
              <Calendar className="w-4 h-4 text-amber-600 mt-0.5 mr-2" />
              <div className="text-sm text-amber-800">
                <strong>Como funciona:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Você entrará na fila para estas datas específicas</li>
                  <li>Receberá notificação quando o veículo estiver disponível</li>
                  <li>Poderá ver sua posição na fila em "Minhas Reservas"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={joinQueueMutation.isPending}
              className="flex-1"
            >
              {joinQueueMutation.isPending ? "Entrando..." : "Entrar na Fila"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}