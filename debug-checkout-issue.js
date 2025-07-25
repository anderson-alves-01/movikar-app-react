// Debug do problema de checkout
const BASE_URL = 'http://localhost:5000';

async function debugCheckoutIssue() {
  console.log('🔍 INVESTIGANDO PROBLEMA DE CHECKOUT\n');

  try {
    // Login
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

    // Verificar veículo 8
    const vehicle8Response = await fetch(`${BASE_URL}/api/vehicles/8`);
    const vehicle8 = await vehicle8Response.json();
    console.log(`\n🚗 Veículo 8: ${vehicle8.brand} ${vehicle8.model}`);
    console.log(`   Proprietário ID: ${vehicle8.ownerId}`);
    console.log(`   Usuário atual: ${user.id}`);
    console.log(`   Mesmo proprietário? ${vehicle8.ownerId === user.id ? 'SIM' : 'NÃO'}`);

    // Tentar payment intent para veículo 8
    console.log('\n💳 Testando payment intent para veículo 8...');
    const payment8Response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicleId: 8,
        startDate: '2025-08-01',
        endDate: '2025-08-08',
        totalPrice: '815.50'
      })
    });

    if (!payment8Response.ok) {
      const error8 = await payment8Response.json();
      console.log(`❌ Erro veículo 8: ${error8.message}`);
    } else {
      const result8 = await payment8Response.json();
      console.log(`✅ Payment intent 8 criado: ${result8.paymentIntentId}`);
    }

    // Verificar veículo 22
    const vehicle22Response = await fetch(`${BASE_URL}/api/vehicles/22`);
    const vehicle22 = await vehicle22Response.json();
    console.log(`\n🚗 Veículo 22: ${vehicle22.brand} ${vehicle22.model}`);
    console.log(`   Proprietário ID: ${vehicle22.ownerId}`);
    console.log(`   Mesmo proprietário? ${vehicle22.ownerId === user.id ? 'SIM' : 'NÃO'}`);

    // Tentar payment intent para veículo 22
    console.log('\n💳 Testando payment intent para veículo 22...');
    const payment22Response = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        vehicleId: 22,
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        totalPrice: '360.00'
      })
    });

    if (!payment22Response.ok) {
      const error22 = await payment22Response.json();
      console.log(`❌ Erro veículo 22: ${error22.message}`);
    } else {
      const result22 = await payment22Response.json();
      console.log(`✅ Payment intent 22 criado: ${result22.paymentIntentId}`);
    }

    console.log('\n📊 DIAGNÓSTICO:');
    console.log('='.repeat(50));
    if (vehicle8.ownerId === user.id) {
      console.log('❌ Usuário 8 é proprietário do veículo 8 - não pode alugar');
    }
    if (vehicle22.ownerId === user.id) {
      console.log('❌ Usuário 8 é proprietário do veículo 22 - não pode alugar');
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

debugCheckoutIssue();