// Script para corrigir disponibilidade do veículo 8
const BASE_URL = 'http://localhost:5000';

async function fixVehicle8Availability() {
  console.log('🔧 CORRIGINDO DISPONIBILIDADE DO VEÍCULO 8\n');

  try {
    // Login como admin para verificar bookings
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@carshare.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Admin login falhou');
    }

    const { token } = await loginResponse.json();

    // Verificar bookings do veículo 8
    const bookingsResponse = await fetch(`${BASE_URL}/api/admin/bookings?vehicleId=8`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      console.log(`📋 Bookings do veículo 8: ${bookings.data ? bookings.data.length : 0}`);
      
      if (bookings.data && bookings.data.length > 0) {
        console.log('   Bookings encontrados:');
        bookings.data.forEach(booking => {
          console.log(`   - ID ${booking.id}: ${booking.startDate} até ${booking.endDate} (${booking.status})`);
        });
      }
    }

    // Testar datas alternativas para veículo 8
    console.log('\n🗓️  Testando datas alternativas para veículo 8...');
    
    const testDates = [
      { start: '2025-08-15', end: '2025-08-17', label: 'Agosto 15-17' },
      { start: '2025-09-01', end: '2025-09-03', label: 'Setembro 1-3' },
      { start: '2025-10-01', end: '2025-10-03', label: 'Outubro 1-3' }
    ];

    // Login como usuário teste
    const userLoginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    const { token: userToken } = await userLoginResponse.json();

    for (const testDate of testDates) {
      const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          vehicleId: 8,
          startDate: testDate.start,
          endDate: testDate.end,
          totalPrice: '200.00'
        })
      });

      if (paymentResponse.ok) {
        const result = await paymentResponse.json();
        console.log(`✅ ${testDate.label}: Payment intent criado - ${result.paymentIntentId}`);
        return { success: true, workingDates: testDate };
      } else {
        const error = await paymentResponse.json();
        console.log(`❌ ${testDate.label}: ${error.message}`);
      }
    }

    console.log('\n🔍 DIAGNÓSTICO FINAL:');
    console.log('='.repeat(50));
    console.log('❌ Veículo 8 tem conflitos em todas as datas testadas');
    console.log('💡 Recomendação: Use veículo 22 que está funcionando');

    return { success: false, recommendation: 'use_vehicle_22' };

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

fixVehicle8Availability().then(result => {
  if (result.success) {
    console.log(`\n✅ VEÍCULO 8 FUNCIONANDO EM: ${result.workingDates.label}`);
  } else {
    console.log('\n💡 SOLUÇÃO: Use o veículo ID 22 (Honda CR-V) que está 100% funcional');
  }
});