import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit3, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";

interface VehicleBrand {
  id: number;
  name: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminVehicleBrands() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState("");
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands, isLoading } = useQuery<VehicleBrand[]>({
    queryKey: ["/api/vehicle-brands"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; logoUrl?: string }) =>
      apiRequest("POST", "/api/vehicle-brands", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-brands"] });
      setIsAdding(false);
      setNewBrandName("");
      setNewBrandLogo("");
      toast({
        title: "Sucesso",
        description: "Marca criada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao criar marca",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; logoUrl?: string } }) =>
      apiRequest("PUT", `/api/vehicle-brands/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-brands"] });
      setEditingId(null);
      toast({
        title: "Sucesso",
        description: "Marca atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar marca",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/vehicle-brands/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicle-brands"] });
      toast({
        title: "Sucesso",
        description: "Marca excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao excluir marca",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newBrandName.trim()) return;
    
    createMutation.mutate({
      name: newBrandName.trim(),
      logoUrl: newBrandLogo.trim() || undefined,
    });
  };

  const handleEdit = (brand: VehicleBrand) => {
    setEditingId(brand.id);
    setEditName(brand.name);
    setEditLogo(brand.logoUrl || "");
  };

  const handleUpdate = () => {
    if (!editName.trim() || !editingId) return;
    
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editName.trim(),
        logoUrl: editLogo.trim() || undefined,
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta marca?")) {
      deleteMutation.mutate(id);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditLogo("");
  };

  const cancelAdd = () => {
    setIsAdding(false);
    setNewBrandName("");
    setNewBrandLogo("");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Carregando marcas...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Marcas de Veículos</CardTitle>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Marca
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isAdding && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/20">
              <h3 className="text-lg font-semibold mb-4">Adicionar Nova Marca</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Marca</label>
                  <Input
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="Ex: Toyota, Honda, Volkswagen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">URL do Logo (opcional)</label>
                  <Input
                    value={newBrandLogo}
                    onChange={(e) => setNewBrandLogo(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!newBrandName.trim() || createMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={cancelAdd}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands?.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    {editingId === brand.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                      />
                    ) : (
                      brand.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === brand.id ? (
                      <Input
                        value={editLogo}
                        onChange={(e) => setEditLogo(e.target.value)}
                        placeholder="URL do logo"
                        className="max-w-xs"
                      />
                    ) : brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-muted-foreground">Sem logo</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        brand.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {brand.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(brand.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {editingId === brand.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={handleUpdate}
                            disabled={!editName.trim() || updateMutation.isPending}
                          >
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
                            onClick={() => handleEdit(brand)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(brand.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {brands?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma marca cadastrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}