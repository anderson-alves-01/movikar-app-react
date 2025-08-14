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
import { getClientFeatureFlags } from '@shared/feature-flags';

export default function ContractPreview() {
  const [, contractParams] = useRoute('/contracts/:id');
  const [, bookingParams] = useRoute('/contract-preview/:bookingId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Support both /contracts/:id and /contract-preview/:bookingId routes
  const contractId = contractParams?.id;
  const bookingId = bookingParams?.bookingId;

  // Fetch admin settings to check feature flags
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings'],
  });

  // Get feature flags
  const featureFlags = getClientFeatureFlags(adminSettings);

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
                          <p>CPF/CNPJ: {bookingData?.vehicle?.owner?.cpf || bookingData?.vehicle?.owner?.cnpj || 'Documento não informado'}</p>
                          <p>Endereço: {bookingData?.vehicle?.owner?.location || bookingData?.vehicle?.location || 'Endereço não informado'}</p>
                          <p>Telefone: {bookingData?.vehicle?.owner?.phone || 'Telefone não informado'}</p>
                          <p>E-mail: {bookingData?.vehicle?.owner?.email || 'E-mail não informado'}</p>
                        </div>
                        <div>
                          <p><strong>LOCATÁRIO:</strong> {bookingData?.renter?.name || 'Nome do Locatário'}</p>
                          <p>CPF: {bookingData?.renter?.cpf || 'CPF não informado'}</p>
                          <p>CNH: {bookingData?.renter?.cnh || 'CNH não informada'}</p>
                          <p>Endereço: {bookingData?.renter?.location || 'Endereço não informado'}</p>
                          <p>Telefone: {bookingData?.renter?.phone || 'Telefone não informado'}</p>
                          <p>E-mail: {bookingData?.renter?.email || 'E-mail não informado'}</p>
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
                        <p><strong>Ano/Modelo:</strong> {bookingData?.vehicle?.year || 'Ano não informado'}</p>
                        <p><strong>Cor:</strong> {bookingData?.vehicle?.color || 'Cor não informada'}</p>
                        <p><strong>Placa:</strong> {bookingData?.vehicle?.licensePlate || 'Placa não informada'}</p>
                        <p><strong>Chassi:</strong> {bookingData?.vehicle?.chassi || 'Chassi não informado'}</p>
                        <p><strong>RENAVAM:</strong> {bookingData?.vehicle?.renavam || 'RENAVAM não informado'}</p>
                        <p><strong>Combustível:</strong> {bookingData?.vehicle?.fuelType || 'Tipo de combustível não informado'}</p>
                        <p><strong>Categoria:</strong> {bookingData?.vehicle?.category || 'Categoria não informada'}</p>
                        <p><strong>Transmissão:</strong> {bookingData?.vehicle?.transmission || 'Transmissão não informada'}</p>
                      </div>
                    </div>

                    {/* Prazo e Valor */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">3. DO PRAZO E VALOR</h3>
                      <p><strong>3.1</strong> A locação terá início no dia <strong>{new Date(bookingData?.startDate).toLocaleDateString('pt-BR')}</strong> às <strong>09:00</strong> horas, 
                      e término no dia <strong>{new Date(bookingData?.endDate).toLocaleDateString('pt-BR')}</strong> às <strong>18:00</strong> horas.</p>
                      
                      <p><strong>3.1.1</strong> Local de entrega e devolução: <strong>{bookingData?.vehicle?.location || 'Local a ser definido entre as partes'}</strong></p>
                      
                      <p className="mt-3"><strong>3.2</strong> O valor total da locação é de <strong>R$ {bookingData?.totalPrice}</strong> 
                      ({(() => {
                        const total = parseFloat(bookingData?.totalPrice || '0');
                        if (total < 100) return 'menos de cem reais';
                        if (total < 1000) return `${Math.floor(total / 100) > 0 ? `${Math.floor(total / 100) === 1 ? 'cento' : `${Math.floor(total / 100) * 100 === 200 ? 'duzentos' : `${Math.floor(total / 100)}centos`}`} e ` : ''}${Math.floor(total % 100) > 0 ? `${Math.floor(total % 100)} reais` : ''}`;
                        return `${Math.floor(total)} reais`;
                      })()}), sendo discriminado da seguinte forma:</p>
                      
                      <div className="bg-blue-50 p-3 rounded mt-2">
                        <ul className="space-y-1 text-sm">
                          <li>• Valor base da locação: <strong>R$ {(parseFloat(bookingData?.totalPrice || '0') - parseFloat(bookingData?.serviceFee || '0') - parseFloat(bookingData?.insuranceFee || '0')).toFixed(2)}</strong></li>
                          <li>• Taxa de serviço da plataforma: <strong>R$ {bookingData?.serviceFee || '0,00'}</strong></li>
                          {parseFloat(bookingData?.insuranceFee || '0') > 0 && (
                            <li>• Seguro opcional: <strong>R$ {bookingData?.insuranceFee || '0,00'}</strong></li>
                          )}
                          <li className="border-t pt-1 font-semibold">• Valor total: <strong>R$ {bookingData?.totalPrice}</strong></li>
                        </ul>
                      </div>
                      
                      <p className="mt-3"><strong>3.3</strong> O pagamento foi/será efetuado integralmente via plataforma digital Stripe, 
                      antes da entrega do veículo, conforme comprovante de pagamento anexo a este contrato.</p>
                      
                      <p><strong>3.4</strong> Em caso de atraso na devolução, será cobrada diária adicional proporcional ao valor da locação, 
                      calculada por hora ou fração, limitada ao valor de uma diária completa.</p>
                    </div>

                    {/* Estado do Veículo */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">4. DO ESTADO DO VEÍCULO</h3>
                      <p><strong>4.1</strong> O veículo será entregue ao LOCATÁRIO em perfeito estado de funcionamento, 
                      conservação e limpeza, com todos os equipamentos obrigatórios e opcionais em funcionamento.</p>
                      
                      <p><strong>4.2</strong> No ato da entrega, será realizada vistoria conjunta do veículo, 
                      registrando-se fotograficamente o estado atual para comparação na devolução.</p>
                      
                      <p><strong>4.3</strong> O veículo será entregue com o tanque de combustível cheio e deverá ser 
                      devolvido nas mesmas condições, sob pena de cobrança do valor correspondente ao abastecimento.</p>
                    </div>

                    {/* Obrigações do Locatário */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">5. DAS OBRIGAÇÕES DO LOCATÁRIO</h3>
                      <p className="mb-2">O LOCATÁRIO obriga-se a:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Utilizar o veículo exclusivamente para fins particulares e dentro do território nacional;</li>
                        <li>Conservar o veículo em perfeito estado de funcionamento, limpeza e conservação;</li>
                        <li>Devolver o veículo no local, data e hora acordados, nas mesmas condições de entrega;</li>
                        <li>Responsabilizar-se integralmente por todas as infrações de trânsito cometidas durante o período de locação;</li>
                        <li>Comunicar imediatamente ao LOCADOR, por escrito ou via plataforma, qualquer acidente, roubo, furto, avaria ou problema mecânico;</li>
                        <li>Não permitir que terceiros conduzam o veículo sem autorização prévia e expressa do LOCADOR;</li>
                        <li>Manter sempre em sua posse a documentação do veículo e sua CNH válida;</li>
                        <li>Não transportar cargas ou passageiros em desacordo com as especificações técnicas do veículo;</li>
                        <li>Arcar com todas as despesas de combustível durante o período de locação;</li>
                        <li>Não fumar no interior do veículo;</li>
                        <li>Não transportar animais sem autorização prévia;</li>
                        <li>Respeitar rigorosamente as normas de trânsito e estacionamento;</li>
                        <li>Não utilizar o veículo para fins comerciais, transporte remunerado ou participação em competições;</li>
                        <li>Zelar pela segurança do veículo, mantendo-o sempre trancado quando estacionado.</li>
                      </ul>
                    </div>

                    {/* Obrigações do Locador */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">6. DAS OBRIGAÇÕES DO LOCADOR</h3>
                      <p className="mb-2">O LOCADOR obriga-se a:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Entregar o veículo em perfeitas condições de uso, funcionamento, limpeza e conservação;</li>
                        <li>Fornecer toda a documentação obrigatória do veículo (CRLV, comprovante de seguro, etc.);</li>
                        <li>Garantir que o veículo possui seguro DPVAT e demais seguros obrigatórios em dia;</li>
                        <li>Responsabilizar-se por defeitos mecânicos preexistentes ou não causados pelo LOCATÁRIO;</li>
                        <li>Prestar assistência técnica em caso de problemas mecânicos do veículo;</li>
                        <li>Manter o veículo em dia com revisões e manutenções preventivas;</li>
                        <li>Fornecer equipamentos de segurança obrigatórios (estepe, macaco, triângulo, etc.);</li>
                        <li>Garantir que o veículo não possui débitos de IPVA, multas ou outros encargos;</li>
                        <li>Disponibilizar número de contato para emergências durante todo o período da locação.</li>
                      </ul>
                    </div>

                    {/* Seguros e Responsabilidades */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">7. DOS SEGUROS E RESPONSABILIDADES</h3>
                      <p><strong>7.1</strong> O veículo possui seguro obrigatório (DPVAT) em vigência, 
                      cobrindo danos pessoais causados por veículos automotores de via terrestre.</p>
                      
                      {parseFloat(bookingData?.insuranceFee || '0') > 0 ? (
                        <p><strong>7.2</strong> Foi contratado seguro adicional opcional no valor de R$ {bookingData?.insuranceFee}, 
                        cobrindo danos ao veículo conforme condições da seguradora.</p>
                      ) : (
                        <p><strong>7.2</strong> O LOCATÁRIO optou por não contratar seguro adicional, assumindo integral 
                        responsabilidade por eventuais danos ao veículo.</p>
                      )}
                      
                      <p><strong>7.3</strong> Em caso de sinistro, o LOCATÁRIO deverá comunicar imediatamente à autoridade competente 
                      e ao LOCADOR, fornecendo todos os documentos necessários.</p>
                    </div>

                    {/* Penalidades */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">8. DAS PENALIDADES E INFRAÇÕES</h3>
                      <p><strong>8.1</strong> O não cumprimento das obrigações estabelecidas neste contrato 
                      sujeitará a parte infratora ao pagamento de multa equivalente a 20% (vinte por cento) do valor total da locação.</p>
                      
                      <p><strong>8.2</strong> A devolução do veículo em atraso sujeitará o LOCATÁRIO ao pagamento de 
                      R$ {(parseFloat(bookingData?.totalPrice || '0') / 
                      Math.max(1, Math.ceil((new Date(bookingData?.endDate || new Date()).getTime() - new Date(bookingData?.startDate || new Date()).getTime()) / (1000 * 3600 * 24)))).toFixed(2)} 
                      por dia ou fração de atraso.</p>
                      
                      <p><strong>8.3</strong> Danos ao veículo serão de inteira responsabilidade do LOCATÁRIO, 
                      que deverá arcar com os custos de reparo conforme orçamentos apresentados pelo LOCADOR.</p>
                      
                      <p><strong>8.4</strong> Todas as infrações de trânsito cometidas durante o período de locação, 
                      bem como seus valores e pontuações na CNH, são de responsabilidade exclusiva do LOCATÁRIO.</p>
                      
                      <p><strong>8.5</strong> O descumprimento das normas de utilização (fumo, animais, uso comercial) 
                      sujeitará o LOCATÁRIO a multa de R$ 200,00 (duzentos reais) por infração.</p>
                    </div>

                    {/* Resolução de Conflitos */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">9. DA RESOLUÇÃO DE CONFLITOS</h3>
                      <p><strong>9.1</strong> As partes comprometem-se a buscar solução amigável para eventuais conflitos, 
                      utilizando preferencialmente a mediação através da plataforma alugae.mobi.</p>
                      
                      <p><strong>9.2</strong> Não sendo possível a solução amigável, as partes elegem o foro da comarca de 
                      <strong> {bookingData?.vehicle?.location?.split(',').slice(-2).join(',').trim() || 'Brasília, DF'} </strong> 
                      para dirimir quaisquer questões oriundas do presente contrato.</p>
                    </div>

                    {/* Disposições Gerais */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">10. DISPOSIÇÕES GERAIS</h3>
                      <p><strong>10.1</strong> Este contrato obedece às disposições do Código Civil Brasileiro e demais legislações aplicáveis.</p>
                      
                      <p><strong>10.2</strong> Qualquer alteração neste contrato deverá ser feita por escrito e aceita por ambas as partes.</p>
                      
                      <p><strong>10.3</strong> A invalidade de qualquer cláusula não prejudicará a validade das demais.</p>
                      
                      <p><strong>10.4</strong> Este contrato foi intermediado pela plataforma digital alugae.mobi, 
                      que atua como facilitadora da relação entre as partes.</p>
                    </div>

                    {/* Assinatura Digital */}
                    <div>
                      <h3 className="font-bold mb-3 text-base">11. DA ASSINATURA DIGITAL</h3>
                      <p><strong>11.1</strong> O presente contrato será assinado digitalmente através da plataforma DocuSign, 
                      garantindo autenticidade, integridade, validade jurídica e eficácia probatória conforme a 
                      Lei nº 11.419/2006 e Medida Provisória nº 2.200-2/2001.</p>
                      
                      <p><strong>11.2</strong> As assinaturas digitais têm a mesma validade legal das assinaturas manuscritas, 
                      sendo reconhecidas pelo ordenamento jurídico brasileiro.</p>
                      
                      <p><strong>11.3</strong> O certificado digital utilizado garante a identidade dos signatários 
                      e a integridade do documento assinado.</p>
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
                  // Contract not signed - show signing option or disabled message
                  featureFlags.contractSignatureEnabled ? (
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
                  ) : (
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Assinatura Indisponível</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        A funcionalidade de assinatura digital está temporariamente desabilitada. 
                        Entre em contato com o suporte para mais informações.
                      </p>
                    </div>
                  )
                )}

                <div className="flex gap-4">
                  {!isContractSigned ? (
                    featureFlags.contractSignatureEnabled ? (
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
                        Assinatura Indisponível
                      </Button>
                    )
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