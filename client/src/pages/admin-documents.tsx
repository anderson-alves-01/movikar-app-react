import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/header";
import { Check, X, Eye, Download, Search, Filter } from "lucide-react";

interface UserDocument {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  documentType: string;
  documentUrl: string;
  documentNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
}

export default function AdminDocuments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<UserDocument[]>({
    queryKey: ["/api/admin/documents"],
  });

  const approveMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("POST", `/api/admin/documents/${documentId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Documento Aprovado",
        description: "O documento foi aprovado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      await apiRequest("POST", `/api/admin/documents/${documentId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Documento Rejeitado",
        description: "O documento foi rejeitado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
      setSelectedDocument(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc: UserDocument) => {
    const matchesSearch = doc.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.documentNumber && doc.documentNumber.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = documentTypeFilter === "all" || doc.documentType === documentTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'cnh':
        return 'CNH (Carteira de Habilitação)';
      case 'comprovante_residencia':
        return 'Comprovante de Residência';
      default:
        return type;
    }
  };

  const handleApprove = (documentId: number) => {
    approveMutation.mutate(documentId);
  };

  const handleReject = (documentId: number) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Motivo da rejeição é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ documentId, reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Verificação de Documentos</h1>
            <p className="text-gray-600">Analise e valide os documentos enviados pelos usuários</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nome, email ou número do documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="document-type">Tipo de Documento</Label>
                <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="cnh">CNH</SelectItem>
                    <SelectItem value="comprovante_residencia">Comprovante de Residência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setDocumentTypeFilter("all");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="grid gap-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-gray-500">Nenhum documento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document: UserDocument) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div>
                          <h3 className="font-semibold">{document.userName}</h3>
                          <p className="text-sm text-gray-600">{document.userEmail}</p>
                        </div>
                        {getStatusBadge(document.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tipo:</span> {getDocumentTypeName(document.documentType)}
                        </div>
                        {document.documentNumber && (
                          <div>
                            <span className="font-medium">Número:</span> {document.documentNumber}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Enviado em:</span> {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {document.rejectionReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <span className="font-medium text-red-700">Motivo da rejeição:</span>
                          <p className="text-red-600 text-sm">{document.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocument(document)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizar
                      </Button>
                      
                      {document.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleApprove(document.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setSelectedDocument(document)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Document Review Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>Visualização e Análise de Documento</CardTitle>
                <CardDescription>
                  {getDocumentTypeName(selectedDocument.documentType)} - {selectedDocument.userName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Usuário:</span> {selectedDocument.userName}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedDocument.userEmail}
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> {getDocumentTypeName(selectedDocument.documentType)}
                  </div>
                  {selectedDocument.documentNumber && (
                    <div>
                      <span className="font-medium">Número:</span> {selectedDocument.documentNumber}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Status:</span> {getStatusBadge(selectedDocument.status)}
                  </div>
                  <div>
                    <span className="font-medium">Enviado em:</span> {new Date(selectedDocument.uploadedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Document Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Documento</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = selectedDocument.documentUrl;
                        link.download = `${selectedDocument.documentType}_${selectedDocument.userName}.${selectedDocument.documentUrl.includes('pdf') ? 'pdf' : 'jpg'}`;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="bg-white border rounded-lg overflow-hidden max-h-96">
                    {selectedDocument.documentUrl.includes('data:application/pdf') ? (
                      <iframe
                        src={selectedDocument.documentUrl}
                        className="w-full h-96"
                        title="Visualização do Documento PDF"
                      />
                    ) : selectedDocument.documentUrl.includes('data:image') ? (
                      <img
                        src={selectedDocument.documentUrl}
                        alt="Visualização do Documento"
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">Preview não disponível para este tipo de arquivo</p>
                        <p className="text-sm text-gray-400 mt-1">Use o botão Download para visualizar</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedDocument.status === 'pending' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejection-reason">Motivo da Rejeição (opcional para rejeitar)</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Descreva o motivo da rejeição..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(null);
                          setRejectionReason("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleReject(selectedDocument.id)}
                        disabled={rejectMutation.isPending}
                      >
                        Rejeitar
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(selectedDocument.id)}
                        disabled={approveMutation.isPending}
                      >
                        Aprovar
                      </Button>
                    </div>
                  </div>
                )}

                {selectedDocument.status !== 'pending' && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDocument(null)}
                    >
                      Fechar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}