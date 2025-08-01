import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function TestAuthFlow() {
  const [logs, setLogs] = useState<string[]>([]);
  const [credentials, setCredentials] = useState({
    email: 'test.auth@carshare.com',
    password: 'Senha123'
  });
  const { toast } = useToast();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testCompleteFlow = async () => {
    setLogs([]);
    addLog('🧪 Iniciando teste completo do fluxo de autenticação...');

    try {
      // 1. Login
      addLog('1️⃣ Fazendo login...');
      
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      addLog(`   Status do login: ${loginResponse.status}`);

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        addLog(`❌ Login falhou: ${error.message}`);
        return;
      }

      const loginData = await loginResponse.json();
      addLog(`✅ Login realizado: ${loginData.user.name} (${loginData.user.email})`);

      // 2. Verificar autenticação
      addLog('2️⃣ Verificando autenticação...');
      
      const authResponse = await fetch('/api/auth/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      addLog(`   Status da verificação: ${authResponse.status}`);

      if (!authResponse.ok) {
        const error = await authResponse.json();
        addLog(`❌ Verificação falhou: ${error.message}`);
        return;
      }

      const authData = await authResponse.json();
      addLog(`✅ Autenticação confirmada: ${authData.name} (${authData.email})`);

      // 3. Criar assinatura
      addLog('3️⃣ Criando assinatura...');

      const subscriptionResponse = await apiRequest('POST', '/api/create-subscription', {
        planName: 'essencial',
        paymentMethod: 'monthly',
        vehicleCount: 5
      });

      const subscriptionData = await subscriptionResponse.json();
      addLog(`✅ Assinatura criada com sucesso!`);
      addLog(`   - Plano: ${subscriptionData.planName}`);
      addLog(`   - Método: ${subscriptionData.paymentMethod}`);
      addLog(`   - Valor: R$ ${(subscriptionData.amount / 100).toFixed(2)}`);
      addLog(`   - Client Secret: ${subscriptionData.clientSecret ? 'Presente' : 'Ausente'}`);

      // 4. Gerar URL de checkout
      const checkoutUrl = `/subscription-checkout?clientSecret=${subscriptionData.clientSecret}&planName=${subscriptionData.planName}&paymentMethod=${subscriptionData.paymentMethod}&amount=${subscriptionData.amount}`;
      addLog(`4️⃣ URL de checkout: ${checkoutUrl}`);

      addLog('🎉 FLUXO COMPLETO FUNCIONANDO!');
      
      toast({
        title: "Teste Concluído",
        description: "Autenticação e assinatura funcionando perfeitamente!"
      });

      // Redirecionar para checkout após 2 segundos
      setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 2000);

    } catch (error: any) {
      addLog(`❌ Erro durante o teste: ${error.message}`);
      toast({
        title: "Erro no Teste",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testLogin = async () => {
    addLog('🔐 Testando apenas login...');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ Login OK: ${data.user.name}`);
        toast({
          title: "Login Realizado",
          description: `Bem-vindo, ${data.user.name}!`
        });
        
        // Recarregar a página para atualizar o estado de autenticação
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        addLog(`❌ Login falhou: ${error.message}`);
      }
    } catch (error: any) {
      addLog(`❌ Erro: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Teste de Autenticação e Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button onClick={testLogin} variant="outline">
                Fazer Login Apenas
              </Button>
              <Button onClick={testCompleteFlow}>
                Testar Fluxo Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log do Teste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">Clique em "Testar Fluxo Completo" para iniciar...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}