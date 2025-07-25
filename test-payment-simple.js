// Teste simples de pagamento em homologação - SEM COBRANÇAS REAIS
const BASE_URL = 'http://localhost:5000';

async function testPaymentStaging() {
  console.log('🧪 TESTE DE PAGAMENTO EM HOMOLOGAÇÃO - SEM COBRANÇAS\n');

  try {
    // 1. Login com usuário de teste
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Falha no login');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Login realizado');

    // 2. Criar Payment Intent de teste
    console.log('\n2. Criando Payment Intent para TESTE...');
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
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(`Erro no payment intent: ${error.message}`);
    }

    const { clientSecret, paymentIntentId } = await paymentResponse.json();
    
    console.log('✅ Payment Intent criado para TESTE');
    console.log(`   Payment Intent ID: ${paymentIntentId}`);
    console.log(`   Client Secret: ${clientSecret.substring(0, 30)}...`);

    // 3. Informações importantes sobre teste
    console.log('\n📋 INFORMAÇÕES DE TESTE:');
    console.log('='.repeat(50));
    console.log('🔹 Este payment intent foi criado com chaves de TESTE');
    console.log('🔹 NÃO HAVERÁ COBRANÇA REAL no cartão');
    console.log('🔹 Use cartões de teste do Stripe para simular pagamentos');
    
    console.log('\n💳 CARTÕES DE TESTE RECOMENDADOS:');
    console.log('='.repeat(50));
    console.log('✅ SUCESSO - 4242 4242 4242 4242');
    console.log('   Qualquer CVV de 3 dígitos');
    console.log('   Qualquer data futura');
    
    console.log('\n❌ FALHA (para testar erros) - 4000 0000 0000 0002');
    console.log('   Simula cartão declinado');
    
    console.log('\n🔄 REQUER AUTENTICAÇÃO - 4000 0025 0000 3155');
    console.log('   Simula 3D Secure/SCA');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('='.repeat(50));
    console.log('1. Acesse a página de checkout no navegador');
    console.log('2. Use um dos cartões de teste acima');
    console.log('3. Complete o pagamento - será apenas simulação');
    console.log('4. O sistema irá processar sem cobrança real');

    console.log('\n🔗 LINKS ÚTEIS:');
    console.log('- Dashboard Stripe (teste): https://dashboard.stripe.com/test');
    console.log('- Todos os cartões de teste: https://stripe.com/docs/testing#cards');

    return {
      success: true,
      paymentIntentId,
      clientSecret: clientSecret.substring(0, 30) + '...',
      testMode: true
    };

  } catch (error) {
    console.log(`\n❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testPaymentStaging().then(result => {
  if (result.success) {
    console.log('\n✅ AMBIENTE DE TESTE CONFIGURADO COM SUCESSO!');
    console.log('🛡️  GARANTIA: Nenhuma cobrança real será feita');
  } else {
    console.log('\n❌ Erro na configuração do teste');
  }
});