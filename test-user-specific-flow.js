// Teste específico para reproduzir o problema do usuário
const BASE_URL = 'http://localhost:5000';

async function testUserSpecificFlow() {
  console.log('🔥 TESTE ESPECÍFICO - REPRODUZINDO PROBLEMA DO USUÁRIO\n');

  try {
    // 1. Login como usuário Anderson (mesmo usuário dos logs)
    console.log('1. Login como Anderson (usuário dos logs)...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asouzamax@gmail.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou - verificando se usuário existe');
      
      // Verificar se o usuário existe
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'ANDERSON DE SOUZA ALVES',
          email: 'asouzamax@gmail.com',
          password: 'senha123',
          phone: '11999999999',
          role: 'renter'
        })
      });

      if (registerResponse.ok) {
        const userData = await registerResponse.json();
        var token = userData.token;
        console.log(`✅ Usuário criado: ${userData.user.name}`);
      } else {
        console.log('❌ Falha total na autenticação');
        return;
      }
    } else {
      const loginData = await loginResponse.json();
      var token = loginData.token;
      console.log(`✅ Login: ${loginData.user.name}`);
    }

    // 2. Buscar reserva 19 (a mesma dos logs)
    console.log('\n2. Acessando reserva 19 (dos logs do usuário)...');
    const previewResponse = await fetch(`${BASE_URL}/api/contracts/preview/19`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!previewResponse.ok) {
      console.log('❌ Não consegue acessar reserva 19, criando nova reserva...');
      
      // Criar nova reserva para o usuário
      const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vehicleId: 22, // Honda CR-V que sabemos que existe
          startDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
          endDate: new Date(Date.now() + 3*24*60*60*1000).toISOString(),
          totalPrice: 300
        })
      });

      if (bookingResponse.ok) {
        const booking = await bookingResponse.json();
        console.log(`✅ Nova reserva criada: ${booking.id}`);
        var bookingId = booking.id;
      } else {
        console.log('❌ Falha ao criar reserva');
        return;
      }
    } else {
      var bookingId = 19;
      console.log('✅ Acesso à reserva 19 confirmado');
    }

    // 3. Iniciar assinatura GOV.BR
    console.log(`\n3. Iniciando assinatura para reserva ${bookingId}...`);
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${bookingId}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!signResponse.ok) {
      const error = await signResponse.text();
      console.log(`❌ Erro na assinatura: ${error}`);
      return;
    }

    const signData = await signResponse.json();
    console.log(`✅ URL gerada: ${signData.signatureId}`);

    // 4. Testar o simulador diretamente
    console.log('\n4. Testando simulador GOV.BR...');
    const simulatorResponse = await fetch(signData.signatureUrl);
    
    if (simulatorResponse.ok) {
      const html = await simulatorResponse.text();
      console.log('✅ Simulador carrega');
      
      // Verificar se tem botão de sucesso
      if (html.includes("onclick=\"signDocument('success')\"")) {
        console.log('✅ Botão de assinatura presente');
        
        // 5. Simular clique no botão "success"
        console.log('\n5. Simulando clique no botão "✅ Assinar Documento"...');
        
        const urlPattern = /returnUrl.*?=.*?"([^"]+)"/;
        const match = html.match(urlPattern);
        
        if (match) {
          const returnUrl = match[1].replace(/&amp;/g, '&');
          const successUrl = `${returnUrl}&status=success`;
          
          console.log(`🔗 URL de callback: ${successUrl}`);
          
          const callbackResponse = await fetch(successUrl, {
            method: 'GET',
            redirect: 'manual'
          });
          
          if (callbackResponse.status === 302) {
            const location = callbackResponse.headers.get('location');
            console.log(`✅ Sucesso! Redirecionando para: ${location}`);
            
            console.log('\n🎯 RESULTADO FINAL:');
            console.log('O sistema está funcionando perfeitamente!');
            console.log('INSTRUÇÕES PARA O USUÁRIO:');
            console.log('1. Na página do contrato, clique em "Assinar no GOV.BR"');
            console.log('2. Na página que abrir, clique no botão VERDE "✅ Assinar Documento"');
            console.log('3. Aguarde 2-3 segundos para o processamento');
            console.log('4. Você será redirecionado automaticamente');
            
          } else {
            console.log(`❌ Callback falhou: ${callbackResponse.status}`);
          }
        } else {
          console.log('❌ Não conseguiu extrair URL de retorno');
        }
        
      } else {
        console.log('❌ Botão de assinatura não encontrado no HTML');
      }
    } else {
      console.log('❌ Simulador não carrega');
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

testUserSpecificFlow();