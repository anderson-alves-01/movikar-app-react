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
                  
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold mb-4">CONTRATO DE LOCAÇÃO DE AUTOMÓVEL POR PRAZO DETERMINADO</h2>
                    <div className="text-sm space-y-1">
                      <p><strong>Contrato Nº:</strong> {bookingData?.id || (contractData as any)?.id}-{new Date().getFullYear()}</p>
                      <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="space-y-6 text-sm leading-relaxed">
                    
                    {/* Qualificação das Partes */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">1. QUALIFICAÇÃO DAS PARTES</h3>
                      <div className="space-y-3">
                        <div>
                          <p><strong>LOCADOR:</strong> {bookingData?.vehicle?.owner?.name || 'Nome do Locador'}</p>
                          <p>CPF/CNPJ: _______________________</p>
                          <p>Endereço: {bookingData?.vehicle?.location || '_______________________'}</p>
                          <p>Telefone: {bookingData?.vehicle?.owner?.phone || '_______________________'}</p>
                        </div>
                        <div>
                          <p><strong>LOCATÁRIO:</strong> {bookingData?.renter?.name || 'Nome do Locatário'}</p>
                          <p>CPF: _______________________</p>
                          <p>CNH: _______________________</p>
                          <p>Endereço: {bookingData?.renter?.location || '_______________________'}</p>
                          <p>Telefone: {bookingData?.renter?.phone || '_______________________'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Objeto do Contrato */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">2. DO OBJETO</h3>
                      <p className="mb-3">
                        O presente contrato tem por objeto a locação do veículo automotor abaixo discriminado, 
                        de propriedade do LOCADOR, pelo prazo e condições aqui estabelecidas:
                      </p>
                      <div className="bg-gray-50 p-4 rounded border">
                        <p><strong>Marca/Modelo:</strong> {bookingData?.vehicle?.brand} {bookingData?.vehicle?.model}</p>
                        <p><strong>Ano/Modelo:</strong> {bookingData?.vehicle?.year || '_______'}</p>
                        <p><strong>Cor:</strong> {bookingData?.vehicle?.color || '_______________________'}</p>
                        <p><strong>Placa:</strong> {bookingData?.vehicle?.licensePlate || '_______________________'}</p>
                        <p><strong>Chassi:</strong> _______________________</p>
                        <p><strong>RENAVAM:</strong> {bookingData?.vehicle?.renavam || '_______________________'}</p>
                        <p><strong>Combustível:</strong> {bookingData?.vehicle?.fuelType || '_______________________'}</p>
                      </div>
                    </div>

                    {/* Prazo e Valor */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">3. DO PRAZO E VALOR</h3>
                      <p><strong>3.1</strong> A locação terá início em <strong>{new Date(bookingData?.startDate).toLocaleDateString('pt-BR')}</strong> às <strong>_____</strong> horas, 
                      e término em <strong>{new Date(bookingData?.endDate).toLocaleDateString('pt-BR')}</strong> às <strong>_____</strong> horas.</p>
                      
                      <p className="mt-3"><strong>3.2</strong> O valor total da locação é de <strong>R$ {bookingData?.totalPrice}</strong>, 
                      sendo pago da seguinte forma:</p>
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>Valor da locação: R$ {(parseFloat(bookingData?.totalPrice || '0') - parseFloat(bookingData?.serviceFee || '0') - parseFloat(bookingData?.insuranceFee || '0')).toFixed(2)}</li>
                        <li>Taxa de serviço: R$ {bookingData?.serviceFee || '0,00'}</li>
                        <li>Seguro (opcional): R$ {bookingData?.insuranceFee || '0,00'}</li>
                      </ul>
                      
                      <p className="mt-3"><strong>3.3</strong> O pagamento será efetuado via plataforma digital antes da retirada do veículo.</p>
                    </div>

                    {/* Obrigações do Locatário */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">4. DAS OBRIGAÇÕES DO LOCATÁRIO</h3>
                      <p className="mb-2">O LOCATÁRIO obriga-se a:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Utilizar o veículo exclusivamente para os fins a que se destina;</li>
                        <li>Conservar o veículo em perfeito estado de funcionamento e limpeza;</li>
                        <li>Devolver o veículo no local, data e hora acordados;</li>
                        <li>Responsabilizar-se por todas as infrações de trânsito cometidas durante o período de locação;</li>
                        <li>Comunicar imediatamente ao LOCADOR qualquer acidente, roubo, furto ou problema mecânico;</li>
                        <li>Não permitir que terceiros conduzam o veículo sem autorização expressa do LOCADOR;</li>
                        <li>Manter o veículo sempre com documentação em dia;</li>
                        <li>Não transportar cargas ou passageiros em desacordo com as especificações do veículo;</li>
                        <li>Arcar com despesas de combustível durante o período de locação.</li>
                      </ul>
                    </div>

                    {/* Obrigações do Locador */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">5. DAS OBRIGAÇÕES DO LOCADOR</h3>
                      <p className="mb-2">O LOCADOR obriga-se a:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Entregar o veículo em perfeitas condições de uso e funcionamento;</li>
                        <li>Fornecer toda a documentação necessária do veículo;</li>
                        <li>Garantir que o veículo possui seguro obrigatório em dia;</li>
                        <li>Responsabilizar-se por defeitos mecânicos não causados pelo LOCATÁRIO;</li>
                        <li>Prestar assistência em caso de problemas mecânicos do veículo.</li>
                      </ul>
                    </div>

                    {/* Penalidades */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">6. DAS PENALIDADES</h3>
                      <p><strong>6.1</strong> O não cumprimento das obrigações aqui estabelecidas sujeitará a parte infratora ao pagamento de multa equivalente a 20% do valor do contrato.</p>
                      <p><strong>6.2</strong> A devolução do veículo em atraso sujeitará o LOCATÁRIO ao pagamento de diária adicional proporcional.</p>
                      <p><strong>6.3</strong> Danos ao veículo serão de inteira responsabilidade do LOCATÁRIO.</p>
                    </div>

                    {/* Foro */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">7. DO FORO</h3>
                      <p>As partes elegem o foro da comarca onde se encontra o veículo para dirimir quaisquer questões oriundas do presente contrato.</p>
                    </div>

                    {/* Assinatura Digital */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">8. DA ASSINATURA DIGITAL</h3>
                      <p>O presente contrato será assinado digitalmente através da plataforma DocuSign, 
                      garantindo autenticidade, integridade e validade jurídica conforme a legislação brasileira vigente.</p>
                    </div>

                    <div className="mt-8 pt-6 border-t text-center">
                      <p className="font-medium">E, por estarem assim justos e contratados, assinam o presente instrumento.</p>
                      <p className="mt-4 text-xs text-gray-500">
                        Contrato gerado eletronicamente via plataforma alugae.mobi
                      </p>
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