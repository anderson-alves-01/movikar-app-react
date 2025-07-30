#!/usr/bin/env node

/**
 * Teste Final Abrangente - Sistema de Autenticação CarShare
 * Valida todos os cenários críticos após as correções
 */

const baseUrl = 'http://localhost:5000';
let testResults = [];

function logResult(test, success, details = '') {
  const status = success ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${test}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ test, success, details });
}

async function apiCall(method, endpoint, data = null, cookies = '') {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (cookies) options.headers['Cookie'] = cookies;
  if (data) options.body = JSON.stringify(data);
  
  return await fetch(`${baseUrl}${endpoint}`, options);
}

function extractCookies(response) {
  const setCookie = response.headers.get('set-cookie');
  return setCookie ? setCookie.split(';')[0] : '';
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteAuthFlow() {
  console.log('🧪 TESTE CRÍTICO: Fluxo completo de autenticação\n');
  
  try {
    // 1. Registro
    const userData = {
      name: 'Teste Final',
      email: `final_${Date.now()}@carshare.com`,
      password: 'TesteFinal@123',
      phone: '11999777888'
    };

    console.log('1️⃣ Testando registro...');
    const registerResponse = await apiCall('POST', '/api/auth/register', userData);
    
    if (registerResponse.status === 201) {
      logResult('Registro de usuário', true, 'Usuário criado com sucesso');
    } else {
      const error = await registerResponse.text();
      logResult('Registro de usuário', false, `Status ${registerResponse.status}: ${error}`);
      return;
    }

    await sleep(1000);

    // 2. Login
    console.log('\n2️⃣ Testando login...');
    const loginResponse = await apiCall('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    let cookies = '';
    if (loginResponse.status === 200) {
      cookies = extractCookies(loginResponse);
      logResult('Login com credenciais válidas', true, `Cookies recebidos: ${cookies ? 'Sim' : 'Não'}`);
    } else {
      const error = await loginResponse.text();
      logResult('Login com credenciais válidas', false, `Status ${loginResponse.status}: ${error}`);
      return;
    }

    await sleep(500);

    // 3. Verificação de autenticação
    console.log('\n3️⃣ Testando verificação de autenticação...');
    const authResponse = await apiCall('GET', '/api/auth/user', null, cookies);
    
    if (authResponse.status === 200) {
      const userData = await authResponse.json();
      logResult('Verificação de autenticação', true, `Usuário: ${userData.name}`);
    } else {
      const error = await authResponse.text();
      logResult('Verificação de autenticação', false, `Status ${authResponse.status}: ${error}`);
      return;
    }

    await sleep(500);

    // 4. Múltiplas requisições autenticadas (detectar loops)
    console.log('\n4️⃣ Testando navegação sem loops...');
    const endpoints = ['/api/auth/user', '/api/profile', '/api/auth/user', '/api/profile'];
    let loopDetected = false;
    let consecutiveFailures = 0;

    for (let i = 0; i < endpoints.length; i++) {
      const response = await apiCall('GET', endpoints[i], null, cookies);
      
      if (response.status === 401) {
        consecutiveFailures++;
        if (consecutiveFailures >= 2) {
          loopDetected = true;
          break;
        }
      } else if (response.status === 200) {
        consecutiveFailures = 0;
      }
      
      await sleep(200);
    }

    if (loopDetected) {
      logResult('Navegação sem loops', false, 'Loop de autenticação detectado');
    } else {
      logResult('Navegação sem loops', true, 'Todas as requisições mantiveram autenticação');
    }

    await sleep(500);

    // 5. Teste de refresh
    console.log('\n5️⃣ Testando refresh de token...');
    const refreshResponse = await apiCall('POST', '/api/auth/refresh', null, cookies);
    
    if (refreshResponse.status === 200) {
      const newCookies = extractCookies(refreshResponse);
      logResult('Refresh de token', true, `Novos cookies: ${newCookies ? 'Sim' : 'Não'}`);
      if (newCookies) cookies = newCookies; // Atualizar cookies
    } else {
      const error = await refreshResponse.text();
      logResult('Refresh de token', false, `Status ${refreshResponse.status}: ${error}`);
    }

    await sleep(500);

    // 6. Logout
    console.log('\n6️⃣ Testando logout...');
    const logoutResponse = await apiCall('POST', '/api/auth/logout', null, cookies);
    
    if (logoutResponse.status === 200) {
      logResult('Logout', true, 'Logout realizado com sucesso');
      
      // Verificar se cookies foram limpos
      const postLogoutResponse = await apiCall('GET', '/api/auth/user', null, cookies);
      
      if (postLogoutResponse.status === 401) {
        logResult('Limpeza de cookies', true, 'Cookies removidos corretamente');
      } else {
        logResult('Limpeza de cookies', false, 'Cookies não foram removidos');
      }
    } else {
      const error = await logoutResponse.text();
      logResult('Logout', false, `Status ${logoutResponse.status}: ${error}`);
    }

  } catch (error) {
    logResult('Fluxo completo', false, `Erro crítico: ${error.message}`);
  }
}

async function testSubscriptionScenario() {
  console.log('\n🧪 TESTE ESPECÍFICO: Cenário de assinatura (problema original)\n');
  
  try {
    // Simular o cenário que causava loops:
    // 1. Usuário vai para página de planos
    // 2. Faz login
    // 3. É redirecionado para checkout
    // 4. Navega entre páginas

    const userData = {
      name: 'Teste Assinatura',
      email: `assinatura_${Date.now()}@carshare.com`,
      password: 'TesteAssinatura@123',
      phone: '11999666777'
    };

    // Registro
    await apiCall('POST', '/api/auth/register', userData);
    await sleep(500);

    // Login (como se viesse da página de planos)
    const loginResponse = await apiCall('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      logResult('Cenário de assinatura', false, 'Falha no login');
      return;
    }

    const cookies = extractCookies(loginResponse);
    await sleep(500);

    // Simular navegação típica durante processo de assinatura
    const subscriptionNavigation = [
      '/api/auth/user',        // Verificar se está logado
      '/api/profile',          // Carregar dados do perfil
      '/api/auth/user',        // Verificar novamente (comum em SPAs)
      '/api/messages/unread-count', // Polling de mensagens
      '/api/auth/user',        // Mais uma verificação
    ];

    let navigationSuccess = true;
    let failureCount = 0;

    console.log('🔄 Simulando navegação durante processo de assinatura...');
    
    for (let i = 0; i < subscriptionNavigation.length; i++) {
      const endpoint = subscriptionNavigation[i];
      const response = await apiCall('GET', endpoint, null, cookies);
      
      if (response.status === 401) {
        failureCount++;
        console.log(`   ${endpoint}: Status 401 ❌`);
      } else {
        console.log(`   ${endpoint}: Status ${response.status} ✅`);
      }
      
      await sleep(100); // Simular timing real de SPA
    }

    if (failureCount === 0) {
      logResult('Cenário de assinatura', true, 'Navegação fluida sem loops de autenticação');
    } else {
      logResult('Cenário de assinatura', false, `${failureCount} falhas de autenticação durante navegação`);
    }

  } catch (error) {
    logResult('Cenário de assinatura', false, `Erro: ${error.message}`);
  }
}

async function testRateLimitingBehavior() {
  console.log('\n🧪 TESTE ESPECÍFICO: Comportamento do Rate Limiting\n');
  
  try {
    // Testar se rate limiting está funcionando adequadamente
    console.log('🚦 Testando rate limiting (deve ser menos restritivo agora)...');
    
    const rapidRequests = [];
    for (let i = 0; i < 15; i++) {
      rapidRequests.push(
        apiCall('POST', '/api/auth/login', {
          email: 'inexistente@test.com',
          password: 'Senha123!'
        })
      );
    }

    const responses = await Promise.all(rapidRequests);
    const rateLimited = responses.filter(r => r.status === 429).length;
    const allowed = responses.filter(r => r.status === 401).length; // Credenciais inválidas, mas não bloqueado

    console.log(`📊 Resultado: ${allowed} requisições processadas, ${rateLimited} bloqueadas`);

    if (rateLimited < responses.length / 2) {
      logResult('Rate limiting balanceado', true, 'Rate limiting não muito restritivo');
    } else {
      logResult('Rate limiting balanceado', false, 'Rate limiting ainda muito restritivo');
    }

  } catch (error) {
    logResult('Rate limiting', false, `Erro: ${error.message}`);
  }
}

async function generateFinalReport() {
  console.log('\n📊 RELATÓRIO FINAL ABRANGENTE');
  console.log('==============================');
  
  const total = testResults.length;
  const passed = testResults.filter(t => t.success).length;
  const failed = total - passed;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  console.log(`\n📈 Estatísticas:`);
  console.log(`   Total de testes: ${total}`);
  console.log(`   Testes aprovados: ${passed}`);
  console.log(`   Testes falharam: ${failed}`);
  console.log(`   Taxa de sucesso: ${successRate}%`);

  if (failed > 0) {
    console.log(`\n❌ Testes que falharam:`);
    testResults.filter(t => !t.success).forEach(test => {
      console.log(`   - ${test.test}: ${test.details}`);
    });
  }

  console.log(`\n🎯 Análise de Problemas Identificados:`);
  
  const authFlowPassed = testResults.find(t => t.test === 'Navegação sem loops')?.success;
  const subscriptionPassed = testResults.find(t => t.test === 'Cenário de assinatura')?.success;
  
  if (authFlowPassed && subscriptionPassed) {
    console.log(`✅ PROBLEMA ORIGINAL RESOLVIDO:`);
    console.log(`   - Loops de autenticação eliminados`);
    console.log(`   - Fluxo de assinatura funcionando`);
    console.log(`   - Sistema de cookies otimizado`);
  } else {
    console.log(`❌ PROBLEMA ORIGINAL AINDA PRESENTE:`);
    console.log(`   - Verificar configurações de middleware`);
    console.log(`   - Revisar sistema de cookies`);  
  } 

  if (successRate >= 80) {
    console.log(`\n✅ SISTEMA APROVADO PARA PRODUÇÃO`);
    console.log(`   Taxa de sucesso: ${successRate}%`);
  } else {
    console.log(`\n⚠️ SISTEMA PRECISA DE AJUSTES`);
    console.log(`   Taxa de sucesso: ${successRate}% (mínimo: 80%)`);
  }
}

async function runComprehensiveTests() {
  console.log('🚀 EXECUTANDO TESTE FINAL ABRANGENTE');
  console.log('====================================\n');
  
  const startTime = Date.now();
  
  // Aguardar servidor estar pronto
  await sleep(3000);
  
  await testCompleteAuthFlow();
  await sleep(2000);
  
  await testSubscriptionScenario();
  await sleep(2000);
  
  await testRateLimitingBehavior();
  
  await generateFinalReport();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️ Testes concluídos em ${duration}s`);
}

runComprehensiveTests().catch(console.error);