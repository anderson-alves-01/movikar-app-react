// Teste com debug da autenticação
const BASE_URL = 'http://localhost:5000';

async function testDebugAuth() {
  console.log('🔍 TESTE DEBUG AUTENTICAÇÃO\n');

  try {
    // 1. Login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login: ${user.name} (ID: ${user.id})`);
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);

    // 2. Testar assinatura com debug
    console.log('\n📝 Testando assinatura (com debug)...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/16`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await signResponse.json();
    console.log(`Status: ${signResponse.status}`);
    console.log('Resposta completa:', JSON.stringify(data, null, 2));

    if (signResponse.ok) {
      console.log('\n✅ SUCESSO! Sistema funcionando');
      console.log(`URL de redirecionamento: ${data.signatureUrl}`);
    } else {
      console.log('\n❌ Falha na assinatura');
      if (data.debug) {
        console.log('Debug info:', data.debug);
      }
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testDebugAuth();