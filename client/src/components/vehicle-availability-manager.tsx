import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VehicleAvailability {
  id: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
}

interface VehicleAvailabilityManagerProps {
  vehicleId: number;
}

export default function VehicleAvailabilityManager({ vehicleId }: VehicleAvailabilityManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newAvailability, setNewAvailability] = useState({
    startDate: "",
    endDate: "",
    isAvailable: true,
    reason: "",
  });
  const [editData, setEditData] = useState({
    startDate: "",
    endDate: "",
    isAvailable: true,
    reason: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: availability, isLoading } = useQuery<VehicleAvailability[]>({
    queryKey: ["/api/vehicles", vehicleId, "availability"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newAvailability) =>
      apiRequest("POST", `/api/vehicles/${vehicleId}/availability`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/vehicles", vehicleId, "availability"] 
      });
      setIsAdding(false);
      setNewAvailability({
        startDate: "",
        endDate: "",
        isAvailable: true,
        reason: "",
      });
      toast({
        title: "Sucesso",
        description: "Período de disponibilidade adicionado",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Falha ao adicionar período",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (availabilityId: number) =>
      apiRequest("DELETE", `/api/vehicles/${vehicleId}/availability/${availabilityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/vehicles", vehicleId, "availability"] 
      });
      toast({
        title: "Sucesso",
        description: "Período removido com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover período",
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    if (!newAvailability.startDate || !newAvailability.endDate) {
      toast({
        title: "Erro",
        description: "Preencha as datas de início e fim",
        variant: "destructive",
      });
      return;
    }

    if (new Date(newAvailability.startDate) >= new Date(newAvailability.endDate)) {
      toast({
        title: "Erro",
        description: "A data de início deve ser anterior à data de fim",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(newAvailability);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este período?")) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (item: VehicleAvailability) => {
    setEditingId(item.id);
    setEditData({
      startDate: item.startDate,
      endDate: item.endDate,
      isAvailable: item.isAvailable,
      reason: item.reason || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({
      startDate: "",
      endDate: "",
      isAvailable: true,
      reason: "",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const getStatusText = (isAvailable: boolean, reason?: string) => {
    if (isAvailable) return "Disponível";
    return reason || "Indisponível";
  };

  const getStatusColor = (isAvailable: boolean) => {
    return isAvailable 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-lg">Carregando disponibilidade...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Gerenciar Disponibilidade
        </CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Período
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isAdding && (
          <div className="mb-6 p-4 border rounded-lg bg-muted/20">
            <h3 className="text-lg font-semibold mb-4">Novo Período</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newAvailability.startDate}
                  onChange={(e) => 
                    setNewAvailability({ ...newAvailability, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newAvailability.endDate}
                  onChange={(e) => 
                    setNewAvailability({ ...newAvailability, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full p-2 border rounded-md"
                  value={newAvailability.isAvailable ? "available" : "unavailable"}
                  onChange={(e) => 
                    setNewAvailability({ 
                      ...newAvailability, 
                      isAvailable: e.target.value === "available" 
                    })
                  }
                >
                  <option value="available">Disponível</option>
                  <option value="unavailable">Indisponível</option>
                </select>
              </div>
              <div>
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  value={newAvailability.reason}
                  onChange={(e) => 
                    setNewAvailability({ ...newAvailability, reason: e.target.value })
                  }
                  placeholder="Ex: Manutenção, uso pessoal"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAdd}
                disabled={createMutation.isPending}
              >
                <Check className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {availability?.length ? (
          <div className="space-y-3">
            {availability.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                {editingId === item.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      type="date"
                      value={editData.startDate}
                      onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                    />
                    <Input
                      type="date"
                      value={editData.endDate}
                      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                    />
                    <select
                      className="p-2 border rounded-md"
                      value={editData.isAvailable ? "available" : "unavailable"}
                      onChange={(e) => 
                        setEditData({ 
                          ...editData, 
                          isAvailable: e.target.value === "available" 
                        })
                      }
                    >
                      <option value="available">Disponível</option>
                      <option value="unavailable">Indisponível</option>
                    </select>
                    <Input
                      value={editData.reason}
                      onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
                      placeholder="Motivo"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {formatDate(item.startDate)} - {formatDate(item.endDate)}
                      </span>
                      <Badge className={getStatusColor(item.isAvailable)}>
                        {getStatusText(item.isAvailable, item.reason)}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId === item.id ? (
                    <>
                      <Button size="sm" variant="outline">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(item)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum período configurado
            </h3>
            <p className="text-gray-600">
              Configure os períodos de disponibilidade do seu veículo.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}