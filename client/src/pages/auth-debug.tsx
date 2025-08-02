import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function AuthDebug() {
  const [email, setEmail] = useState('admin@alugae.mobi');
  const [password, setPassword] = useState('admin123');  
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const testDirectAuth = async () => {
    setIsLoading(true);
    addLog('🔄 Starting direct authentication test...');
    
    try {
      // 1. Direct login call
      addLog('1️⃣ Making login request...');
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!loginResponse.ok) {
        const error = await loginResponse.json();
        addLog(`❌ Login failed: ${error.message}`);
        return;
      }

      const loginData = await loginResponse.json();
      addLog(`✅ Login successful! Token: ${loginData.token ? 'Present' : 'Missing'}`);
      
      // 2. Store token immediately
      if (loginData.token) {
        sessionStorage.setItem('auth_token', loginData.token);
        addLog('💾 Token stored in sessionStorage');
        
        // Auth state will be updated by the system
        addLog('🔐 Token stored, auth should update automatically');
      }

      // 3. Test API call with token
      addLog('3️⃣ Testing API with Authorization header...');
      const token = sessionStorage.getItem('auth_token');
      
      const apiResponse = await fetch('/api/users/my/vehicles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (apiResponse.ok) {
        const vehiclesData = await apiResponse.json();
        addLog(`✅ API call successful! Vehicles: ${vehiclesData.length}`);
      } else {
        addLog(`❌ API call failed: ${apiResponse.status}`);
      }

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testStoredAuth = () => {
    const token = sessionStorage.getItem('auth_token');
    addLog(`Token in storage: ${token ? 'Present' : 'Missing'}`);
    addLog(`Current user: ${user ? user.email : 'None'}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔧 Sistema de Teste de Autenticação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <Input 
                  type="password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={testDirectAuth} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Testando...' : '🚀 Teste Completo de Login'}
              </Button>
              <Button onClick={testStoredAuth} variant="outline">
                📊 Verificar Estado Atual
              </Button>
              <Button onClick={clearLogs} variant="outline">
                🗑️ Limpar Logs
              </Button>
            </div>

            {user && (
              <div className="p-3 bg-green-100 rounded-lg">
                <p className="text-green-800">✅ Usuário autenticado: {user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📋 Logs de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">Nenhum log ainda...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}