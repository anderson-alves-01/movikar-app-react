// Teste específico para o veículo ID 22
const BASE_URL = 'http://localhost:5000';

async function testVehicle22() {
  console.log('🚗 INVESTIGANDO PROBLEMA COM VEÍCULO ID 22\n');

  try {
    // 1. Login com usuário verificado
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

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login: ${user.name} (${user.verificationStatus})`);

    // 2. Verificar se veículo 22 existe
    console.log('\n🔍 Verificando veículo ID 22...');
    const vehicleResponse = await fetch(`${BASE_URL}/api/vehicles/22`);
    
    if (!vehicleResponse.ok) {
      console.log(`❌ Veículo 22 não encontrado: ${vehicleResponse.status}`);
      const error = await vehicleResponse.json();
      console.log(`   Erro: ${error.message}`);
      
      // Verificar veículos disponíveis
      console.log('\n📋 Verificando veículos disponíveis...');
      const allVehiclesResponse = await fetch(`${BASE_URL}/api/vehicles`);
      if (allVehiclesResponse.ok) {
        const vehicles = await allVehiclesResponse.json();
        console.log(`   Total de veículos: ${vehicles.length}`);
        console.log('   IDs disponíveis:', vehicles.map(v => v.id).join(', '));
      }
      return { success: false, error: 'Veículo 22 não existe' };
    }

    const vehicle = await vehicleResponse.json();
    console.log(`✅ Veículo encontrado: ${vehicle.brand} ${vehicle.model}`);
    console.log(`   Proprietário ID: ${vehicle.ownerId}`);
    console.log(`   Disponível: ${vehicle.isAvailable}`);
    console.log(`   Preço/dia: R$ ${vehicle.pricePerDay}`);

    // 3. Tentar criar payment intent para veículo 22
    console.log('\n💳 Testando criação de payment intent...');
    const paymentData = {
      vehicleId: 22,
      startDate: '2025-07-27',
      endDate: '2025-07-29',
      totalPrice: '300.00'
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
      const paymentError = await paymentResponse.json();
      console.log(`❌ Falha ao criar payment intent: ${paymentError.message}`);
      return { success: false, error: paymentError.message };
    }

    const { paymentIntentId } = await paymentResponse.json();
    console.log(`✅ Payment Intent criado: ${paymentIntentId}`);

    console.log('\n🎯 DIAGNÓSTICO VEÍCULO 22:');
    console.log('='.repeat(50));
    console.log('✅ Veículo existe no banco');
    console.log('✅ Veículo disponível para aluguel');
    console.log('✅ Payment intent pode ser criado');
    console.log('✅ Sistema funcionando normalmente');

    return { success: true, vehicleId: 22, paymentIntentId };

  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testVehicle22().then(result => {
  if (result.success) {
    console.log('\n✅ VEÍCULO 22 FUNCIONANDO NORMALMENTE');
    console.log('   O problema pode estar em outro lugar do fluxo');
  } else {
    console.log('\n❌ PROBLEMA IDENTIFICADO COM VEÍCULO 22');
    console.log(`   Erro: ${result.error}`);
  }
});