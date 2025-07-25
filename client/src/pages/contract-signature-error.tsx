import { useLocation } from 'wouter';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ContractSignatureError() {
  const [, setLocation] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('bookingId');
  const error = urlParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'user_cancelled':
        return {
          title: 'Assinatura Cancelada',
          message: 'Você cancelou o processo de assinatura no GOV.BR.',
          icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
          color: 'orange'
        };
      case 'invalid_certificate':
        return {
          title: 'Certificado Inválido',
          message: 'Houve um problema com seu certificado digital. Verifique se está válido.',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          color: 'red'
        };
      case 'timeout':
        return {
          title: 'Tempo Esgotado',
          message: 'O tempo para assinatura expirou. Tente novamente.',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          color: 'red'
        };
      case 'callback_failed':
        return {
          title: 'Erro Técnico',
          message: 'Houve um erro técnico no sistema. Nossa equipe foi notificada.',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          color: 'red'
        };
      default:
        return {
          title: 'Erro na Assinatura',
          message: 'Ocorreu um erro durante o processo de assinatura digital.',
          icon: <XCircle className="w-8 h-8 text-red-600" />,
          color: 'red'
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Error Message */}
          <Card className={`border-${errorInfo.color}-200 bg-${errorInfo.color}-50`}>
            <CardHeader className="text-center">
              <div className={`mx-auto w-16 h-16 bg-${errorInfo.color}-100 rounded-full flex items-center justify-center mb-4`}>
                {errorInfo.icon}
              </div>
              <CardTitle className={`text-2xl text-${errorInfo.color}-800`}>{errorInfo.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className={`text-${errorInfo.color}-700`}>
                {errorInfo.message}
              </p>
              
              {error && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Código do erro: <code className="bg-gray-100 px-2 py-1 rounded">{error}</code>
                  </p>
                  {bookingId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Reserva: #{bookingId}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solutions */}
          <Card>
            <CardHeader>
              <CardTitle>O que você pode fazer:</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RefreshCw className="w-3 h-3 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Tentar Novamente</h4>
                    <p className="text-sm text-gray-600">Volte para o preview do contrato e tente assinar novamente.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">?</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Verifique sua Conexão</h4>
                    <p className="text-sm text-gray-600">Certifique-se de que sua internet está estável.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-600">📞</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Entre em Contato</h4>
                    <p className="text-sm text-gray-600">Se o problema persistir, entre em contato com nosso suporte.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {bookingId && (
              <Button
                onClick={() => setLocation(`/contract-preview/${bookingId}`)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Tentar Assinar Novamente
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation('/reservations')}
                className="flex items-center gap-2"
              >
                Minhas Reservas
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

        </div>
      </div>
    </div>
  );
}