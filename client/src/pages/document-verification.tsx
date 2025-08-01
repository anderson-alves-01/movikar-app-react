import { useState, useRef } from "react";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UserDocument {
  id: number;
  documentType: string;
  status: string;
  documentUrl: string;
  documentNumber?: string;
  rejectionReason?: string;
  uploadedAt: string;
  reviewedAt?: string;
}

interface User {
  id: number;
  verificationStatus: string;
  documentsSubmitted: boolean;
  canRentVehicles: boolean;
  rejectionReason?: string;
}

const documentTypes = [
  { id: 'cnh', name: 'CNH (Carteira de Habilitação)', required: true },
  { id: 'comprovante_residencia', name: 'Comprovante de Residência', required: true },
];

export default function DocumentVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<UserDocument[]>({
    queryKey: ['/api/user/documents'],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType, documentNumber }: { 
      file: File; 
      documentType: string; 
      documentNumber?: string;
    }) => {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      if (documentNumber) {
        formData.append('documentNumber', documentNumber);
      }

      const response = await fetch('/api/user/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Use cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Documento enviado",
        description: `Documento ${variables.documentType.toUpperCase()} enviado com sucesso. Aguarde a análise.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setUploadingFiles(prev => ({ ...prev, [variables.documentType]: false }));
    },
    onError: (error: any, variables) => {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: `Falha ao enviar documento ${variables.documentType.toUpperCase()}. Tente novamente.`,
        variant: "destructive",
      });
      setUploadingFiles(prev => ({ ...prev, [variables.documentType]: false }));
    },
  });

  const handleFileUpload = async (documentType: string, file: File, documentNumber?: string) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Formato inválido",
        description: "Apenas imagens (JPG, PNG) e PDF são aceitos.",
        variant: "destructive",
      });
      return;
    }

    setUploadingFiles(prev => ({ ...prev, [documentType]: true }));
    uploadMutation.mutate({ file, documentType, documentNumber });
  };

  const getDocumentStatus = (documentType: string) => {
    return documents.find(doc => doc.documentType === documentType);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">Não enviado</Badge>;
    }
  };

  const getOverallProgress = () => {
    const totalDocs = documentTypes.length;
    const approvedDocs = documents.filter(doc => doc.status === 'approved').length;
    return (approvedDocs / totalDocs) * 100;
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Verificado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-4 h-4 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">Não iniciado</Badge>;
    }
  };

  if (userLoading || documentsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Verificação de Documentos</h1>
        <p className="text-gray-600">
          Envie sua CNH e comprovante de residência para ser verificado e poder alugar veículos na plataforma
        </p>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Status de Verificação
            {user && getVerificationStatusBadge(user.verificationStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso dos documentos</span>
              <span>{Math.round(getOverallProgress())}%</span>
            </div>
            <Progress value={getOverallProgress()} className="w-full" />
          </div>
          
          {user?.verificationStatus === 'verified' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Parabéns! Você está verificado e pode alugar veículos.
                </span>
              </div>
            </div>
          )}

          {user?.verificationStatus === 'rejected' && user.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <span className="text-red-800 font-medium block">Verificação rejeitada</span>
                  <span className="text-red-700 text-sm">{user.rejectionReason}</span>
                </div>
              </div>
            </div>
          )}

          {user?.verificationStatus === 'pending' && user.documentsSubmitted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800">
                  Documentos enviados. Aguardando análise da equipe.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const docStatus = getDocumentStatus(docType.id);
          const isUploading = uploadingFiles[docType.id];

          return (
            <Card key={docType.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>{docType.name}</span>
                    {docType.required && <span className="text-red-500">*</span>}
                  </div>
                  {getStatusBadge(docStatus?.status || 'not_uploaded')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!docStatus && (
                  <div className="space-y-4">
                    {(docType.id === 'cpf' || docType.id === 'rg' || docType.id === 'cnh') && (
                      <div>
                        <Label htmlFor={`${docType.id}_number`}>
                          Número do {docType.name}
                        </Label>
                        <Input
                          id={`${docType.id}_number`}
                          placeholder={`Digite o número do ${docType.name}`}
                          ref={(el) => {
                            if (!fileInputRefs.current[`${docType.id}_number`]) {
                              fileInputRefs.current[`${docType.id}_number`] = el;
                            }
                          }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <Label htmlFor={`${docType.id}_file`}>
                        Arquivo do {docType.name}
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id={`${docType.id}_file`}
                          accept="image/*,application/pdf"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current[`${docType.id}_file`] = el;
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const numberInput = fileInputRefs.current[`${docType.id}_number`] as HTMLInputElement;
                              const documentNumber = numberInput?.value || undefined;
                              handleFileUpload(docType.id, file, documentNumber);
                            }
                          }}
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 mb-2">
                          Clique para enviar ou arraste o arquivo aqui
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG ou PDF (máx. 10MB)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-2"
                          onClick={() => fileInputRefs.current[`${docType.id}_file`]?.click()}
                          disabled={isUploading}
                        >
                          {isUploading ? 'Enviando...' : 'Selecionar Arquivo'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {docStatus && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      Enviado em: {new Date(docStatus.uploadedAt).toLocaleDateString('pt-BR')}
                    </div>
                    {docStatus.documentNumber && (
                      <div className="text-sm text-gray-600">
                        Número: {docStatus.documentNumber}
                      </div>
                    )}
                    {docStatus.status === 'rejected' && docStatus.rejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                          <div>
                            <span className="text-red-800 font-medium text-sm block">
                              Motivo da rejeição:
                            </span>
                            <span className="text-red-700 text-sm">
                              {docStatus.rejectionReason}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Informações Importantes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>• Todos os documentos são obrigatórios para verificação</p>
          <p>• A análise pode levar até 2 dias úteis</p>
          <p>• Documentos devem estar legíveis e atualizados</p>
          <p>• Suas informações são protegidas e criptografadas</p>
          <p>• Em caso de rejeição, você pode reenviar os documentos</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}