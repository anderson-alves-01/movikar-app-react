import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugAuth() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => setLogs([]);

  const testFullFlow = async () => {
    setIsLoading(true);
    clearLogs();
    
    try {
      addLog('🔍 Iniciando teste completo...');
      
      // 1. Login
      addLog('1️⃣ Fazendo login...');
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: 'testuser@carshare.com',
          password: 'test123'
        })
      });

      addLog(`Login response: ${loginResponse.status} ${loginResponse.statusText}`);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        addLog(`✅ Login SUCCESS: ${loginData.user.email}`);
        
        // Log cookies and headers
        const cookieHeader = loginResponse.headers.get('set-cookie');
        const credentialsHeader = loginResponse.headers.get('access-control-allow-credentials');
        
        if (cookieHeader) {
          addLog(`🍪 Cookies recebidos: ${cookieHeader}`);
        } else {
          addLog('❌ Nenhum cookie recebido no header!');
        }
        
        addLog(`🔐 Credentials header: ${credentialsHeader}`);
        
        // Check if browser can see cookies
        setTimeout(() => {
          const browserCookies = document.cookie;
          addLog(`🍪 Browser cookies: ${browserCookies || 'Nenhum'}`);
        }, 100);
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. Verificar autenticação
        addLog('2️⃣ Verificando autenticação...');
        const authResponse = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });

        addLog(`Auth check response: ${authResponse.status} ${authResponse.statusText}`);
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          addLog(`✅ Auth SUCCESS: ${authData.email}`);
          
          // 3. Tentar criar assinatura
          addLog('3️⃣ Testando assinatura...');
          const subscriptionResponse = await fetch('/api/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              planName: 'essencial',
              paymentMethod: 'monthly',
              vehicleCount: 5
            })
          });

          addLog(`Subscription response: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`);
          
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json();
            addLog(`🎉 SUBSCRIPTION SUCCESS! clientSecret: ${subscriptionData.clientSecret ? 'Present' : 'Missing'}`);
          } else {
            const errorText = await subscriptionResponse.text();
            addLog(`❌ Subscription failed: ${errorText}`);
          }
          
        } else {
          const errorText = await authResponse.text();
          addLog(`❌ Auth check failed: ${errorText}`);
        }
        
      } else {
        const errorData = await loginResponse.json();
        addLog(`❌ Login failed: ${errorData.message}`);
      }
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCookies = async () => {
    setIsLoading(true);
    clearLogs();
    
    try {
      addLog('🍪 Testando cookies específicos...');
      
      // Check current cookies
      addLog(`Current document.cookie: ${document.cookie}`);
      
      // Try to read specific cookies
      const allCookies = document.cookie.split('; ');
      const tokenCookie = allCookies.find(c => c.startsWith('token='));
      const refreshCookie = allCookies.find(c => c.startsWith('refreshToken='));
      
      addLog(`Token cookie: ${tokenCookie || 'Not found'}`);
      addLog(`Refresh cookie: ${refreshCookie || 'Not found'}`);
      
    } catch (error: any) {
      addLog(`❌ Cookie test error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Debug de Autenticação</CardTitle>
          <CardDescription>
            Ferramenta de diagnóstico detalhado para problemas de autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            <Button 
              onClick={testFullFlow} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Testando...' : 'Teste Completo'}
            </Button>
            <Button 
              onClick={testCookies} 
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Verificar Cookies
            </Button>
            <Button 
              onClick={clearLogs} 
              variant="outline"
            >
              Limpar Logs
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg min-h-96 max-h-96 overflow-y-auto">
            <h3 className="font-medium mb-2">Logs de Debug:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum log ainda. Clique em "Teste Completo" para começar.</p>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className="text-gray-800">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Como usar:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Clique em "Teste Completo" para testar o fluxo inteiro</li>
              <li>2. Observe os logs para identificar onde falha</li>
              <li>3. Use "Verificar Cookies" para ver cookies do navegador</li>
              <li>4. Abra também o console do navegador (F12)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}