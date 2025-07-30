#!/usr/bin/env node

/**
 * Testes de Integração Abrangentes - Sistema de Autenticação CarShare
 * Testa todos os cenários possíveis de autenticação e fluxos críticos
 */

const baseUrl = 'http://localhost:5000';
let testResults = [];
let globalCookies = '';

// Utilitários para gerenciamento de cookies
function parseCookies(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

// Função para fazer requisições com cookies
async function apiRequest(method, endpoint, data = null, cookies = null) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (cookies) {
    options.headers['Cookie'] = cookies;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, options);
  
  // Atualizar cookies se houver set-cookie na resposta
  const setCookieHeaders = response.headers.get('set-cookie');
  if (setCookieHeaders) {
    globalCookies = parseCookies(setCookieHeaders);
  }

  return response;
}

// Função para registrar resultados dos testes
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   ${details}`);
  
  testResults.push({
    test: testName,
    passed,
    details
  });
}

// Teste 1: Registro de usuário com dados válidos
async function testValidUserRegistration() {
  console.log('\n🧪 TESTE 1: Registro de usuário válido');
  
  try {
    const userData = {
      name: 'João Silva',
      email: `teste_${Date.now()}@carshare.com`,
      password: 'MinhaSenh@123',
      phone: '11987654321'
    };

    const response = await apiRequest('POST', '/api/auth/register', userData);
    const data = await response.json();

    if (response.status === 201 && data.user && data.user.email === userData.email) {
      logTest('Registro de usuário válido', true, `Usuário ${data.user.name} criado com sucesso`);
      return data.user;
    } else {
      logTest('Registro de usuário válido', false, `Status: ${response.status}, Response: ${JSON.stringify(data)}`);
      return null;
    }
  } catch (error) {
    logTest('Registro de usuário válido', false, `Erro: ${error.message}`);
    return null;
  }
}

// Teste 2: Registro com dados inválidos
async function testInvalidUserRegistration() {
  console.log('\n🧪 TESTE 2: Registro com dados inválidos');
  
  const invalidCases = [
    { name: '', email: 'test@test.com', password: 'Test123!', phone: '11999999999', expectedError: 'nome' },
    { name: 'Test User', email: 'invalid-email', password: 'Test123!', phone: '11999999999', expectedError: 'email' },
    { name: 'Test User', email: 'test@test.com', password: '123', phone: '11999999999', expectedError: 'senha' },
    { name: 'Test User', email: 'test@test.com', password: 'Test123!', phone: '123', expectedError: 'telefone' }
  ];

  for (const testCase of invalidCases) {
    try {
      const response = await apiRequest('POST', '/api/auth/register', testCase);
      const data = await response.json();

      if (response.status >= 400) {
        logTest(`Validação de ${testCase.expectedError}`, true, `Erro adequadamente rejeitado: ${data.message}`);
      } else {
        logTest(`Validação de ${testCase.expectedError}`, false, 'Dados inválidos foram aceitos');
      }
    } catch (error) {
      logTest(`Validação de ${testCase.expectedError}`, false, `Erro inesperado: ${error.message}`);
    }
  }
}

// Teste 3: Login com credenciais válidas
async function testValidLogin() {
  console.log('\n🧪 TESTE 3: Login com credenciais válidas');
  
  try {
    // Primeiro, criar um usuário para login
    const userData = {
      name: 'Maria Santos',
      email: `login_test_${Date.now()}@carshare.com`,
      password: 'LoginTest@123',
      phone: '11987654322'
    };

    const registerResponse = await apiRequest('POST', '/api/auth/register', userData);
    if (registerResponse.status !== 201) {
      logTest('Preparação para login', false, 'Falha ao criar usuário de teste');
      return null;
    }

    // Limpar cookies antes do login
    globalCookies = '';

    // Fazer login
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    const loginData = await loginResponse.json();

    if (loginResponse.status === 200 && loginData.user && globalCookies.includes('token=')) {
      logTest('Login com credenciais válidas', true, `Login bem-sucedido para ${loginData.user.name}, cookies definidos`);
      return loginData.user;
    } else {
      logTest('Login com credenciais válidas', false, `Status: ${loginResponse.status}, Cookies: ${globalCookies}`);
      return null;
    }
  } catch (error) {
    logTest('Login com credenciais válidas', false, `Erro: ${error.message}`);
    return null;
  }
}

// Teste 4: Login com credenciais inválidas
async function testInvalidLogin() {
  console.log('\n🧪 TESTE 4: Login com credenciais inválidas');
  
  const invalidLogins = [
    { email: 'inexistente@carshare.com', password: 'Qualquer123!' },
    { email: 'teste2@carshare.com', password: 'SenhaErrada123!' }
  ];

  for (const credentials of invalidLogins) {
    try {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      const data = await response.json();

      if (response.status === 401) {
        logTest(`Login inválido (${credentials.email})`, true, 'Credenciais rejeitadas adequadamente');
      } else {
        logTest(`Login inválido (${credentials.email})`, false, `Status inesperado: ${response.status}`);
      }
    } catch (error) {
      logTest(`Login inválido (${credentials.email})`, false, `Erro: ${error.message}`);
    }
  }
}

// Teste 5: Verificação de autenticação com token válido
async function testAuthenticatedRequest() {
  console.log('\n🧪 TESTE 5: Requisição autenticada com token válido');
  
  try {
    // Usar cookies globais do login anterior
    const response = await apiRequest('GET', '/api/auth/user', null, globalCookies);
    const data = await response.json();

    if (response.status === 200 && data.name) {
      logTest('Requisição autenticada', true, `Usuário autenticado: ${data.name}`);
      return true;
    } else {
      logTest('Requisição autenticada', false, `Status: ${response.status}, Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Requisição autenticada', false, `Erro: ${error.message}`);
    return false;
  }
}

// Teste 6: Requisição sem token
async function testUnauthenticatedRequest() {
  console.log('\n🧪 TESTE 6: Requisição sem token de autenticação');
  
  try {
    const response = await apiRequest('GET', '/api/auth/user', null, '');
    const data = await response.json();

    if (response.status === 401) {
      logTest('Requisição não autenticada', true, 'Acesso negado adequadamente');
      return true;
    } else {
      logTest('Requisição não autenticada', false, `Status inesperado: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Requisição não autenticada', false, `Erro: ${error.message}`);
    return false;
  }
}

// Teste 7: Refresh de token
async function testTokenRefresh() {
  console.log('\n🧪 TESTE 7: Refresh de token');
  
  try {
    const response = await apiRequest('POST', '/api/auth/refresh', null, globalCookies);
    const data = await response.json();

    if (response.status === 200 && data.user) {
      logTest('Refresh de token', true, `Token atualizado para ${data.user.name}`);
      return true;
    } else {
      logTest('Refresh de token', false, `Status: ${response.status}, Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Refresh de token', false, `Erro: ${error.message}`);
    return false;
  }
}

// Teste 8: Logout
async function testLogout() {
  console.log('\n🧪 TESTE 8: Logout');
  
  try {
    const response = await apiRequest('POST', '/api/auth/logout', null, globalCookies);
    const data = await response.json();

    if (response.status === 200) {
      logTest('Logout', true, 'Logout realizado com sucesso');
      
      // Verificar se os cookies foram limpos testando uma requisição autenticada
      const authTestResponse = await apiRequest('GET', '/api/auth/user', null, globalCookies);
      
      if (authTestResponse.status === 401) {
        logTest('Limpeza de cookies após logout', true, 'Cookies removidos corretamente');
      } else {
        logTest('Limpeza de cookies após logout', false, 'Cookies não foram removidos');
      }
      
      return true;
    } else {
      logTest('Logout', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Logout', false, `Erro: ${error.message}`);
    return false;
  }
}

// Teste 9: Rate Limiting
async function testRateLimiting() {
  console.log('\n🧪 TESTE 9: Rate Limiting de autenticação');
  
  try {
    const promises = [];
    
    // Fazer 12 tentativas simultâneas de login (limite é 10)
    for (let i = 0; i < 12; i++) {
      promises.push(
        apiRequest('POST', '/api/auth/login', {
          email: 'inexistente@test.com',
          password: 'Qualquer123!'
        })
      );
    }

    const responses = await Promise.all(promises);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;

    if (rateLimitedCount > 0) {
      logTest('Rate Limiting', true, `${rateLimitedCount} requisições bloqueadas por rate limit`);
    } else {
      logTest('Rate Limiting', false, 'Nenhuma requisição foi bloqueada por rate limit');
    }
  } catch (error) {
    logTest('Rate Limiting', false, `Erro: ${error.message}`);
  }
}

// Teste 10: Fluxo completo de assinatura (sem loops)
async function testSubscriptionFlow() {
  console.log('\n🧪 TESTE 10: Fluxo completo de assinatura');
  
  try {
    // Criar usuário e fazer login
    const userData = {
      name: 'Pedro Assinatura',
      email: `subscription_${Date.now()}@carshare.com`,
      password: 'Assinatura@123',
      phone: '11987654323'
    };

    // Registrar
    const registerResponse = await apiRequest('POST', '/api/auth/register', userData);
    if (registerResponse.status !== 201) {
      logTest('Fluxo de assinatura - Registro', false, 'Falha no registro');
      return;
    }

    // Login
    globalCookies = '';
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      logTest('Fluxo de assinatura - Login', false, 'Falha no login');
      return;
    }

    logTest('Fluxo de assinatura - Login', true, 'Login bem-sucedido');

    // Tentar múltiplas requisições autenticadas (simular navegação)
    const endpoints = [
      '/api/auth/user',
      '/api/profile',
      '/api/messages/unread-count'
    ];

    let allSuccessful = true;
    for (const endpoint of endpoints) {
      const response = await apiRequest('GET', endpoint, null, globalCookies);
      if (response.status === 401) {
        allSuccessful = false;
        logTest(`Navegação autenticada - ${endpoint}`, false, 'Loop 401 detectado');
      }
    }

    if (allSuccessful) {
      logTest('Navegação autenticada sem loops', true, 'Todas as requisições mantiveram autenticação');
    }

  } catch (error) {
    logTest('Fluxo de assinatura', false, `Erro: ${error.message}`);
  }
}

// Teste 11: Persistência de sessão
async function testSessionPersistence() {
  console.log('\n🧪 TESTE 11: Persistência de sessão');
  
  try {
    // Criar usuário
    const userData = {
      name: 'Ana Sessão',
      email: `session_${Date.now()}@carshare.com`,
      password: 'Sessao@123',
      phone: '11987654324'
    };

    await apiRequest('POST', '/api/auth/register', userData);
    
    // Login
    globalCookies = '';
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.status !== 200) {
      logTest('Persistência de sessão', false, 'Falha no login inicial');
      return;
    }

    const savedCookies = globalCookies;

    // Simular nova sessão (limpar cookies globais)
    globalCookies = '';

    // Tentar usar cookies salvos
    const sessionResponse = await apiRequest('GET', '/api/auth/user', null, savedCookies);
    
    if (sessionResponse.status === 200) {
      logTest('Persistência de sessão', true, 'Sessão persistiu com cookies salvos');
    } else {
      logTest('Persistência de sessão', false, `Status: ${sessionResponse.status}`);
    }

  } catch (error) {
    logTest('Persistência de sessão', false, `Erro: ${error.message}`);
  }
}

// Função principal para executar todos os testes
async function runAllTests() {
  console.log('🚀 INICIANDO TESTES DE INTEGRAÇÃO ABRANGENTES');
  console.log('================================================\n');
  
  const startTime = Date.now();

  // Executar todos os testes
  await testValidUserRegistration();
  await testInvalidUserRegistration();
  await testValidLogin();
  await testInvalidLogin();
  await testAuthenticatedRequest();
  await testUnauthenticatedRequest();
  await testTokenRefresh();
  await testLogout();
  await testRateLimiting();
  await testSubscriptionFlow();
  await testSessionPersistence();

  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL DE TESTES');
  console.log('===============================');
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  console.log(`Total de testes: ${totalTests}`);
  console.log(`Testes aprovados: ${passedTests}`);
  console.log(`Testes falharam: ${failedTests}`);
  console.log(`Taxa de sucesso: ${successRate}%`);
  console.log(`Tempo de execução: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

  if (failedTests > 0) {
    console.log('\n❌ TESTES QUE FALHARAM:');
    testResults.filter(t => !t.passed).forEach(test => {
      console.log(`- ${test.test}: ${test.details}`);
    });
  }

  console.log('\n✅ RESUMO DE PROBLEMAS IDENTIFICADOS:');
  
  // Analisar logs para problemas comuns
  if (failedTests === 0) {
    console.log('- Sistema de autenticação funcionando perfeitamente');
    console.log('- Não há loops de autenticação detectados');
    console.log('- Configurações de cookies estão corretas');
    console.log('- Rate limiting está funcionando');
  } else {
    console.log('- Verificar configurações de cookies e middleware');
    console.log('- Possíveis problemas de CORS ou configuração de proxy');
    console.log('- Validar endpoints e handlers de erro');
  }
}

// Executar testes
runAllTests().catch(console.error);