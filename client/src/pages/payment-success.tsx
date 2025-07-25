import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Extract payment intent from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentIntent = urlParams.get('payment_intent');
    
    if (paymentIntent) {
      setPaymentIntentId(paymentIntent);
    } else {
      // No payment intent found, redirect to home
      setLocation('/');
    }
  }, [setLocation]);

  // Confirm rental after successful payment
  const confirmRentalMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const response = await apiRequest('GET', `/api/payment-success/${paymentIntentId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Aluguel confirmado!",
        description: data.message || "Seu aluguel foi confirmado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao confirmar aluguel",
        variant: "destructive",
      });
    },
  });

  // Auto-confirm rental when component loads
  useEffect(() => {
    if (paymentIntentId && !confirmRentalMutation.data && !confirmRentalMutation.isError) {
      confirmRentalMutation.mutate(paymentIntentId);
    }
  }, [paymentIntentId]);

  // Auto-redirect to reservations after 3 seconds if successful
  useEffect(() => {
    if (confirmRentalMutation.isSuccess) {
      const timer = setTimeout(() => {
        setLocation('/reservations');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [confirmRentalMutation.isSuccess, setLocation]);

  if (!paymentIntentId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Erro no Pagamento</h1>
            <p className="text-gray-600 mb-6">Não foi possível processar seu pagamento.</p>
            <Button onClick={() => setLocation('/')}>
              Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {confirmRentalMutation.isPending ? (
                  <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                ) : confirmRentalMutation.isSuccess ? (
                  <CheckCircle className="h-16 w-16 text-green-500" />
                ) : (
                  <AlertCircle className="h-16 w-16 text-red-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {confirmRentalMutation.isPending && "Processando..."}
                {confirmRentalMutation.isSuccess && "Pagamento Realizado!"}
                {confirmRentalMutation.isError && "Erro na Confirmação"}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              {confirmRentalMutation.isPending && (
                <p className="text-gray-600">
                  Estamos confirmando seu aluguel. Aguarde um momento...
                </p>
              )}
              
              {confirmRentalMutation.isSuccess && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Seu pagamento foi processado com sucesso e o aluguel foi confirmado!
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Contrato assinado automaticamente
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Redirecionando para suas reservas em 3 segundos...
                    </p>
                  </div>
                </div>
              )}
              
              {confirmRentalMutation.isError && (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    O pagamento foi processado, mas houve um erro na confirmação do aluguel.
                  </p>
                  <p className="text-sm text-gray-500">
                    Entre em contato conosco para resolver a situação.
                  </p>
                </div>
              )}
              
              <div className="pt-4 space-y-2">
                <Button
                  onClick={() => setLocation('/reservations')}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={confirmRentalMutation.isPending}
                >
                  Ver Minhas Reservas
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setLocation('/')}
                  className="w-full"
                  disabled={confirmRentalMutation.isPending}
                >
                  Voltar ao Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}