import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail, Phone, User, Calendar, Star, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface QualifiedLead {
  id: number;
  vehicleId: number;
  ownerId: number;
  renterId: number;
  startDate: string;
  endDate: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  leadScore: number;
  status: 'pending' | 'purchased' | 'expired';
  purchasedPrice: string;
  purchasedAt?: string;
  expiresAt: string;
  createdAt: string;
}

const PaymentForm = ({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/owner-leads`,
      },
      redirect: 'if_required'
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Erro no pagamento",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Pagamento confirmado!",
        description: "Lead qualificado desbloqueado com sucesso.",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Processando..." : "Confirmar Pagamento"}
      </Button>
    </form>
  );
};

export default function OwnerLeads() {
  const { toast } = useToast();
  const [purchasingLead, setPurchasingLead] = useState<number | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery<QualifiedLead[]>({
    queryKey: ['/api/leads/qualified'],
  });

  const purchaseLeadMutation = useMutation({
    mutationFn: async (leadId: number) => {
      const response = await fetch(`/api/leads/${leadId}/purchase`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setPaymentClientSecret(data.clientSecret);
      toast({
        title: "Payment intent criado",
        description: "Complete o pagamento para desbloquear o lead.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao comprar lead",
        description: error.message,
        variant: "destructive",
      });
      setPurchasingLead(null);
    },
  });

  const handlePurchaseLead = (leadId: number) => {
    setPurchasingLead(leadId);
    purchaseLeadMutation.mutate(leadId);
  };

  const handlePaymentSuccess = () => {
    setPaymentClientSecret(null);
    setPurchasingLead(null);
    queryClient.invalidateQueries({ queryKey: ['/api/leads/qualified'] });
  };

  const getScoreColor = (score: number) => {
    if (score >= 40) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (score >= 25) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getScoreText = (score: number) => {
    if (score >= 40) return "Alto";
    if (score >= 25) return "Médio";
    return "Baixo";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
              Leads Qualificados
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Gerencie leads de locatários interessados nos seus veículos
            </p>
          </div>

          {!leads || leads.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Nenhum lead disponível
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Quando locatários demonstrarem interesse nos seus veículos, os leads aparecerão aqui.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {leads.map((lead) => {
                const isExpired = new Date() > new Date(lead.expiresAt);
                const canPurchase = lead.status === 'pending' && !isExpired;

                return (
                  <Card key={lead.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {lead.status === 'purchased' ? lead.contactInfo.name : `Lead #${lead.id}`}
                          </CardTitle>
                          <CardDescription>
                            Veículo ID: {lead.vehicleId} • 
                            Criado em {format(new Date(lead.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={getScoreColor(lead.leadScore)}
                            data-testid={`badge-score-${lead.id}`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Score: {lead.leadScore} ({getScoreText(lead.leadScore)})
                          </Badge>
                          <Badge 
                            variant={lead.status === 'purchased' ? 'default' : lead.status === 'expired' ? 'destructive' : 'secondary'}
                            data-testid={`badge-status-${lead.id}`}
                          >
                            {lead.status === 'purchased' ? 'Comprado' : 
                             lead.status === 'expired' ? 'Expirado' : 'Disponível'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Período:</span>
                            <span data-testid={`text-dates-${lead.id}`}>
                              {format(new Date(lead.startDate), 'dd/MM')} - {format(new Date(lead.endDate), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Expira em:</span>
                            <span className={isExpired ? 'text-red-600' : 'text-gray-600'} data-testid={`text-expires-${lead.id}`}>
                              {format(new Date(lead.expiresAt), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>

                          {lead.purchasedAt && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="font-medium">Comprado em:</span>
                              <span data-testid={`text-purchased-${lead.id}`}>
                                {format(new Date(lead.purchasedAt), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          )}
                        </div>

                        {lead.status === 'purchased' && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Informações de Contato:
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2" data-testid={`contact-email-${lead.id}`}>
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{lead.contactInfo.email}</span>
                              </div>
                              {lead.contactInfo.phone && (
                                <div className="flex items-center gap-2" data-testid={`contact-phone-${lead.id}`}>
                                  <Phone className="h-4 w-4 text-gray-500" />
                                  <span>{lead.contactInfo.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {canPurchase && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Preço: R$ {Number(lead.purchasedPrice).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Desbloqueie as informações de contato deste locatário interessado
                              </p>
                            </div>
                            <Button
                              onClick={() => handlePurchaseLead(lead.id)}
                              disabled={purchaseLeadMutation.isPending && purchasingLead === lead.id}
                              data-testid={`button-purchase-${lead.id}`}
                            >
                              {purchaseLeadMutation.isPending && purchasingLead === lead.id
                                ? "Processando..."
                                : `Comprar Lead - R$ ${Number(lead.purchasedPrice).toFixed(2)}`}
                            </Button>
                          </div>
                        </div>
                      )}

                      {isExpired && lead.status === 'pending' && (
                        <div className="border-t pt-4">
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">Lead expirado</span>
                            </div>
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                              Este lead não está mais disponível para compra
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Payment Modal */}
          {paymentClientSecret && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Finalizar Compra do Lead
                </h3>
                <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
                  <PaymentForm 
                    clientSecret={paymentClientSecret} 
                    onSuccess={handlePaymentSuccess} 
                  />
                </Elements>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPaymentClientSecret(null);
                    setPurchasingLead(null);
                  }}
                  className="w-full mt-2"
                  data-testid="button-cancel-payment"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}