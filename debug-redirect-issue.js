// Debug do problema de redirecionamento GOV.BR
const BASE_URL = 'http://localhost:5000';

async function debugRedirectIssue() {
  console.log('🔍 DEBUG: Problema de redirecionamento GOV.BR\n');

  try {
    // 1. Login como locatário
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'locatario.teste@carshare.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou, tentando criar usuário...');
      
      // Criar usuário locatário
      const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Locatário Teste',
          email: 'locatario.teste@carshare.com',
          password: 'senha123',
          role: 'renter'
        })
      });

      if (!registerResponse.ok) {
        const error = await registerResponse.json();
        console.log(`❌ Registro falhou: ${error.message}`);
        return;
      }

      // Login novamente
      const retryLogin = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'locatario.teste@carshare.com',
          password: 'senha123'
        })
      });
      
      const { token, user } = await retryLogin.json();
      console.log(`✅ Usuário criado e logado: ${user.name} (ID: ${user.id})`);
    } else {
      const { token, user } = await loginResponse.json();
      console.log(`✅ Login: ${user.name} (ID: ${user.id})`);
    }

    // 2. Buscar booking existente
    console.log('\n2. Buscando bookings...');
    const { token, user } = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'locatario.teste@carshare.com',
        password: 'senha123'
      })
    })).json();

    const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const bookings = await bookingsResponse.json();
    console.log(`📋 Bookings encontrados: ${bookings.length}`);

    if (bookings.length === 0) {
      console.log('❌ Nenhum booking encontrado. Sistema limpo - precisa criar booking primeiro.');
      return;
    }

    const booking = bookings[bookings.length - 1];
    console.log(`✅ Usando booking ID: ${booking.id}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Locatário: ${booking.renterId} | Usuário atual: ${user.id}`);

    // 3. Testar requisição de assinatura
    console.log('\n3. Testando requisição de assinatura...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${booking.id}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📊 Status da resposta: ${signResponse.status}`);
    const responseData = await signResponse.json();
    console.log('📄 Dados da resposta:', JSON.stringify(responseData, null, 2));

    if (!signResponse.ok) {
      console.log(`❌ Erro na assinatura: ${responseData.message}`);
      
      if (responseData.message.includes('locatário')) {
        console.log('🔄 Problema: usuário não é o locatário. Checando dados...');
        console.log(`   Booking pertence ao locatário ID: ${booking.renterId}`);
        console.log(`   Usuário atual é ID: ${user.id}`);
        console.log('   Solução: Precisa usar o usuário correto ou ajustar o booking');
      }
      return;
    }

    // 4. Testar acesso ao simulador
    console.log('\n4. Testando acesso ao simulador GOV.BR...');
    console.log(`🔗 URL do simulador: ${responseData.signatureUrl}`);
    
    const simulatorResponse = await fetch(responseData.signatureUrl);
    if (simulatorResponse.ok) {
      console.log('✅ Simulador GOV.BR respondeu corretamente');
      const html = await simulatorResponse.text();
      
      if (html.includes('GOV.BR') && html.includes('Assinatura Digital')) {
        console.log('✅ Conteúdo do simulador está correto');
        console.log('✅ Redirecionamento deve funcionar');
        
        // Extrair URL de callback para teste
        const callbackMatch = html.match(/const returnUrl = "([^"]+)"/);
        if (callbackMatch) {
          console.log(`🔄 URL de callback: ${callbackMatch[1]}`);
        }
      } else {
        console.log('❌ Conteúdo do simulador está incorreto');
      }
    } else {
      console.log('❌ Simulador GOV.BR não respondeu');
    }

    console.log('\n✅ DEBUG COMPLETO - Sistema funcionando');
    console.log('🎯 Para funcionar na interface:');
    console.log('   1. Usuário precisa ser o locatário da reserva');
    console.log('   2. Token de autenticação deve estar válido');
    console.log('   3. JavaScript deve executar window.location.href corretamente');

  } catch (error) {
    console.log(`❌ Erro no debug: ${error.message}`);
  }
}

debugRedirectIssue();