import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Header from '@/components/header';

const documentTypes = [
  { id: 'cnh', name: 'CNH (Carteira Nacional de Habilitação)', required: true },
  { id: 'residence_proof', name: 'Comprovante de Residência', required: true }
];

export default function DocumentVerification() {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    }
  });

  // Fetch user documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/user/documents'],
    queryFn: async () => {
      const response = await fetch('/api/user/documents', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ formData, docType }: { formData: FormData; docType: string }) => {
      const response = await fetch(`/api/user/documents/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    }
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, [docType]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docType);

      await uploadMutation.mutateAsync({ formData, docType });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [docType]: false }));
    }
  };

  const getDocumentStatus = (docType: string) => {
    return documents?.find((doc: any) => doc.documentType === docType);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-4 h-4 mr-1" />Rejeitado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-4 h-4 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">Não enviado</Badge>;
    }
  };

  const getOverallProgress = () => {
    if (!documents || documents.length === 0) return 0;
    const totalDocs = documentTypes.length;
    const uploadedDocs = documentTypes.filter(docType => 
      documents.some((doc: any) => doc.documentType === docType.id)
    ).length;
    return (uploadedDocs / totalDocs) * 100;
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
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Verificação de Documentos</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Para garantir a segurança de todos, precisamos verificar sua identidade. 
              Envie os documentos abaixo para liberar o acesso completo à plataforma.
            </p>
          </div>

          {/* Status Geral */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-xl">
                <span className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Status de Verificação
                </span>
                {user && getVerificationStatusBadge(user.verificationStatus)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="font-medium">Progresso dos documentos</span>
                  <span className="font-bold text-blue-600">{Math.round(getOverallProgress())}%</span>
                </div>
                <Progress value={getOverallProgress()} className="w-full h-3" />
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

          {/* Upload de Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Envio de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {documentTypes.map((docType) => {
                  const existingDoc = getDocumentStatus(docType.id);
                  const isUploading = uploadingFiles[docType.id];
                  
                  return (
                    <div key={docType.id} className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-lg">{docType.name}</h3>
                          {docType.required && (
                            <Badge variant="outline" className="mt-1">Obrigatório</Badge>
                          )}
                        </div>
                        {existingDoc && getStatusBadge(existingDoc.status)}
                      </div>

                      {existingDoc?.status === 'rejected' && existingDoc.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <p className="text-red-800 text-sm">
                            <strong>Motivo da rejeição:</strong> {existingDoc.rejectionReason}
                          </p>
                        </div>
                      )}

                      {(!existingDoc || existingDoc.status === 'rejected') && (
                        <div className="space-y-4">
                          {docType.id === 'cnh' && (
                            <div>
                              <Label htmlFor={`${docType.id}-number`}>Número da CNH</Label>
                              <Input
                                id={`${docType.id}-number`}
                                placeholder="Digite o número da sua CNH"
                                className="mt-1"
                              />
                            </div>
                          )}
                          
                          <div>
                            <Label htmlFor={`${docType.id}-file`}>Arquivo</Label>
                            <div className="mt-1 flex items-center space-x-4">
                              <input
                                ref={(el) => fileInputRefs.current[docType.id] = el}
                                id={`${docType.id}-file`}
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, docType.id)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                disabled={isUploading}
                                onClick={() => fileInputRefs.current[docType.id]?.click()}
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                {isUploading ? 'Enviando...' : 'Escolher Arquivo'}
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Formatos aceitos: JPG, PNG, PDF (máx. 5MB)
                            </p>
                          </div>
                        </div>
                      )}

                      {existingDoc && existingDoc.status === 'approved' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-green-800 text-sm">
                            ✓ Documento aprovado em {new Date(existingDoc.reviewedAt || existingDoc.uploadedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}

                      {existingDoc && existingDoc.status === 'pending' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                          <p className="text-yellow-800 text-sm">
                            ⏳ Documento enviado em {new Date(existingDoc.uploadedAt).toLocaleDateString('pt-BR')}. Aguardando análise.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Dicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Dicas para o Envio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Certifique-se de que a foto está nítida e todos os dados estão legíveis</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Evite reflexos, sombras ou brilho excessivo na imagem</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>Para a CNH, certifique-se de que está dentro da validade</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>O comprovante de residência deve ser de no máximo 3 meses</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>A análise dos documentos pode levar até 24 horas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}