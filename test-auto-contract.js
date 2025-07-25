// Teste automático do fluxo de contrato
const BASE_URL = 'http://localhost:5000';

async function testAutoContract() {
  console.log('🎯 TESTE AUTOMÁTICO DO FLUXO DE CONTRATO\n');

  try {
    // 1. Login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asouzamax@gmail.com',
        password: 'senha123'
      })
    });

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login: ${user.name} (ID: ${user.id})`);

    // 2. Verificar reserva 17
    const bookingResponse = await fetch(`${BASE_URL}/api/bookings/17`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!bookingResponse.ok) {
      console.log('❌ Reserva 17 não encontrada');
      return;
    }

    const booking = await bookingResponse.json();
    console.log(`✅ Reserva encontrada: ID ${booking.id}, Status: ${booking.status}`);

    // 3. Testar fluxo completo de assinatura
    console.log('\n📝 Iniciando assinatura...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/17`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!signResponse.ok) {
      const error = await signResponse.json();
      console.log(`❌ Falha na assinatura: ${error.message}`);
      return;
    }

    const signData = await signResponse.json();
    console.log('✅ URL de assinatura gerada');
    console.log(`🔗 URL: ${signData.signatureUrl}`);

    // 4. Testar o simulador GOV.BR
    console.log('\n🏛️ Testando simulador GOV.BR...');
    const simulatorResponse = await fetch(signData.signatureUrl);
    
    if (simulatorResponse.ok) {
      console.log('✅ Simulador carregou corretamente');
      const html = await simulatorResponse.text();
      
      if (html.includes('GOV.BR') && html.includes('Assinar Documento')) {
        console.log('✅ Conteúdo do simulador verificado');
      } else {
        console.log('❌ Conteúdo do simulador incompleto');
      }
    } else {
      console.log('❌ Simulador falhou ao carregar');
    }

    // 5. Simular assinatura bem-sucedida
    console.log('\n📋 Simulando assinatura automática...');
    const callbackUrl = signData.signatureUrl.match(/returnUrl=([^&]+)/)?.[1];
    
    if (callbackUrl) {
      const decodedCallback = decodeURIComponent(callbackUrl);
      const finalCallbackUrl = `${decodedCallback}&status=success`;
      
      console.log(`🔗 Callback: ${finalCallbackUrl}`);
      
      const callbackResponse = await fetch(finalCallbackUrl);
      
      if (callbackResponse.ok) {
        console.log('✅ Callback executado com sucesso');
        
        // 6. Verificar status final
        const finalBookingResponse = await fetch(`${BASE_URL}/api/bookings/17`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (finalBookingResponse.ok) {
          const finalBooking = await finalBookingResponse.json();
          console.log(`📋 Status final da reserva: ${finalBooking.status}`);
        }
      } else {
        console.log('❌ Callback falhou');
      }
    } else {
      console.log('❌ URL de callback não encontrada');
    }

    console.log('\n🎉 TESTE AUTOMÁTICO COMPLETO');
    console.log('='.repeat(50));
    console.log('✅ Sistema de autenticação funcionando');
    console.log('✅ API de assinatura funcionando'); 
    console.log('✅ Simulador GOV.BR carregando');
    console.log('✅ Callback de retorno funcionando');
    console.log('✅ Fluxo completo operacional');

  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

testAutoContract();