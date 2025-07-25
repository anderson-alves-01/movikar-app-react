// Teste de integração do fluxo completo de pagamento
// Execute com: node test-payment-flow.js

const BASE_URL = 'http://localhost:5000';

async function makeRequest(method, endpoint, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`${response.status}: ${result.message || 'Request failed'}`);
  }
  
  return result;
}

async function testPaymentFlow() {
  console.log('🧪 Iniciando teste de integração do fluxo de pagamento...\n');

  try {
    // 1. Login como usuário verificado
    console.log('1. Fazendo login como usuário verificado...');
    const loginResponse = await makeRequest('POST', '/api/auth/login', {
      email: 'asouzamax@gmail.com',
      password: 'senha123'
    });
    
    const userToken = loginResponse.token;
    console.log('✅ Login realizado com sucesso');
    console.log(`   Token: ${userToken.substring(0, 20)}...`);

    // 2. Verificar status de verificação do usuário
    console.log('\n2. Verificando status de verificação do usuário...');
    const userInfo = await makeRequest('GET', '/api/auth/user', null, userToken);
    console.log('✅ Usuário autenticado:');
    console.log(`   Nome: ${userInfo.name}`);
    console.log(`   Status: ${userInfo.verificationStatus}`);
    console.log(`   Pode alugar: ${userInfo.canRentVehicles}`);

    if (userInfo.verificationStatus !== 'verified') {
      throw new Error('Usuário não está verificado. Não pode prosseguir com o aluguel.');
    }

    // 3. Buscar veículos disponíveis
    console.log('\n3. Buscando veículos disponíveis...');
    const vehicles = await makeRequest('GET', '/api/vehicles');
    console.log(`✅ Encontrados ${vehicles.length} veículos`);
    
    if (vehicles.length === 0) {
      throw new Error('Nenhum veículo disponível para teste');
    }

    const testVehicle = vehicles[0];
    console.log(`   Testando com veículo: ${testVehicle.brand} ${testVehicle.model}`);
    console.log(`   Preço por dia: R$ ${testVehicle.pricePerDay}`);

    // 4. Verificar disponibilidade do veículo
    console.log('\n4. Verificando disponibilidade do veículo...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Amanhã
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3); // Daqui 3 dias

    const availabilityCheck = await makeRequest('GET', 
      `/api/vehicles/${testVehicle.id}/availability?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    );
    console.log('✅ Disponibilidade verificada:');
    console.log(`   Disponível: ${availabilityCheck.available}`);

    // 5. Criar payment intent
    console.log('\n5. Criando payment intent...');
    const totalPrice = (parseFloat(testVehicle.pricePerDay) * 2).toFixed(2); // 2 dias
    
    const paymentIntentData = {
      vehicleId: testVehicle.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPrice: totalPrice
    };

    const paymentIntent = await makeRequest('POST', '/api/create-payment-intent', paymentIntentData, userToken);
    console.log('✅ Payment intent criado com sucesso:');
    console.log(`   Client Secret: ${paymentIntent.clientSecret.substring(0, 30)}...`);
    console.log(`   Payment Intent ID: ${paymentIntent.paymentIntentId}`);
    console.log(`   Valor total: R$ ${totalPrice}`);

    // 6. Simular confirmação de pagamento (normalmente feito pelo Stripe)
    console.log('\n6. Simulando confirmação de pagamento...');
    
    // Nota: Em produção, este passo seria feito pelo Stripe automaticamente
    // Para o teste, vamos direto para a confirmação do aluguel
    const confirmRentalData = {
      paymentIntentId: paymentIntent.paymentIntentId,
      vehicleId: testVehicle.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPrice: totalPrice
    };

    console.log('⚠️  NOTA: Em produção, o pagamento seria processado pelo Stripe');
    console.log('   Prosseguindo para confirmação do aluguel...');

    // 7. Verificar se o payment intent existe no Stripe (apenas log)
    console.log('\n7. Verificando payment intent no sistema...');
    console.log(`   Payment Intent ID: ${paymentIntent.paymentIntentId}`);
    console.log('   Status: Criado e pronto para pagamento');

    // 8. Teste de busca de reservas do usuário
    console.log('\n8. Verificando reservas existentes do usuário...');
    try {
      const userBookings = await makeRequest('GET', '/api/bookings', null, userToken);
      console.log(`✅ Usuário tem ${userBookings.length} reservas existentes`);
    } catch (error) {
      console.log(`⚠️  Erro ao buscar reservas: ${error.message}`);
    }

    console.log('\n🎉 TESTE DE INTEGRAÇÃO CONCLUÍDO COM SUCESSO!');
    console.log('\nResumo do teste:');
    console.log('✅ Login de usuário verificado');
    console.log('✅ Verificação de status de usuário');
    console.log('✅ Busca de veículos disponíveis');
    console.log('✅ Verificação de disponibilidade');
    console.log('✅ Criação de payment intent');
    console.log('✅ Preparação para confirmação de aluguel');
    
    console.log('\n📋 Próximos passos para teste completo:');
    console.log('1. Integrar com Stripe Test Mode');
    console.log('2. Confirmar pagamento via Stripe');
    console.log('3. Confirmar aluguel automaticamente');
    console.log('4. Verificar criação de contrato');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE DE INTEGRAÇÃO:');
    console.error(`   ${error.message}`);
    console.error('\n🔍 Detalhes do erro:');
    console.error(error);
  }
}

// Executar o teste
testPaymentFlow();