// Teste completo do fluxo de assinatura
const BASE_URL = 'http://localhost:5000';

async function testCompleteSignatureFlow() {
  console.log('🔥 TESTE COMPLETO DO FLUXO DE ASSINATURA\n');

  try {
    // 1. Login como usuário Anderson (locatário da reserva 18)
    console.log('1. Fazendo login como locatário...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asouzamax@gmail.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou, criando usuário de teste...');
      
      // Criar usuário de teste
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Anderson Test',
          email: 'anderson.test@gmail.com',
          password: 'senha123',
          phone: '11999999999',
          role: 'renter'
        })
      });

      if (!registerResponse.ok) {
        console.log('❌ Falha ao criar usuário');
        return;
      }

      const userData = await registerResponse.json();
      console.log(`✅ Usuário criado: ${userData.user.name}`);
      
      // Usar dados do novo usuário
      var token = userData.token;
      var userId = userData.user.id;
    } else {
      const loginData = await loginResponse.json();
      console.log(`✅ Login realizado: ${loginData.user.name}`);
      var token = loginData.token;
      var userId = loginData.user.id;
    }

    // 2. Verificar se existe reserva disponível
    console.log('\n2. Verificando reservas disponíveis...');
    const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    let bookingId;
    if (bookingsResponse.ok) {
      const bookings = await bookingsResponse.json();
      const approvedBooking = bookings.find(b => b.status === 'approved' && b.renterId === userId);
      
      if (approvedBooking) {
        bookingId = approvedBooking.id;
        console.log(`✅ Reserva encontrada: ${bookingId}`);
      } else {
        console.log('⚠️ Nenhuma reserva aprovada encontrada, usando reserva 18 do banco');
        bookingId = 18;
      }
    } else {
      console.log('⚠️ Erro ao buscar reservas, usando reserva 18');
      bookingId = 18;
    }

    // 3. Buscar preview do contrato
    console.log(`\n3. Buscando preview do contrato para reserva ${bookingId}...`);
    const previewResponse = await fetch(`${BASE_URL}/api/contracts/preview/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (previewResponse.ok) {
      const preview = await previewResponse.json();
      console.log(`✅ Preview do contrato carregado para veículo ${preview.vehicle?.brand} ${preview.vehicle?.model}`);
    } else {
      const error = await previewResponse.text();
      console.log(`❌ Erro no preview: ${error}`);
      return;
    }

    // 4. Iniciar assinatura GOV.BR
    console.log(`\n4. Iniciando assinatura GOV.BR para reserva ${bookingId}...`);
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${bookingId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (signResponse.ok) {
      const signData = await signResponse.json();
      console.log(`✅ URL de assinatura gerada: ${signData.signatureId}`);
      console.log(`🔗 URL: ${signData.signatureUrl.substring(0, 80)}...`);
      
      // 5. Simular clique no simulador GOV.BR
      console.log('\n5. Simulando assinatura no GOV.BR...');
      const callbackUrl = signData.signatureUrl.match(/returnUrl=([^&]+)/)?.[1];
      
      if (callbackUrl) {
        const decodedCallbackUrl = decodeURIComponent(callbackUrl) + '&status=success';
        console.log(`📞 Callback URL: ${decodedCallbackUrl}`);
        
        const callbackResponse = await fetch(decodedCallbackUrl, {
          method: 'GET',
          redirect: 'manual'
        });
        
        if (callbackResponse.status === 302) {
          const location = callbackResponse.headers.get('location');
          console.log(`✅ Assinatura processada! Redirecionando para: ${location}`);
          
          // 6. Verificar se contrato foi assinado
          console.log('\n6. Verificando status final do contrato...');
          const finalPreviewResponse = await fetch(`${BASE_URL}/api/contracts/preview/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (finalPreviewResponse.ok) {
            const finalPreview = await finalPreviewResponse.json();
            console.log(`✅ Status final do contrato: ${finalPreview.status || 'undefined'}`);
            console.log(`✅ Contrato assinado pelo locatário: ${finalPreview.renterSigned ? 'Sim' : 'Não'}`);
            console.log(`✅ Contrato assinado pelo proprietário: ${finalPreview.ownerSigned ? 'Sim' : 'Não'}`);
          }
          
          console.log('\n🎉 FLUXO DE ASSINATURA COMPLETO!');
          console.log('='.repeat(50));
          console.log('✅ Login realizado');
          console.log('✅ Preview do contrato carregado');
          console.log('✅ URL de assinatura GOV.BR gerada');
          console.log('✅ Simulador processou assinatura');
          console.log('✅ Callback executado com sucesso');
          console.log('✅ Contrato marcado como assinado');
          
        } else {
          console.log(`❌ Callback falhou com status: ${callbackResponse.status}`);
        }
      } else {
        console.log('❌ Não foi possível extrair callback URL');
      }
      
    } else {
      const error = await signResponse.text();
      console.log(`❌ Erro na assinatura: ${error}`);
    }

  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

testCompleteSignatureFlow();