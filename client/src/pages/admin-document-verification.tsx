import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Eye, 
  Check, 
  X, 
  User, 
  Calendar, 
  Mail,
  ArrowLeft,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Link } from "wouter";

interface Document {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  documentType: string;
  documentUrl: string;
  documentNumber: string;
  status: string;
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
}

interface DocumentDetailsDialogProps {
  document: Document;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

function DocumentDetailsDialog({ document, onApprove, onReject, isApproving, isRejecting }: DocumentDetailsDialogProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);

  const handleApprove = () => {
    onApprove(document.id);
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      return;
    }
    onReject(document.id, rejectionReason);
    setRejectionReason("");
    setShowRejectionForm(false);
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'cnh':
        return 'CNH (Carteira Nacional de Habilitação)';
      case 'comprovante_residencia':
        return 'Comprovante de Residência';
      default:
        return type;
    }
  };

  return (
    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Verificação de Documento - {getDocumentTypeLabel(document.documentType)}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Nome:</strong> {document.userName}</div>
            <div><strong>Email:</strong> {document.userEmail}</div>
            <div><strong>Tipo de Documento:</strong> {getDocumentTypeLabel(document.documentType)}</div>
            <div><strong>Número do Documento:</strong> {document.documentNumber || 'Não informado'}</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <strong>Enviado em:</strong> {new Date(document.uploadedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </CardContent>
        </Card>

        {/* Document Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50">
              <img
                src={document.documentUrl}
                alt={`Documento ${getDocumentTypeLabel(document.documentType)}`}
                className="w-full max-w-2xl mx-auto rounded border"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          {!showRejectionForm ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                {isApproving ? "Aprovando..." : "Aprovar Documento"}
              </Button>
              <Button
                onClick={() => setShowRejectionForm(true)}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeitar Documento
              </Button>
            </>
          ) : (
            <div className="space-y-4 w-full">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Motivo da rejeição:
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Descreva o motivo da rejeição (ex: documento ilegível, informações incompletas, etc.)..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isRejecting}
                  variant="destructive"
                  className="flex-1"
                >
                  {isRejecting ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason("");
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

export default function AdminDocumentVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
  });

  const approveMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest("POST", `/api/admin/documents/${documentId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Documento aprovado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aprovar documento",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ documentId, reason }: { documentId: number; reason: string }) => {
      return apiRequest("POST", `/api/admin/documents/${documentId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Documento Rejeitado",
        description: "Documento rejeitado e usuário notificado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar documento",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (documentId: number) => {
    approveMutation.mutate(documentId);
  };

  const handleReject = (documentId: number, reason: string) => {
    rejectMutation.mutate({ documentId, reason });
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'cnh':
        return 'CNH';
      case 'comprovante_residencia':
        return 'Comp. Residência';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'rejected':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  // Filter pending documents for priority display
  const pendingDocuments = documents.filter(doc => doc.status === 'pending');
  const reviewedDocuments = documents.filter(doc => doc.status !== 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Painel
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verificação de Documentos</h1>
              <p className="text-gray-600 mt-2">
                Analisar e validar documentos enviados pelos usuários
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {pendingDocuments.length} pendente{pendingDocuments.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {documents.length} total
              </Badge>
            </div>
          </div>
        </div>

        {/* Pending Documents */}
        {pendingDocuments.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Documentos Pendentes ({pendingDocuments.length})
              </h2>
            </div>
            <div className="space-y-4">
              {pendingDocuments.map(document => (
                <Card key={document.id} className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Document Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getDocumentTypeLabel(document.documentType)}
                          </h3>
                          <Badge className={`${getStatusColor(document.status)} border`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {getStatusLabel(document.status)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Usuário:</span>
                            <div className="font-medium">{document.userName}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <div className="font-medium">{document.userEmail}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Número:</span>
                            <div className="font-medium">{document.documentNumber || 'Não informado'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Enviado em:</span>
                            <div className="font-medium">
                              {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 lg:w-48">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Documento
                            </Button>
                          </DialogTrigger>
                          <DocumentDetailsDialog
                            document={document}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            isApproving={approveMutation.isPending}
                            isRejecting={rejectMutation.isPending}
                          />
                        </Dialog>

                        <Button
                          onClick={() => handleApprove(document.id)}
                          disabled={approveMutation.isPending}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Documents */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Histórico de Documentos
          </h2>
          
          {documents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum documento encontrado
                </h3>
                <p className="text-gray-600">
                  Os documentos enviados pelos usuários aparecerão aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {documents.map(document => (
                <Card key={document.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{getDocumentTypeLabel(document.documentType)}</h4>
                          <Badge className={`${getStatusColor(document.status)} border text-xs`}>
                            {getStatusLabel(document.status)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {document.userName} ({document.userEmail})
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(document.uploadedAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DocumentDetailsDialog
                          document={document}
                          onApprove={handleApprove}
                          onReject={handleReject}
                          isApproving={approveMutation.isPending}
                          isRejecting={rejectMutation.isPending}
                        />
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}