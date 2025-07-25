// Validação final do sistema de payment intent
const BASE_URL = 'http://localhost:5000';

async function finalValidation() {
  console.log('🎯 VALIDAÇÃO FINAL DO SISTEMA DE PAYMENT INTENT\n');

  try {
    // 1. Login com usuário teste
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login falhou: ${error.message}`);
    }

    const { token } = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');

    // 2. Testar payment intent diretamente
    console.log('\n🎯 Testando Payment Intent...');
    const paymentData = {
      vehicleId: 10,
      startDate: '2025-07-26',
      endDate: '2025-07-28',
      totalPrice: '170.00'
    };

    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    console.log(`Status: ${paymentResponse.status}`);

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(`Payment Intent falhou: ${error.message}`);
    }

    const result = await paymentResponse.json();
    
    console.log('🎉 PAYMENT INTENT CRIADO COM SUCESSO!');
    console.log(`Client Secret: ${result.clientSecret?.substring(0, 30)}...`);
    console.log(`Payment Intent ID: ${result.paymentIntentId}`);

    return { success: true, result };

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

finalValidation().then(result => {
  if (result.success) {
    console.log('\n✅ SISTEMA FUNCIONANDO PERFEITAMENTE!');
    process.exit(0);
  } else {
    console.log('\n❌ Sistema precisa de correções');
    process.exit(1);
  }
});