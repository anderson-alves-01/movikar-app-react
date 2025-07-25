// Teste definitivo do redirecionamento GOV.BR
const BASE_URL = 'http://localhost:5000';

async function testRedirect() {
  console.log('🎯 TESTE REDIRECIONAMENTO GOV.BR\n');

  try {
    // Login com usuário correto
    console.log('1. Login...');
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

    // Teste direto com booking 16 (que sabemos que existe)
    console.log('\n2. Testando assinatura booking 16...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/16`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${signResponse.status}`);
    const data = await signResponse.json();
    console.log('Resposta:', JSON.stringify(data, null, 2));

    if (signResponse.ok && data.signatureUrl) {
      console.log('\n3. Testando simulador...');
      const simulatorResponse = await fetch(data.signatureUrl);
      
      if (simulatorResponse.ok) {
        console.log('✅ SUCESSO! Redirecionamento funcionando');
        console.log(`URL: ${data.signatureUrl}`);
        console.log('🎉 Sistema pronto para uso na interface');
      } else {
        console.log('❌ Simulador não respondeu');
      }
    } else {
      console.log(`❌ Falha: ${data.message}`);
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testRedirect();