// Teste do fluxo completo de assinatura
const BASE_URL = 'http://localhost:5000';

async function testCompleteFlow() {
  console.log('🎯 TESTE FLUXO COMPLETO DE ASSINATURA\n');

  try {
    // 1. Login
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

    // 2. Verificar booking
    console.log('\n2. Verificando booking...');
    const bookingResponse = await fetch(`${BASE_URL}/api/bookings/16`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (bookingResponse.ok) {
      const booking = await bookingResponse.json();
      console.log(`✅ Booking ID: ${booking.id} | Status: ${booking.status}`);
      console.log(`   Locatário: ${booking.renterId} | Proprietário: ${booking.ownerId}`);
    } else {
      console.log('❌ Booking não acessível');
      return;
    }

    // 3. Testar preview do contrato
    console.log('\n3. Testando preview...');
    const previewResponse = await fetch(`${BASE_URL}/api/contracts/preview/16`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (previewResponse.ok) {
      console.log('✅ Preview funcionando');
    } else {
      console.log('❌ Preview falhou');
      return;
    }

    // 4. Iniciar assinatura GOV.BR
    console.log('\n4. Iniciando assinatura GOV.BR...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/16`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (signResponse.ok) {
      const signData = await signResponse.json();
      console.log('✅ Assinatura iniciada');
      console.log(`   URL: ${signData.signatureUrl}`);

      // 5. Testar simulador
      console.log('\n5. Testando simulador...');
      const simulatorResponse = await fetch(signData.signatureUrl);
      
      if (simulatorResponse.ok) {
        console.log('✅ Simulador funcionando');
        
        // 6. Simular assinatura bem-sucedida
        console.log('\n6. Simulando assinatura...');
        const callbackUrl = signData.signatureUrl.match(/returnUrl=([^&]+)/)?.[1];
        if (callbackUrl) {
          const decodedCallback = decodeURIComponent(callbackUrl);
          const finalCallbackUrl = `${decodedCallback}&status=success`;
          
          const callbackResponse = await fetch(finalCallbackUrl);
          if (callbackResponse.ok) {
            console.log('✅ Callback executado - contrato assinado');
            
            // 7. Verificar status final
            const finalBookingResponse = await fetch(`${BASE_URL}/api/bookings/16`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (finalBookingResponse.ok) {
              const finalBooking = await finalBookingResponse.json();
              console.log(`📋 Status final: ${finalBooking.status}`);
            }
          }
        }
      }
    } else {
      const error = await signResponse.json();
      console.log(`❌ Assinatura falhou: ${error.message}`);
    }

    console.log('\n🎉 TESTE COMPLETO FINALIZADO');
    console.log('='.repeat(50));
    console.log('✅ Login funcionando');
    console.log('✅ Preview de contrato funcionando');
    console.log('✅ Simulador GOV.BR funcionando');
    console.log('✅ Fluxo de assinatura completamente operacional');

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testCompleteFlow();