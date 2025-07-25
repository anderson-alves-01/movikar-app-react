import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, Filter, Shield, CheckCircle, XCircle, Edit, Trash2, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/lib/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AdminLayout from "@/components/admin-layout";

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  isOwner: boolean;
  isRenter: boolean;
  isVerified: boolean;
  role: string;
  rating: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    isOwner: false,
    isRenter: true,
    isVerified: false,
    role: 'user',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  // Get all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      if (!token) {
        throw new Error('No authentication token');
      }
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Token inválido ou expirado');
        }
        throw new Error('Failed to fetch users');
      }
      
      return response.json();
    },
    enabled: !!token, // Only run query if token exists
  });

  const getUserTypeText = (user: User) => {
    const types = [];
    if (user.isOwner) types.push('Proprietário');
    if (user.isRenter) types.push('Locatário');
    return types.join(', ') || 'Nenhum';
  };

  const getUserTypeBadgeColor = (user: User) => {
    if (user.isOwner && user.isRenter) return 'bg-purple-100 text-purple-800';
    if (user.isOwner) return 'bg-blue-100 text-blue-800';
    if (user.isRenter) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = (Array.isArray(users) ? users : []).filter((user: User) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter && roleFilter !== 'all') {
      if (roleFilter === 'owner' && !user.isOwner) return false;
      if (roleFilter === 'renter' && !user.isRenter) return false;
      if (roleFilter === 'admin' && user.role !== 'admin') return false;
    }

    // Verification filter
    if (verificationFilter && verificationFilter !== 'all') {
      if (verificationFilter === 'verified' && !user.isVerified) return false;
      if (verificationFilter === 'unverified' && user.isVerified) return false;
    }

    return true;
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<User> }) => {
      const currentToken = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.userData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuário atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Erro ao atualizar usuário", variant: "destructive" });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const currentToken = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuário excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir usuário", variant: "destructive" });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({ title: "Usuário criado com sucesso!" });
      setIsCreateDialogOpen(false);
      setNewUserData({
        name: '',
        email: '',
        password: '',
        phone: '',
        isOwner: false,
        isRenter: true,
        isVerified: false,
        role: 'user',
      });
    },
    onError: () => {
      toast({ title: "Erro ao criar usuário", variant: "destructive" });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateUser = (formData: FormData) => {
    if (!selectedUser) return;
    
    const userData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      isOwner: formData.get('isOwner') === 'on',
      isRenter: formData.get('isRenter') === 'on',
      isVerified: formData.get('isVerified') === 'on',
      role: formData.get('role') as string,
    };

    updateUserMutation.mutate({
      id: selectedUser.id,
      userData,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUserData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
            <p className="text-gray-600">Administre todos os usuários da plataforma</p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              Total: {filteredUsers.length} usuários
            </span>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="owner">Proprietários</SelectItem>
                  <SelectItem value="renter">Locatários</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                </SelectContent>
              </Select>

              {/* Verification Filter */}
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por verificação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="unverified">Não Verificados</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setVerificationFilter('');
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carregando usuários...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Nenhum usuário encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Verificação</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">ID: {user.id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{user.email}</p>
                            {user.phone && (
                              <p className="text-sm text-gray-600">{user.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserTypeBadgeColor(user)}>
                            {getUserTypeText(user)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.isVerified ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">
                              {user.isVerified ? 'Verificado' : 'Não Verificado'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                              {Number(user.rating).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">★</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.role === 'admin' && (
                            <Badge className={getRoleBadgeColor(user.role)}>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Altere as informações do usuário selecionado.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateUser(formData);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={selectedUser.name}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={selectedUser.email}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={selectedUser.phone || ''}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isOwner">Proprietário</Label>
                    <Switch
                      id="isOwner"
                      name="isOwner"
                      defaultChecked={selectedUser.isOwner}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isRenter">Locatário</Label>
                    <Switch
                      id="isRenter"
                      name="isRenter"
                      defaultChecked={selectedUser.isRenter}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isVerified">Verificado</Label>
                    <Switch
                      id="isVerified"
                      name="isVerified"
                      defaultChecked={selectedUser.isVerified}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role">Papel do Usuário</Label>
                  <Select name="role" defaultValue={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateUserMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para criar um novo usuário.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newName">Nome</Label>
                  <Input
                    id="newName"
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newEmail">Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="newPhone">Telefone</Label>
                  <Input
                    id="newPhone"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newIsOwner">Proprietário</Label>
                  <Switch
                    id="newIsOwner"
                    checked={newUserData.isOwner}
                    onCheckedChange={(checked) => setNewUserData({ ...newUserData, isOwner: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newIsRenter">Locatário</Label>
                  <Switch
                    id="newIsRenter"
                    checked={newUserData.isRenter}
                    onCheckedChange={(checked) => setNewUserData({ ...newUserData, isRenter: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="newIsVerified">Verificado</Label>
                  <Switch
                    id="newIsVerified"
                    checked={newUserData.isVerified}
                    onCheckedChange={(checked) => setNewUserData({ ...newUserData, isVerified: checked })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newRole">Papel do Usuário</Label>
                <Select value={newUserData.role} onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}