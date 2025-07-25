import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Download, Eye, Filter } from "lucide-react";

export default function AdminContractsPanel() {
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
    offset: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Get contracts with filters
  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['/api/admin/contracts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('limit', filters.limit.toString());
      params.append('offset', filters.offset.toString());

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/contracts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'signed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'sent':
        return 'Enviado';
      case 'signed':
        return 'Assinado';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredContracts = (Array.isArray(contracts) ? contracts : []).filter((contract: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contract.contractNumber?.toLowerCase().includes(searchLower) ||
      contract.contractData?.renter?.name?.toLowerCase().includes(searchLower) ||
      contract.contractData?.owner?.name?.toLowerCase().includes(searchLower) ||
      contract.contractData?.vehicle?.brand?.toLowerCase().includes(searchLower) ||
      contract.contractData?.vehicle?.model?.toLowerCase().includes(searchLower)
    );
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleDownload = async (contractId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/download`);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `contrato-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Painel de Contratos</h2>
          <p className="text-gray-600">Gerencie e monitore todos os contratos da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            Total: {filteredContracts.length} contratos
          </span>
        </div>
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
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, nome, veículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="signed">Assinado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Input
              type="date"
              placeholder="Data inicial"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div className="flex gap-4 mt-4">
            <Input
              type="date"
              placeholder="Data final"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => {
                setFilters({
                  status: '',
                  dateFrom: '',
                  dateTo: '',
                  limit: 50,
                  offset: 0,
                });
                setSearchTerm('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Carregando contratos...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Nenhum contrato encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Locatário</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinaturas</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.map((contract: any) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        #{contract.contractNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.contractData.renter.name}</p>
                          <p className="text-sm text-gray-600">{contract.contractData.renter.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{contract.contractData.owner.name}</p>
                          <p className="text-sm text-gray-600">{contract.contractData.owner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {contract.contractData.vehicle.brand} {contract.contractData.vehicle.model}
                          </p>
                          <p className="text-sm text-gray-600">
                            {contract.contractData.vehicle.year}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contract.status)}>
                          {getStatusText(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div className={`w-3 h-3 rounded-full ${
                            contract.renterSigned ? 'bg-green-500' : 'bg-gray-300'
                          }`} title="Locatário" />
                          <div className={`w-3 h-3 rounded-full ${
                            contract.ownerSigned ? 'bg-green-500' : 'bg-gray-300'
                          }`} title="Proprietário" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(contract.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/contracts/${contract.id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
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

      {/* Pagination */}
      {filteredContracts.length >= filters.limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
            disabled={filters.offset === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
          >
            Próximo
          </Button>
        </div>
      )}
    </div>
  );
}