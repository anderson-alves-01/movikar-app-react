import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function TestSubscription() {
  const { isAuthenticated, isLoading: authLoading, user, login } = useAuth();
  const [email, setEmail] = useState('testuser@carshare.com');
  const [password, setPassword] = useState('test123');
  const [loginLoading, setLoginLoading] = useState(false);
  const { toast } = useToast();

  // Test login function
  const handleTestLogin = async () => {
    console.log('🧪 Testing login with:', { email, password });
    setLoginLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Login realizado",
        description: "Usuário logado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  // Test subscription mutation
  const testSubscriptionMutation = useMutation({
    mutationFn: async () => {
      console.log('🧪 Testing subscription creation...');
      const response = await apiRequest("POST", "/api/create-subscription", {
        planName: 'essencial',
        paymentMethod: 'monthly',
        vehicleCount: 5,
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Subscription test SUCCESS:', data);
      toast({
        title: "Teste de assinatura OK",
        description: `ClientSecret: ${data.clientSecret ? 'Presente' : 'Ausente'}`,
      });
    },
    onError: (error: Error) => {
      console.log('❌ Subscription test FAILED:', error.message);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Teste do Sistema de Assinatura</CardTitle>
          <CardDescription>
            Página para testar o fluxo completo de autenticação e assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auth Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Status de Autenticação</h3>
            <div className="space-y-1 text-sm">
              <p>Loading: {authLoading ? 'Sim' : 'Não'}</p>
              <p>Authenticated: {isAuthenticated ? 'Sim' : 'Não'}</p>
              <p>User: {user ? user.email : 'Nenhum'}</p>
              <p>User ID: {user ? user.id : 'N/A'}</p>
            </div>
          </div>

          {/* Login Test */}
          {!isAuthenticated && (
            <div className="space-y-4">
              <h3 className="font-medium">1. Teste de Login</h3>
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full p-2 border rounded"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full p-2 border rounded"
                />
                <Button 
                  onClick={handleTestLogin} 
                  disabled={loginLoading}
                  className="w-full"
                >
                  {loginLoading ? 'Fazendo login...' : 'Testar Login'}
                </Button>
              </div>
            </div>
          )}

          {/* Subscription Test */}
          {isAuthenticated && (
            <div className="space-y-4">
              <h3 className="font-medium">2. Teste de Assinatura</h3>
              <p className="text-sm text-gray-600">
                Usuário logado: {user?.email}
              </p>
              <Button 
                onClick={() => testSubscriptionMutation.mutate()}
                disabled={testSubscriptionMutation.isPending}
                className="w-full"
              >
                {testSubscriptionMutation.isPending ? 'Testando...' : 'Testar Criação de Assinatura'}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instruções</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Abra o console do navegador (F12)</li>
              <li>2. Faça login com as credenciais pré-preenchidas</li>
              <li>3. Teste a criação de assinatura</li>
              <li>4. Verifique os logs no console</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}