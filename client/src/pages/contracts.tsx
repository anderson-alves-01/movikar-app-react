import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Download, Eye, Signature, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import Header from "@/components/header";

interface ContractData {
  id: number;
  contractNumber: string;
  status: string;
  bookingId: number;
  renterSigned: boolean;
  ownerSigned: boolean;
  renterSignedAt?: string;
  ownerSignedAt?: string;
  pdfUrl?: string;
  signedPdfUrl?: string;
  externalDocumentId?: string;
  contractData: {
    vehicle: any;
    renter: any;
    owner: any;
    booking: any;
  };
  createdAt: string;
}

export default function Contracts() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [showContractDialog, setShowContractDialog] = useState(false);

  // Get user's contracts (as renter or owner)
  const { data: contracts, isLoading } = useQuery<ContractData[]>({
    queryKey: ["/api/contracts/user"],
    enabled: false, // Disabled to prevent auth loops
  });

  // Send contract for signature
  const sendContractMutation = useMutation({
    mutationFn: (contractId: number) =>
      apiRequest("POST", `/api/contracts/${contractId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/user"] });
      toast({
        title: "Contrato Enviado",
        description: "Contrato foi enviado para assinatura digital.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar contrato",
        variant: "destructive",
      });
    },
  });

  // Download contract
  const downloadContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      const response = await apiRequest('GET', `/api/contracts/${contractId}/download`, undefined, {
        responseType: 'blob'
      });
      
      const blob = await response.blob();
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
        title: "Download Iniciado",
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

  // Sign contract digitally
  const signContractMutation = useMutation({
    mutationFn: (contractId: number) =>
      apiRequest("POST", `/api/contracts/${contractId}/sign`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/user"] });
      toast({
        title: "Assinatura Solicitada",
        description: "Redirecionando para plataforma de assinatura digital...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao processar assinatura",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (contract: ContractData) => {
    const isRenter = contract.contractData.renter.id === user?.id;
    const isOwner = contract.contractData.owner.id === user?.id;
    
    // Check if current user has signed
    const currentUserSigned = (isRenter && contract.renterSigned) || (isOwner && contract.ownerSigned);
    const bothSigned = contract.renterSigned && contract.ownerSigned;
    
    if (bothSigned) {
      return <Badge className="bg-green-600">Totalmente Assinado</Badge>;
    }
    
    if (currentUserSigned) {
      return <Badge className="bg-blue-600">Aguardando Outra Parte</Badge>;
    }
    
    if (contract.status === "sent") {
      return <Badge className="bg-orange-600">Pendente Assinatura</Badge>;
    }
    
    if (contract.status === "draft") {
      return <Badge variant="secondary">Rascunho</Badge>;
    }
    
    return <Badge variant="outline">{contract.status}</Badge>;
  };

  const canSign = (contract: ContractData) => {
    if (contract.status !== "sent") return false;
    
    const isRenter = contract.contractData.renter.id === user?.id;
    const isOwner = contract.contractData.owner.id === user?.id;
    
    if (isRenter && !contract.renterSigned) return true;
    if (isOwner && !contract.ownerSigned) return true;
    
    return false;
  };

  const canSend = (contract: ContractData) => {
    return contract.status === "draft" && contract.contractData.owner.id === user?.id;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando contratos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Contratos</h1>
          <p className="text-gray-600">Gerencie seus contratos de locação</p>
        </div>

        {!contracts || contracts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600">
                Seus contratos aparecerão aqui quando você fizer ou receber reservas aprovadas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Contrato #{contract.contractNumber}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {contract.contractData.vehicle.brand} {contract.contractData.vehicle.model} {contract.contractData.vehicle.year}
                      </p>
                    </div>
                    {getStatusBadge(contract)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Locatário</p>
                      <p className="font-medium">{contract.contractData.renter.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {contract.renterSigned ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Assinado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Pendente</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Proprietário</p>
                      <p className="font-medium">{contract.contractData.owner.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {contract.ownerSigned ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Assinado</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-500">Pendente</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowContractDialog(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>

                    {canSend(contract) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendContractMutation.mutate(contract.id)}
                        disabled={sendContractMutation.isPending}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Enviar para Assinatura
                      </Button>
                    )}

                    {canSign(contract) && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        size="sm"
                        onClick={() => signContractMutation.mutate(contract.id)}
                        disabled={signContractMutation.isPending}
                      >
                        <Signature className="h-4 w-4 mr-2" />
                        Assinar Digitalmente
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
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contract Details Dialog */}
        <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
            </DialogHeader>
            
            {selectedContract && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Número do Contrato</p>
                    <p className="font-medium">{selectedContract.contractNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    {getStatusBadge(selectedContract)}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Veículo</p>
                  <p className="font-medium">
                    {selectedContract.contractData.vehicle.brand} {selectedContract.contractData.vehicle.model} {selectedContract.contractData.vehicle.year}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Data de Início</p>
                    <p className="font-medium">
                      {new Date(selectedContract.contractData.booking.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Fim</p>
                    <p className="font-medium">
                      {new Date(selectedContract.contractData.booking.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {selectedContract.renterSignedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Assinado pelo Locatário</p>
                    <p className="font-medium">
                      {new Date(selectedContract.renterSignedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {selectedContract.ownerSignedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Assinado pelo Proprietário</p>
                    <p className="font-medium">
                      {new Date(selectedContract.ownerSignedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {selectedContract.externalDocumentId && (
                  <div>
                    <p className="text-sm text-gray-600">ID Documento Externo</p>
                    <p className="font-mono text-sm">{selectedContract.externalDocumentId}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}