import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, FileText, Loader2, AlertCircle } from 'lucide-react';

export default function ContractSigned() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const urlParams = new URLSearchParams(window.location.search);
  const event = urlParams.get('event');
  const envelopeId = urlParams.get('envelopeId');

  useEffect(() => {
    // Handle DocuSign callback
    const handleDocuSignCallback = async () => {
      try {
        console.log('DocuSign callback received:', { event, envelopeId });
        
        if (event === 'signing_complete') {
          setStatus('success');
          setMessage('Contrato assinado com sucesso!');
          
          // Auto-redirect to reservations after 3 seconds
          setTimeout(() => {
            setLocation('/reservations');
          }, 3000);
        } else if (event === 'cancel') {
          setStatus('error');
          setMessage('Assinatura cancelada pelo usuário.');
        } else if (event === 'decline') {
          setStatus('error');
          setMessage('Assinatura recusada.');
        } else if (event === 'exception') {
          setStatus('error');
          setMessage('Ocorreu um erro durante o processo de assinatura.');
        } else {
          // Default success for any callback
          setStatus('success');
          setMessage('Redirecionando...');
          setTimeout(() => {
            setLocation('/reservations');
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling DocuSign callback:', error);
        setStatus('error');
        setMessage('Erro ao processar resposta do DocuSign.');
      }
    };

    handleDocuSignCallback();
  }, [event, envelopeId, setLocation]);

  const handleGoToReservations = () => {
    setLocation('/reservations');
  };

  const handleTryAgain = () => {
    setLocation('/contracts');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Processando assinatura...</h2>
                <p className="text-gray-600 text-center">
                  Aguarde enquanto processamos sua assinatura digital.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-red-800">Problema na Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-red-700">{message}</p>
                
                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleTryAgain}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Tentar Novamente
                  </Button>
                  
                  <Button
                    onClick={handleGoToReservations}
                    variant="outline"
                    className="w-full"
                  >
                    Ver Minhas Reservas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Success Message */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-800">Contrato Assinado com Sucesso!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-green-700">
                Seu contrato foi assinado digitalmente através da plataforma DocuSign e possui validade jurídica internacional.
              </p>
              
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Contrato Válido</span>
                </div>
                <p className="text-sm text-green-600">
                  {envelopeId && `Envelope: ${envelopeId.slice(0, 8)}... | `}
                  Assinado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Contrato Ativo</h4>
                    <p className="text-sm text-gray-600">Seu contrato de aluguel está oficialmente ativo e válido.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Contate o Proprietário</h4>
                    <p className="text-sm text-gray-600">Entre em contato para combinar a retirada do veículo.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Acompanhe sua Reserva</h4>
                    <p className="text-sm text-gray-600">Monitore o status na seção "Minhas Reservas".</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGoToReservations}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Ver Minhas Reservas
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/messages')}
                className="flex items-center gap-2"
              >
                Mensagens
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="flex items-center gap-2"
              >
                Página Inicial
              </Button>
            </div>
          </div>

          {/* Auto redirect notice */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Redirecionamento automático para suas reservas em alguns segundos...
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}