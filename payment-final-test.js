// Teste final do sistema de payment intent
const BASE_URL = 'http://localhost:5000';

async function finalPaymentTest() {
  console.log('🎯 TESTE FINAL DO SISTEMA DE PAYMENT INTENT\n');

  try {
    // 1. Usar usuário já verificado do banco
    console.log('1. Fazendo login com usuário verificado...');
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

    const loginData = await loginResponse.json();
    const userToken = loginData.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Verificar status do usuário
    console.log('\n2. Verificando status de verificação...');
    const userResponse = await fetch(`${BASE_URL}/api/auth/user`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });

    const userData = await userResponse.json();
    console.log(`✅ Usuário: ${userData.name}`);
    console.log(`   Status: ${userData.verificationStatus}`);
    console.log(`   Pode alugar: ${userData.canRentVehicles}`);

    // 3. Buscar veículo disponível
    console.log('\n3. Buscando veículo disponível...');
    const vehiclesResponse = await fetch(`${BASE_URL}/api/vehicles`);
    const vehicles = await vehiclesResponse.json();
    
    if (vehicles.length === 0) {
      throw new Error('Nenhum veículo disponível');
    }

    const testVehicle = vehicles[0];
    console.log(`✅ Veículo selecionado: ${testVehicle.brand} ${testVehicle.model}`);
    console.log(`   ID: ${testVehicle.id}, Preço: R$ ${testVehicle.pricePerDay}/dia`);

    // 4. TESTE PRINCIPAL - Criar Payment Intent
    console.log('\n4. 🎯 CRIANDO PAYMENT INTENT...');
    const paymentData = {
      vehicleId: testVehicle.id,
      startDate: '2025-07-26',
      endDate: '2025-07-28',
      totalPrice: '170.00'
    };

    console.log(`   Dados:`, paymentData);

    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(paymentData)
    });

    console.log(`   Status da resposta: ${paymentResponse.status}`);

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json();
      throw new Error(`Payment Intent falhou: ${errorData.message}`);
    }

    const paymentResult = await paymentResponse.json();
    
    console.log('🎉 PAYMENT INTENT CRIADO COM SUCESSO!');
    console.log(`   Client Secret: ${paymentResult.clientSecret?.substring(0, 30)}...`);
    console.log(`   Payment Intent ID: ${paymentResult.paymentIntentId}`);

    // 5. Validações finais
    console.log('\n5. Validações finais...');
    
    if (!paymentResult.clientSecret) {
      throw new Error('Client Secret não retornado');
    }
    
    if (!paymentResult.paymentIntentId) {
      throw new Error('Payment Intent ID não retornado');
    }
    
    if (!paymentResult.clientSecret.includes('_secret_')) {
      throw new Error('Formato do Client Secret parece inválido');
    }

    console.log('✅ Todas as validações passaram');

    // 6. Resumo final
    console.log('\n📊 RESUMO DO TESTE FINAL');
    console.log('='.repeat(50));
    console.log('✅ Autenticação: FUNCIONANDO');
    console.log('✅ Verificação de usuário: FUNCIONANDO');
    console.log('✅ Busca de veículos: FUNCIONANDO');
    console.log('✅ Verificação de disponibilidade: FUNCIONANDO');
    console.log('✅ Criação de Payment Intent: FUNCIONANDO');
    console.log('✅ Integração Stripe: FUNCIONANDO');
    
    console.log('\n🎉 SISTEMA DE PAYMENT INTENT TOTALMENTE FUNCIONAL!');
    console.log('🚀 Pronto para produção com usuários verificados.');

    return {
      success: true,
      paymentIntent: {
        clientSecret: paymentResult.clientSecret,
        paymentIntentId: paymentResult.paymentIntentId
      }
    };

  } catch (error) {
    console.log('\n❌ ERRO NO TESTE FINAL:');
    console.log(`   ${error.message}`);
    console.log('\n🔧 AÇÕES NECESSÁRIAS:');
    console.log('1. Verificar se usuário está marcado como verificado no banco');
    console.log('2. Verificar se chaves do Stripe estão configuradas');
    console.log('3. Verificar logs do servidor para detalhes do erro');
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar teste final
finalPaymentTest()
  .then(result => {
    if (result.success) {
      console.log('\n✅ TESTE FINAL: APROVADO');
      process.exit(0);
    } else {
      console.log('\n❌ TESTE FINAL: REPROVADO');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 ERRO FATAL:', error.message);
    process.exit(1);
  });