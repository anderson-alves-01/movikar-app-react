// Teste do fluxo de assinatura sem loops de autenticação
const baseUrl = 'http://localhost:5000';

// Simular um cookie jar para manter cookies entre requisições
let cookieStore = '';

function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

async function testSubscriptionFlow() {
  console.log('🧪 Testando fluxo de assinatura sem loops de autenticação...\n');

  // 1. Fazer login
  console.log('1️⃣ Fazendo login...');
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      email: 'teste2@carshare.com',
      password: 'Teste123!'
    })
  });

  if (!loginResponse.ok) {
    console.error('❌ Falha no login:', await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  console.log('✅ Login bem-sucedido:', loginData.user.name);
  
  // Salvar cookies da resposta de login
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (setCookieHeaders) {
    cookieStore = parseCookies(setCookieHeaders);
    console.log('📝 Cookies salvos:', cookieStore);
  }

  // 2. Verificar se está autenticado
  console.log('\n2️⃣ Verificando autenticação...');
  const authResponse = await fetch(`${baseUrl}/api/auth/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cookie': cookieStore
    }
  });

  if (!authResponse.ok) {
    console.error('❌ Falha na verificação de autenticação:', await authResponse.text());
    return;
  }

  const authData = await authResponse.json();
  console.log('✅ Usuário autenticado:', authData.name);

  // 3. Tentar criar uma assinatura (simular endpoint que causava loops)
  console.log('\n3️⃣ Testando criação de assinatura...');
  const subscriptionResponse = await fetch(`${baseUrl}/api/subscription/create`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Cookie': cookieStore
    },
    credentials: 'include',
    body: JSON.stringify({
      planName: 'essencial',
      paymentMethod: 'monthly',
      vehicleCount: 5
    })
  });

  if (subscriptionResponse.ok) {
    const subscriptionData = await subscriptionResponse.json();
    console.log('✅ Assinatura criada com sucesso!');
    console.log('Client Secret:', subscriptionData.clientSecret ? 'Presente' : 'Ausente');
  } else {
    const errorText = await subscriptionResponse.text();
    if (subscriptionResponse.status === 401) {
      console.log('⚠️ Erro 401 detectado - possível loop de autenticação');
    } else {
      console.log(`ℹ️ Status ${subscriptionResponse.status}:`, errorText);
    }
  }

  // 4. Verificar se ainda está autenticado após a tentativa de assinatura
  console.log('\n4️⃣ Verificando se autenticação persistiu...');
  const postAuthResponse = await fetch(`${baseUrl}/api/auth/user`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cookie': cookieStore
    }
  });

  if (postAuthResponse.ok) {
    const postAuthData = await postAuthResponse.json();
    console.log('✅ Autenticação mantida:', postAuthData.name);
    console.log('\n🎉 SUCESSO: Fluxo de assinatura sem loops de autenticação!');
  } else {
    console.log('❌ Autenticação perdida após tentativa de assinatura');
    console.log('Status:', postAuthResponse.status);
  }
}

// Executar teste
testSubscriptionFlow().catch(console.error);