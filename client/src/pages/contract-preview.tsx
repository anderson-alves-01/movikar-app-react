import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, CheckCircle, Clock, ExternalLink, Download, AlertTriangle } from 'lucide-react';

export default function ContractPreview() {
  const [, contractParams] = useRoute('/contracts/:id');
  const [, bookingParams] = useRoute('/contract-preview/:bookingId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Support both /contracts/:id and /contract-preview/:bookingId routes
  const contractId = contractParams?.id;
  const bookingId = bookingParams?.bookingId;

  // Fetch contract details directly if contractId is provided
  const { data: contract, isLoading: isLoadingContract } = useQuery({
    queryKey: ['/api/contracts', contractId],
    enabled: !!contractId,
  });

  // Fetch booking details with contract (when using bookingId)
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['/api/bookings', bookingId],
    enabled: !!bookingId,
  });

  // Fetch contract preview (when using bookingId)
  const { data: contractPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['/api/contracts/preview', bookingId],
    enabled: !!bookingId,
  });

  // Determine which data to use
  const isLoading = isLoadingContract || isLoadingBooking || isLoadingPreview;
  const contractData = contract || contractPreview;
  const bookingData = booking || (contract as any)?.booking;

  // Sign contract with DocuSign
  const signContractMutation = useMutation({
    mutationFn: async () => {
      const idToUse = bookingId || (contract as any)?.bookingId;
      if (!idToUse) {
        throw new Error('ID da reserva não encontrado');
      }
      const response = await apiRequest('POST', `/api/contracts/sign-docusign/${idToUse}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Resposta da assinatura DocuSign:', data);
      
      if (data.signatureUrl) {
        console.log('Redirecionando para DocuSign:', data.signatureUrl);
        // Redirect immediately
        window.location.href = data.signatureUrl;
      } else {
        toast({
          title: "Erro",
          description: "URL de assinatura DocuSign não recebida",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('Erro na assinatura:', error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao iniciar assinatura digital DocuSign",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600">Carregando preview do contrato...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingData && !contractData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Reserva não encontrada</h1>
            <Button onClick={() => setLocation('/')}>Voltar ao Início</Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if contract is already signed
  const isContractSigned = bookingData?.status === 'contracted' ||
                           (contractData as any)?.renterSigned || 
                           (contractData as any)?.ownerSigned ||
                           (contractData as any)?.status === 'completed' ||
                           (contractData as any)?.status === 'signed';

  const contractStatus = bookingData?.status || (contractData as any)?.status;

  // Show status information in booking summary
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'contracted':
        return 'default';
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'contracted':
        return 'Contratado';
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Preview do Contrato</h1>
            <p className="text-gray-600">Revise os detalhes antes de assinar digitalmente</p>
          </div>

          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhes da Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Veículo</label>
                  <p className="font-semibold">{bookingData?.vehicle?.brand} {bookingData?.vehicle?.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex gap-2">
                    <Badge variant={getStatusBadgeVariant(contractStatus)}>
                      {getStatusText(contractStatus)}
                    </Badge>
                    {isContractSigned && (
                      <Badge className="bg-green-600">
                        Assinado
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Período</label>
                  <p>{new Date(bookingData?.startDate).toLocaleDateString('pt-BR')} - {new Date(bookingData?.endDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Total</label>
                  <p className="font-semibold text-green-600">R$ {bookingData?.totalPrice}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Contrato de Aluguel de Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold">CONTRATO DE LOCAÇÃO DE VEÍCULO</h2>
                    <p className="text-sm text-gray-600 mt-2">
                      Número: CNT-{bookingData?.id || (contractData as any)?.id}-{Date.now().toString().slice(-6)}
                    </p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-2">1. PARTES CONTRATANTES</h3>
                      <p><strong>LOCADOR:</strong> {bookingData?.vehicle?.owner?.name || 'Proprietário do Veículo'}</p>
                      <p><strong>LOCATÁRIO:</strong> {bookingData?.renter?.name || 'Locatário'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">2. OBJETO DO CONTRATO</h3>
                      <p>O LOCADOR concede ao LOCATÁRIO, em caráter temporário e oneroso, o uso do veículo:</p>
                      <p><strong>Marca/Modelo:</strong> {bookingData?.vehicle?.brand} {bookingData?.vehicle?.model} {bookingData?.vehicle?.year}</p>
                      <p><strong>Placa:</strong> {bookingData?.vehicle?.licensePlate || 'A definir'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">3. PERÍODO E VALORES</h3>
                      <p><strong>Período:</strong> {new Date(bookingData?.startDate).toLocaleDateString('pt-BR')} às {new Date(bookingData?.endDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Valor da Locação:</strong> R$ {bookingData?.totalPrice}</p>
                      <p><strong>Taxa de Serviço:</strong> R$ {bookingData?.serviceFee || '0,00'}</p>
                      <p><strong>Seguro:</strong> R$ {bookingData?.insuranceFee || '0,00'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">4. RESPONSABILIDADES</h3>
                      <p>O LOCATÁRIO compromete-se a:</p>
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>Utilizar o veículo com cuidado e responsabilidade</li>
                        <li>Devolver o veículo nas mesmas condições de entrega</li>
                        <li>Comunicar imediatamente qualquer acidente ou problema</li>
                        <li>Respeitar todas as leis de trânsito</li>
                        <li>Não transferir a posse do veículo a terceiros</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">5. ASSINATURA DIGITAL</h3>
                      <p>Este contrato será assinado digitalmente através da plataforma DocuSign, garantindo autenticidade e validade jurídica internacional.</p>
                    </div>
                  </div>


                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {isContractSigned ? (
                  // Contract already signed - show message
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Contrato Já Assinado</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Este contrato já foi assinado digitalmente e possui validade jurídica.
                      Não é possível assinar novamente um contrato já finalizado.
                    </p>
                    <div className="mt-3">
                      <Badge className="bg-green-600">
                        Status: {contractStatus === 'contracted' ? 'Contratado' : 'Assinado'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  // Contract not signed - show signing option
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Assinatura Digital DocuSign</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Você será redirecionado para a plataforma DocuSign para realizar a assinatura digital do contrato.
                      A assinatura será válida juridicamente e reconhecida internacionalmente.
                    </p>
                  </div>
                )}

                <div className="flex gap-4">
                  {!isContractSigned ? (
                    <Button
                      onClick={() => signContractMutation.mutate()}
                      disabled={signContractMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {signContractMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Preparando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assinar com DocuSign
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="flex-1"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Contrato Já Assinado
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/reservations')}
                    disabled={signContractMutation.isPending}
                  >
                    Voltar para Reservas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}