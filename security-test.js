
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';

async function testSecurityVulnerabilities() {
  console.log('🔒 TESTANDO VULNERABILIDADES DE SEGURANÇA\n');

  // Test 1: SQL Injection Protection
  console.log('1. Testando proteção contra SQL Injection...');
  try {
    const maliciousPayload = {
      email: "' OR 1=1 --",
      password: "x"
    };

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousPayload),
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   ✅ SQL Injection: ${response.status === 400 || response.status === 401 ? 'BLOQUEADO' : 'VULNERÁVEL'}`);
  } catch (error) {
    console.log('   ❌ Erro no teste SQL Injection:', error.message);
  }

  // Test 2: XSS Protection
  console.log('\n2. Testando proteção contra XSS...');
  try {
    const xssPayload = {
      name: '<script>alert("XSS")</script>',
      email: 'test@example.com',
      password: 'Password123'
    };

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xssPayload),
    });

    const data = await response.json();
    const hasScript = JSON.stringify(data).includes('<script>');
    console.log(`   ✅ XSS Protection: ${!hasScript ? 'PROTEGIDO' : 'VULNERÁVEL'}`);
  } catch (error) {
    console.log('   ❌ Erro no teste XSS:', error.message);
  }

  // Test 3: Rate Limiting
  console.log('\n3. Testando Rate Limiting...');
  try {
    const requests = [];
    for (let i = 0; i < 12; i++) {
      requests.push(
        fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    console.log(`   ✅ Rate Limiting: ${rateLimited ? 'ATIVO' : 'INATIVO'}`);
  } catch (error) {
    console.log('   ❌ Erro no teste Rate Limiting:', error.message);
  }

  // Test 4: Input Validation
  console.log('\n4. Testando validação de entrada...');
  try {
    const invalidData = {
      name: '', // Too short
      email: 'invalid-email',
      password: '123' // Too weak
    };

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    console.log(`   ✅ Input Validation: ${response.status === 400 ? 'ATIVO' : 'INATIVO'}`);
  } catch (error) {
    console.log('   ❌ Erro no teste Input Validation:', error.message);
  }

  // Test 5: Security Headers
  console.log('\n5. Testando Security Headers...');
  try {
    const response = await fetch(`${BASE_URL}/`);
    const headers = response.headers;
    
    const hasCSP = headers.get('content-security-policy');
    const hasHSTS = headers.get('strict-transport-security');
    const hasXFrame = headers.get('x-frame-options');
    
    console.log(`   ✅ CSP Header: ${hasCSP ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`   ✅ HSTS Header: ${hasHSTS ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`   ✅ X-Frame-Options: ${hasXFrame ? 'PRESENTE' : 'AUSENTE'}`);
  } catch (error) {
    console.log('   ❌ Erro no teste Security Headers:', error.message);
  }

  console.log('\n🔒 TESTE DE SEGURANÇA CONCLUÍDO');
}

testSecurityVulnerabilities();
