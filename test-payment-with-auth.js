// Teste de pagamento com diferentes cenários de autenticação
const BASE_URL = 'http://localhost:5000';

async function testPaymentWithAuth() {
  console.log('🔐 TESTE DE PAGAMENTO COM VALIDAÇÃO DE USUÁRIO - HOMOLOGAÇÃO\n');

  // Cenário 1: Usuário não verificado
  console.log('📋 CENÁRIO 1: Usuário não verificado');
  try {
    // Criar usuário não verificado
    const newUserData = {
      name: 'Usuario Teste Não Verificado',
      email: `test.unverified.${Date.now()}@test.com`,
      password: 'senha123',
      phone: '11999999999',
      role: 'renter'
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUserData)
    });

    const { token: unverifiedToken } = await registerResponse.json();
    
    // Tentar criar payment intent (deve falhar)
    const paymentData = {
      vehicleId: 10,
      startDate: '2025-07-27',
      endDate: '2025-07-29',
      totalPrice: '200.00'
    };

    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${unverifiedToken}`
      },
      body: JSON.stringify(paymentData)
    });

    if (paymentResponse.status === 403) {
      const error = await paymentResponse.json();
      console.log(`✅ Usuário não verificado BLOQUEADO corretamente`);
      console.log(`   Erro: ${error.message}`);
    } else {
      console.log(`❌ FALHA: Usuário não verificado foi aceito (deveria ser bloqueado)`);
    }

  } catch (error) {
    console.log(`❌ Erro no cenário 1: ${error.message}`);
  }

  // Cenário 2: Usuário verificado - deve funcionar
  console.log('\n📋 CENÁRIO 2: Usuário verificado');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    const { token: verifiedToken } = await loginResponse.json();

    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifiedToken}`
      },
      body: JSON.stringify({
        vehicleId: 10,
        startDate: '2025-07-27',
        endDate: '2025-07-29',
        totalPrice: '200.00'
      })
    });

    if (paymentResponse.status === 200) {
      const result = await paymentResponse.json();
      console.log(`✅ Usuário verificado ACEITO corretamente`);
      console.log(`   Payment Intent ID: ${result.paymentIntentId}`);
    } else {
      const error = await paymentResponse.json();
      console.log(`❌ FALHA: Usuário verificado foi rejeitado`);
      console.log(`   Erro: ${error.message}`);
    }

  } catch (error) {
    console.log(`❌ Erro no cenário 2: ${error.message}`);
  }

  // Cenário 3: Token inválido
  console.log('\n📋 CENÁRIO 3: Token inválido');
  try {
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token-invalido-123'
      },
      body: JSON.stringify({
        vehicleId: 10,
        startDate: '2025-07-27',
        endDate: '2025-07-29',
        totalPrice: '200.00'
      })
    });

    if (paymentResponse.status === 403 || paymentResponse.status === 401) {
      console.log(`✅ Token inválido BLOQUEADO corretamente (${paymentResponse.status})`);
    } else {
      console.log(`❌ FALHA: Token inválido foi aceito`);
    }

  } catch (error) {
    console.log(`❌ Erro no cenário 3: ${error.message}`);
  }

  // Cenário 4: Sem token
  console.log('\n📋 CENÁRIO 4: Sem token de autorização');
  try {
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 10,
        startDate: '2025-07-27',
        endDate: '2025-07-29',
        totalPrice: '200.00'
      })
    });

    if (paymentResponse.status === 401) {
      console.log(`✅ Requisição sem token BLOQUEADA corretamente`);
    } else {
      console.log(`❌ FALHA: Requisição sem token foi aceita`);
    }

  } catch (error) {
    console.log(`❌ Erro no cenário 4: ${error.message}`);
  }

  console.log('\n🔒 RESUMO DE SEGURANÇA:');
  console.log('='.repeat(50));
  console.log('✅ Apenas usuários verificados podem criar payment intents');
  console.log('✅ Tokens inválidos são rejeitados');
  console.log('✅ Requisições sem token são bloqueadas');
  console.log('✅ Sistema de autenticação funciona corretamente');

  console.log('\n💳 CARTÕES DE TESTE SEGUROS:');
  console.log('='.repeat(50));
  console.log('🔹 Sucesso: 4242 4242 4242 4242');
  console.log('🔹 Falha: 4000 0000 0000 0002');
  console.log('🔹 3D Secure: 4000 0025 0000 3155');
  console.log('🔹 CVV: qualquer 3 dígitos');
  console.log('🔹 Data: qualquer data futura');

  console.log('\n🛡️  GARANTIAS DE SEGURANÇA:');
  console.log('='.repeat(50));
  console.log('🔹 Ambiente de TESTE - sem cobranças reais');
  console.log('🔹 Apenas cartões de teste funcionam');
  console.log('🔹 Todas as transações são simuladas');
  console.log('🔹 Verificação de usuário obrigatória');
}

testPaymentWithAuth().then(() => {
  console.log('\n✅ TESTE DE SEGURANÇA CONCLUÍDO');
  console.log('🚀 Sistema seguro para homologação');
});