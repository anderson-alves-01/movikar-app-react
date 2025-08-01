import fetch from 'node-fetch';

async function debugPaymentValues() {
  console.log('🔍 Debugando valores de pagamento da assinatura...\n');

  try {
    // 1. Login como admin
    console.log('1️⃣ Fazendo login como admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: 'admin@alugae.mobi',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Falha no login');
      return;
    }

    // Extrair cookies da resposta
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    const cookies = setCookieHeader ? setCookieHeader.split(',').map(c => c.split(';')[0]).join('; ') : '';
    console.log('✅ Login realizado');

    // 2. Verificar detalhes da assinatura atual
    console.log('\n2️⃣ Verificando detalhes da assinatura atual...');
    const detailsResponse = await fetch('http://localhost:5000/api/user/subscription/details', {
      headers: { 'Cookie': cookies }
    });

    if (detailsResponse.ok) {
      const details = await detailsResponse.json();
      console.log('📊 Detalhes da assinatura:');
      console.log(`   - Plano: ${details.planDisplayName}`);
      console.log(`   - Status: ${details.status}`);
      console.log(`   - Método: ${details.paymentMethod}`);
      console.log(`   - Valor pago: R$ ${details.paidAmount ? details.paidAmount.toFixed(2) : 'N/A'}`);
      console.log(`   - Veículos: ${details.vehicleCount}`);
      console.log(`   - Payment Intent: ${details.paymentIntentId || 'N/A'}`);
      console.log(`   - Metadados: ${JSON.stringify(details.paymentDetails, null, 2)}`);
    } else {
      console.log(`❌ Erro ao buscar detalhes: ${detailsResponse.status}`);
    }

    // 3. Teste criação de nova assinatura
    console.log('\n3️⃣ Testando criação de nova assinatura...');
    const createResponse = await fetch('http://localhost:5000/api/create-subscription', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        planName: 'essencial',
        paymentMethod: 'monthly',
        vehicleCount: 3
      })
    });

    if (createResponse.ok) {
      const subscriptionData = await createResponse.json();
      console.log('✅ Nova assinatura criada para teste:');
      console.log(`   - Plano: ${subscriptionData.planName}`);
      console.log(`   - Valor: R$ ${(subscriptionData.amount / 100).toFixed(2)}`);
      console.log(`   - Client Secret: ${subscriptionData.clientSecret ? 'Presente' : 'Ausente'}`);
      
      // Calcular valor esperado
      const basePrice = 29.90;
      const pricePerVehicle = 5.99;
      const expectedPrice = basePrice + (pricePerVehicle * Math.max(0, 3 - 2));
      console.log(`   - Valor esperado: R$ ${expectedPrice.toFixed(2)} (base R$ 29.90 + 1 veículo extra R$ 5.99)`);
      console.log(`   - Cálculo correto: ${Math.abs((subscriptionData.amount / 100) - expectedPrice) < 0.01 ? '✅' : '❌'}`);
    } else {
      const error = await createResponse.text();
      console.log(`❌ Erro ao criar assinatura: ${error}`);
    }

    // 4. Verificar configurações administrativas
    console.log('\n4️⃣ Verificando configurações administrativas...');
    const settingsResponse = await fetch('http://localhost:5000/api/admin/settings', {
      headers: { 'Cookie': cookies }
    });

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('⚙️ Configurações atuais:');
      console.log(`   - Preço Essencial: R$ ${settings.essentialPlanPrice}`);
      console.log(`   - Preço Plus: R$ ${settings.plusPlanPrice}`);
      console.log(`   - Desconto Anual: ${settings.annualDiscountPercentage}%`);
    }

    console.log('\n🎯 Investigação de valores concluída!');

  } catch (error) {
    console.error('❌ Erro durante debug:', error.message);
  }
}

// Executar o debug
debugPaymentValues().catch(console.error);