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
import { FileText, CheckCircle, Clock, ExternalLink, Download } from 'lucide-react';

export default function ContractPreview() {
  const [, params] = useRoute('/contract-preview/:bookingId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const bookingId = params?.bookingId;

  // Fetch booking details with contract
  const { data: booking, isLoading } = useQuery({
    queryKey: ['/api/bookings', bookingId],
    enabled: !!bookingId,
  });

  // Fetch contract preview
  const { data: contractPreview, isLoading: isLoadingPreview } = useQuery({
    queryKey: ['/api/contracts/preview', bookingId],
    enabled: !!bookingId,
  });

  // Sign contract with GOV.BR
  const signContractMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/contracts/sign-govbr/${bookingId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Redirecionando para GOV.BR",
        description: "Você será redirecionado para assinar digitalmente no GOV.BR",
      });
      
      // Redirect to GOV.BR signature platform
      window.location.href = data.signatureUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao iniciar assinatura digital",
        variant: "destructive",
      });
    },
  });

  if (isLoading || isLoadingPreview) {
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

  if (!booking) {
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
                  <p className="font-semibold">{booking.vehicle?.brand} {booking.vehicle?.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div>
                    <Badge variant={booking.status === 'approved' ? 'default' : 'secondary'}>
                      {booking.status === 'approved' ? 'Aprovado' : booking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Período</label>
                  <p>{new Date(booking.startDate).toLocaleDateString('pt-BR')} - {new Date(booking.endDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Valor Total</label>
                  <p className="font-semibold text-green-600">R$ {booking.totalPrice}</p>
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
                      Número: CNT-{booking.id}-{Date.now().toString().slice(-6)}
                    </p>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-2">1. PARTES CONTRATANTES</h3>
                      <p><strong>LOCADOR:</strong> {booking.vehicle?.owner?.name || 'Proprietário do Veículo'}</p>
                      <p><strong>LOCATÁRIO:</strong> {booking.renter?.name || 'Locatário'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">2. OBJETO DO CONTRATO</h3>
                      <p>O LOCADOR concede ao LOCATÁRIO, em caráter temporário e oneroso, o uso do veículo:</p>
                      <p><strong>Marca/Modelo:</strong> {booking.vehicle?.brand} {booking.vehicle?.model} {booking.vehicle?.year}</p>
                      <p><strong>Placa:</strong> {booking.vehicle?.licensePlate || 'A definir'}</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">3. PERÍODO E VALORES</h3>
                      <p><strong>Período:</strong> {new Date(booking.startDate).toLocaleDateString('pt-BR')} às {new Date(booking.endDate).toLocaleDateString('pt-BR')}</p>
                      <p><strong>Valor da Locação:</strong> R$ {booking.totalPrice}</p>
                      <p><strong>Taxa de Serviço:</strong> R$ {booking.serviceFee}</p>
                      <p><strong>Seguro:</strong> R$ {booking.insuranceFee}</p>
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
                      <p>Este contrato será assinado digitalmente através da plataforma GOV.BR, garantindo autenticidade e validade jurídica.</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <p className="text-xs text-gray-500 text-center">
                      Este é um preview do contrato. A versão final será gerada após a assinatura digital.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Assinatura Digital GOV.BR</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Você será redirecionado para a plataforma oficial GOV.BR para realizar a assinatura digital do contrato.
                    A assinatura será válida juridicamente e vinculante.
                  </p>
                </div>

                <div className="flex gap-4">
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
                        Assinar no GOV.BR
                      </>
                    )}
                  </Button>
                  
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