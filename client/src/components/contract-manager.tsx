import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Send, Eye, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContractData {
  id: number;
  contractNumber: string;
  status: string;
  createdAt: string;
  signaturePlatform: string;
  pdfUrl?: string;
}

interface ContractManagerProps {
  bookingId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ContractManager({ bookingId, open, onOpenChange }: ContractManagerProps) {
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get contracts for this booking
  const { data: contracts = [], isLoading } = useQuery<ContractData[]>({
    queryKey: ['/api/bookings', bookingId, 'contracts'],
    enabled: open && !!bookingId,
  });

  // Generate contract mutation
  const generateContractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/contracts/generate', { bookingId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato gerado!",
        description: "O contrato foi gerado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'contracts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao gerar contrato",
        variant: "destructive",
      });
    },
  });

  // Send contract for signature mutation
  const sendContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest('POST', `/api/contracts/${contractId}/send`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contrato enviado!",
        description: "O contrato foi enviado para assinatura eletrônica.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', bookingId, 'contracts'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar contrato",
        variant: "destructive",
      });
    },
  });

  // Download contract mutation
  const downloadContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest('GET', `/api/contracts/${contractId}/download`);
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
    },
    onSuccess: () => {
      toast({
        title: "Download iniciado",
        description: "O download do contrato foi iniciado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao baixar contrato",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'signed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

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
        return 'Enviado para Assinatura';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerenciar Contratos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Contratos da Reserva #{bookingId}</h3>
              <p className="text-sm text-gray-600">
                Gerencie os contratos de locação para esta reserva
              </p>
            </div>
            
            {contracts.length === 0 && (
              <Button 
                onClick={() => generateContractMutation.mutate()}
                disabled={generateContractMutation.isPending}
                className="bg-primary hover:bg-red-600"
              >
                <FileText className="h-4 w-4 mr-2" />
                {generateContractMutation.isPending ? 'Gerando...' : 'Gerar Contrato'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Contract List */}
          {isLoading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Carregando contratos...</p>
            </div>
          ) : contracts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Nenhum contrato encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Gere um contrato para esta reserva para começar o processo de assinatura eletrônica.
                </p>
                <Button 
                  onClick={() => generateContractMutation.mutate()}
                  disabled={generateContractMutation.isPending}
                  className="bg-primary hover:bg-red-600"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Primeiro Contrato
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract: ContractData) => (
                <Card key={contract.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(contract.status)}
                        Contrato #{contract.contractNumber}
                      </CardTitle>
                      <Badge className={getStatusColor(contract.status)}>
                        {getStatusText(contract.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Data de Criação</p>
                        <p className="font-medium">
                          {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Plataforma de Assinatura</p>
                        <p className="font-medium capitalize">
                          {contract.signaturePlatform || 'Autentique'}
                        </p>
                      </div>
                    </div>

                    {/* Signature Status */}
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium">Status das Assinaturas:</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          {contract.renterSigned ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            Locatário: {contract.renterSigned ? 'Assinado' : 'Pendente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {contract.ownerSigned ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">
                            Proprietário: {contract.ownerSigned ? 'Assinado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {contract.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendContractMutation.mutate(contract.id)}
                          disabled={sendContractMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar para Assinatura
                        </Button>
                      )}
                      
                      {contract.pdfUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadContractMutation.mutate(contract.id)}
                          disabled={downloadContractMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedContract(contract)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Contract Details Modal */}
          {selectedContract && (
            <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Detalhes do Contrato #{selectedContract.contractNumber}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge className={getStatusColor(selectedContract.status)}>
                        {getStatusText(selectedContract.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Criado em</p>
                      <p>{new Date(selectedContract.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {selectedContract.renterSignedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Assinado pelo Locatário em</p>
                      <p>{new Date(selectedContract.renterSignedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  )}

                  {selectedContract.ownerSignedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Assinado pelo Proprietário em</p>
                      <p>{new Date(selectedContract.ownerSignedAt).toLocaleString('pt-BR')}</p>
                    </div>
                  )}

                  {selectedContract.externalDocumentId && (
                    <div>
                      <p className="text-sm text-gray-600">ID do Documento Externo</p>
                      <p className="font-mono text-sm">{selectedContract.externalDocumentId}</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}