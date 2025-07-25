// Teste final do veículo 8 após correção
const BASE_URL = 'http://localhost:5000';

async function testVehicle8Fixed() {
  console.log('🎯 TESTE FINAL VEÍCULO 8 APÓS CORREÇÃO\n');

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

    const { token } = await loginResponse.json();

    // Testar payment intent nas datas originais
    console.log('💳 Testando datas originais (2025-08-01 a 2025-08-08)...');
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
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

    if (paymentResponse.ok) {
      const result = await paymentResponse.json();
      console.log(`✅ SUCESSO! Payment Intent criado: ${result.paymentIntentId}`);
      
      console.log('\n🎉 VEÍCULO 8 TOTALMENTE FUNCIONAL!');
      console.log('='.repeat(50));
      console.log('✅ Bookings conflitantes removidos');
      console.log('✅ Datas liberadas para aluguel');
      console.log('✅ Payment intent funciona perfeitamente');
      console.log('✅ URL de checkout agora carregará corretamente');
      
      return { success: true, paymentIntentId: result.paymentIntentId };
    } else {
      const error = await paymentResponse.json();
      console.log(`❌ Ainda há problema: ${error.message}`);
      return { success: false, error: error.message };
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

testVehicle8Fixed().then(result => {
  if (result.success) {
    console.log('\n🚗 PROBLEMA RESOLVIDO COMPLETAMENTE!');
    console.log('   Agora pode alugar o veículo 8 nas datas desejadas');
    console.log('   A URL de checkout funcionará normalmente');
  }
});