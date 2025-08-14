import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, TrendingUp, Clock, CheckSquare, AlertCircle } from "lucide-react";

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
}

interface PayoutStats {
  pending: number;
  inReview: number;
  completed: number;
  failed: number;
}

interface WebhookInfo {
  id: string;
  secret: string;
}

export default function StripeProduction() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [payoutStats, setPayoutStats] = useState<PayoutStats | null>(null);
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const { toast } = useToast();

  const loadPayoutStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await apiRequest("GET", "/api/admin/payout-stats");
      setPayoutStats(response);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar estatísticas de repasses",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  const setupStripeProduction = async () => {
    setIsConfiguring(true);
    try {
      const response = await apiRequest("POST", "/api/admin/stripe/setup-production");
      
      if (response.success) {
        setValidationResult({
          isValid: true,
          issues: [],
          recommendations: response.recommendations || []
        });
        setWebhookInfo(response.webhook);
        
        toast({
          title: "Sucesso!",
          description: response.message,
        });
      } else {
        setValidationResult({
          isValid: false,
          issues: response.issues || [],
          recommendations: response.recommendations || []
        });
        
        toast({
          title: "Configuração inválida",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erro na configuração:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao configurar Stripe",
        variant: "destructive",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  useEffect(() => {
    loadPayoutStats();
    // Recarregar stats a cada 30 segundos
    const interval = setInterval(loadPayoutStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPayouts = payoutStats ? 
    payoutStats.pending + payoutStats.inReview + payoutStats.completed + payoutStats.failed : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stripe Produção</h1>
        <p className="text-muted-foreground">
          Configure e monitore o Stripe para repasses PIX automáticos em produção
        </p>
      </div>

      {/* Status da Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Status da Configuração
          </CardTitle>
          <CardDescription>
            Validação e configuração do Stripe para produção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={setupStripeProduction}
              disabled={isConfiguring}
              size="lg"
              data-testid="button-setup-stripe"
            >
              {isConfiguring ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Configurando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Configurar Stripe para Produção
                </>
              )}
            </Button>
          </div>

          {validationResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Configuração Válida
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Configuração Inválida
                  </Badge>
                )}
              </div>

              {validationResult.issues.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Problemas encontrados:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.issues.map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {validationResult.recommendations.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Recomendações:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {webhookInfo && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Webhook Configurado</h4>
              <div className="space-y-1 text-sm">
                <div><strong>ID:</strong> {webhookInfo.id}</div>
                <div><strong>Secret:</strong> {webhookInfo.secret}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas de Repasses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas de Repasses
            </CardTitle>
            <CardDescription>
              Monitoramento dos repasses PIX (últimos 30 dias)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPayoutStats}
            disabled={isLoadingStats}
            data-testid="button-refresh-stats"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {payoutStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-pending-count">
                      {payoutStats.pending}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Em Revisão</p>
                    <p className="text-2xl font-bold text-yellow-600" data-testid="text-review-count">
                      {payoutStats.inReview}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-completed-count">
                      {payoutStats.completed}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Falharam</p>
                    <p className="text-2xl font-bold text-red-600" data-testid="text-failed-count">
                      {payoutStats.failed}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {payoutStats && totalPayouts > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total de Repasses:</span>
                <span className="text-lg font-bold" data-testid="text-total-payouts">
                  {totalPayouts}
                </span>
              </div>
              {payoutStats.completed > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted-foreground">Taxa de Sucesso:</span>
                  <span className="text-sm font-medium text-green-600">
                    {Math.round((payoutStats.completed / totalPayouts) * 100)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Instruções para Produção</CardTitle>
          <CardDescription>
            Passos para configurar Stripe em ambiente de produção
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Configurar Chaves de Produção</h4>
                <p className="text-sm text-muted-foreground">
                  Substitua as chaves de teste pelas chaves de produção do Stripe (sk_live_... e pk_live_...)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Validar Conta Stripe</h4>
                <p className="text-sm text-muted-foreground">
                  Certifique-se de que a conta Stripe está ativada para processar pagamentos e repasses
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Configurar Webhooks</h4>
                <p className="text-sm text-muted-foreground">
                  Execute a configuração automática para criar endpoints de webhook necessários
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Testar Repasses</h4>
                <p className="text-sm text-muted-foreground">
                  Monitore os repasses PIX e verifique se estão funcionando corretamente
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}