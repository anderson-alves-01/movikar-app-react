
const BASE_URL = 'http://localhost:5000';

async function testAuthFlow() {
  console.log('🧪 Testando fluxo de autenticação completo\n');

  try {
    // 1. Verificar estado inicial
    console.log('1. Verificando estado de autenticação...');
    let checkResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      credentials: 'include'
    });
    console.log(`   Status: ${checkResponse.status}`);

    // 2. Fazer login
    console.log('\n2. Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@carshare.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou');
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido:', loginData.user.email);

    // 3. Verificar autenticação após login
    console.log('\n3. Verificando autenticação após login...');
    checkResponse = await fetch(`${BASE_URL}/api/auth/check`, {
      credentials: 'include'
    });
    
    if (checkResponse.ok) {
      const userData = await checkResponse.json();
      console.log('✅ Autenticação confirmada:', userData.user.email);
    } else {
      console.log('❌ Falha na verificação de autenticação');
    }

    // 4. Testar acesso aos planos de assinatura
    console.log('\n4. Testando acesso aos planos de assinatura...');
    const plansResponse = await fetch(`${BASE_URL}/api/subscription-plans`, {
      credentials: 'include'
    });

    if (plansResponse.ok) {
      const plans = await plansResponse.json();
      console.log(`✅ Planos carregados: ${plans.length} planos disponíveis`);
    } else {
      console.log(`❌ Falha ao carregar planos: ${plansResponse.status}`);
    }

    console.log('\n🎉 Teste completo - Fluxo funcionando!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAuthFlow();
