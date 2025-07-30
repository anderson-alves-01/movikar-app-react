#!/usr/bin/env node

/**
 * Testes Focados de Autenticação - Evitando Rate Limiting
 * Testa cenários específicos com delays entre requisições
 */

const baseUrl = 'http://localhost:5000';
let globalCookies = '';

function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

async function apiRequest(method, endpoint, data = null, cookies = null) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };

  if (cookies) options.headers['Cookie'] = cookies;
  if (data) options.body = JSON.stringify(data);

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  
  const setCookieHeaders = response.headers.get('set-cookie');
  if (setCookieHeaders) {
    globalCookies = parseCookies(setCookieHeaders);
  }

  return response;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAuthenticationFlow() {
  console.log('🧪 TESTE FOCADO: Fluxo de autenticação sem rate limiting\n');

  try {
    // 1. Criar usuário único
    const timestamp = Date.now();
    const userData = {
      name: 'Teste Focado',
      email: `focado_${timestamp}@carshare.com`,
      password: 'TesteFocado@123',
      phone: '11999888777'
    };

    console.log('1️⃣ Registrando usuário...');
    const registerResponse = await apiRequest('POST', '/api/auth/register', userData);
    const registerData = await registerResponse.json();

    if (registerResponse.status === 201) {
      console.log('✅ Registro bem-sucedido:', registerData.user.name);
    } else {
      console.log('❌ Falha no registro:', registerData.message);
      return;
    }

    // Aguardar para evitar rate limiting
    await sleep(2000);

    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...');
    globalCookies = ''; // Limpar cookies
    
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    const loginData = await loginResponse.json();

    if (loginResponse.status === 200) {
      console.log('✅ Login bem-sucedido:', loginData.user.name);
      console.log('📝 Cookies salvos:', globalCookies ? 'Sim' : 'Não');
    } else {
      console.log('❌ Falha no login:', loginData.message);
      return;
    }

    await sleep(1000);

    // 3. Verificar autenticação
    console.log('\n3️⃣ Verificando autenticação...');
    const authResponse = await apiRequest('GET', '/api/auth/user', null, globalCookies);

    if (authResponse.status === 200) {
      const authData = await authResponse.json();
      console.log('✅ Usuário autenticado:', authData.name);
    } else {
      const errorData = await authResponse.json();
      console.log('❌ Falha na autenticação:', errorData.message);
      return;
    }

    await sleep(1000);

    // 4. Testar múltiplas requisições autenticadas (simular navegação)
    console.log('\n4️⃣ Testando navegação autenticada...');
    const endpoints = ['/api/auth/user', '/api/profile', '/api/auth/user'];
    
    let consecutiveFailures = 0;
    for (let i = 0; i < endpoints.length; i++) {
      const endpoint = endpoints[i];
      const response = await apiRequest('GET', endpoint, null, globalCookies);
      
      if (response.status === 401) {
        consecutiveFailures++;
        console.log(`❌ ${endpoint}: Status 401 (tentativa ${i + 1})`);
      } else if (response.status === 200) {
        console.log(`✅ ${endpoint}: Status 200`);
        consecutiveFailures = 0; // Reset contador
      } else {
        console.log(`⚠️ ${endpoint}: Status ${response.status}`);
      }
      
      await sleep(500); // Pequeno delay entre requisições
    }

    if (consecutiveFailures >= 2) {
      console.log('\n🚨 PROBLEMA: Loop de autenticação detectado!');
      console.log('   Múltiplas requisições 401 consecutivas indicam problema no sistema');
    } else {
      console.log('\n✅ Navegação funcionando corretamente');
      console.log('   Não há loops de autenticação detectados');
    }

    await sleep(1000);

    // 5. Testar logout
    console.log('\n5️⃣ Testando logout...');
    const logoutResponse = await apiRequest('POST', '/api/auth/logout', null, globalCookies);

    if (logoutResponse.status === 200) {
      console.log('✅ Logout bem-sucedido');
      
      // Verificar se cookies foram limpos
      const postLogoutResponse = await apiRequest('GET', '/api/auth/user', null, globalCookies);
      
      if (postLogoutResponse.status === 401) {
        console.log('✅ Cookies limpos corretamente após logout');
      } else {
        console.log('❌ Cookies não foram limpos após logout');
      }
    } else {
      console.log('❌ Falha no logout');
    }

  } catch (error) {
    console.log('❌ Erro durante teste:', error.message);
  }
}

async function testTokenRefresh() {
  console.log('\n🧪 TESTE ESPECÍFICO: Refresh de token\n');

  try {
    // Criar usuário para teste de refresh
    const timestamp = Date.now();
    const userData = {
      name: 'Teste Refresh',
      email: `refresh_${timestamp}@carshare.com`,
      password: 'TesteRefresh@123',
      phone: '11999888778'
    };

    await apiRequest('POST', '/api/auth/register', userData);
    await sleep(1000);

    // Fazer login
    globalCookies = '';
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Falha no login para teste de refresh');
      return;
    }

    await sleep(1000);

    // Testar refresh
    console.log('🔄 Testando refresh de token...');
    const refreshResponse = await apiRequest('POST', '/api/auth/refresh', null, globalCookies);

    if (refreshResponse.status === 200) {
      const refreshData = await refreshResponse.json();
      console.log('✅ Refresh bem-sucedido:', refreshData.user.name);
    } else {
      const errorData = await refreshResponse.json();
      console.log('❌ Falha no refresh:', errorData.message);
    }

  } catch (error) {
    console.log('❌ Erro durante teste de refresh:', error.message);
  }
}

async function testCookiePersistence() {
  console.log('\n🧪 TESTE ESPECÍFICO: Persistência de cookies\n');

  try {
    // Criar usuário
    const timestamp = Date.now();
    const userData = {
      name: 'Teste Cookies',
      email: `cookies_${timestamp}@carshare.com`,
      password: 'TesteCookies@123',
      phone: '11999888779'
    };

    await apiRequest('POST', '/api/auth/register', userData);
    await sleep(1000);

    // Login
    globalCookies = '';
    await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    const savedCookies = globalCookies;
    console.log('🍪 Cookies salvos:', savedCookies ? 'Sim' : 'Não');

    await sleep(1000);

    // Simular nova sessão (limpar cookies globais)
    globalCookies = '';

    // Usar cookies salvos em nova "sessão"
    console.log('🔄 Testando cookies em nova sessão...');
    const sessionResponse = await apiRequest('GET', '/api/auth/user', null, savedCookies);

    if (sessionResponse.status === 200) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Cookies persistiram entre sessões:', sessionData.name);
    } else {
      console.log('❌ Cookies não persistiram entre sessões');
    }

  } catch (error) {
    console.log('❌ Erro durante teste de cookies:', error.message);
  }
}

async function runFocusedTests() {
  console.log('🚀 INICIANDO TESTES FOCADOS DE AUTENTICAÇÃO');
  console.log('===========================================\n');

  const startTime = Date.now();

  await testAuthenticationFlow();
  await sleep(2000); // Pausa entre testes para evitar rate limiting
  
  await testTokenRefresh();
  await sleep(2000);
  
  await testCookiePersistence();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️ Testes concluídos em ${duration}s`);
  console.log('\n📋 RESUMO:');
  console.log('- Sistema de autenticação testado com delays apropriados');
  console.log('- Rate limiting foi considerado nos testes');
  console.log('- Foco em cenários críticos de produção');
}

runFocusedTests().catch(console.error);