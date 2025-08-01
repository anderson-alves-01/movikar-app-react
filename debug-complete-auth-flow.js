#!/usr/bin/env node

/**
 * Teste completo do fluxo de autenticação e assinatura
 */

const fetch = require('node-fetch');

async function testCompleteFlow() {
  console.log('🧪 Testando fluxo completo de autenticação e assinatura...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.auth@carshare.com',
        password: 'Senha123'
      })
    });

    console.log(`   Status: ${loginResponse.status}`);
    
    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log(`   Cookies: ${cookies ? 'Recebidos' : 'Não recebidos'}`);
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log(`❌ Login falhou: ${error.message}`);
      return;
    }

    const loginData = await loginResponse.json();
    console.log(`✅ Login realizado: ${loginData.user.name} (${loginData.user.email})`);
    
    // Parse cookies for next requests
    const cookieHeader = cookies ? cookies.split(',').map(c => c.split(';')[0]).join('; ') : '';
    console.log(`   Cookie header para próximas requisições: ${cookieHeader.substring(0, 50)}...`);

    // 2. Verificar autenticação
    console.log('\n2️⃣ Verificando autenticação...');
    const authResponse = await fetch('http://localhost:5000/api/auth/user', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      }
    });

    console.log(`   Status: ${authResponse.status}`);
    
    if (!authResponse.ok) {
      const error = await authResponse.json();
      console.log(`❌ Verificação falhou: ${error.message}`);
      return;
    }

    const authData = await authResponse.json();
    console.log(`✅ Autenticação confirmada: ${authData.name} (${authData.email})`);

    // 3. Criar assinatura
    console.log('\n3️⃣ Criando assinatura...');
    const subscriptionResponse = await fetch('http://localhost:5000/api/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        planName: 'essencial',
        paymentMethod: 'monthly',
        vehicleCount: 5
      })
    });

    console.log(`   Status: ${subscriptionResponse.status}`);
    
    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json();
      console.log(`❌ Assinatura falhou: ${error.message}`);
      return;
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log(`✅ Assinatura criada com sucesso!`);
    console.log(`   - Plan: ${subscriptionData.planName}`);
    console.log(`   - Payment Method: ${subscriptionData.paymentMethod}`);
    console.log(`   - Amount: R$ ${(subscriptionData.amount / 100).toFixed(2)}`);
    console.log(`   - Client Secret: ${subscriptionData.clientSecret ? 'Presente' : 'Ausente'}`);

    // 4. Simular checkout URL
    console.log('\n4️⃣ URL de checkout que seria gerada:');
    const checkoutUrl = `/subscription-checkout?clientSecret=${subscriptionData.clientSecret}&planName=${subscriptionData.planName}&paymentMethod=${subscriptionData.paymentMethod}&amount=${subscriptionData.amount}`;
    console.log(`   ${checkoutUrl}`);

    console.log('\n🎉 FLUXO COMPLETO FUNCIONANDO PERFEITAMENTE!');
    console.log('\n📋 Próximos passos para o usuário:');
    console.log('   1. Fazer login no frontend em /auth');
    console.log('   2. Clicar em "Assinar Agora" em qualquer plano');
    console.log('   3. Será redirecionado para o checkout automaticamente');

  } catch (error) {
    console.log(`❌ Erro durante o teste: ${error.message}`);
  }
}

testCompleteFlow();