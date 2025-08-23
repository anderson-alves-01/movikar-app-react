#!/usr/bin/env node

/**
 * Script para testar o sistema completo de repasse PIX
 * Simula o fluxo completo: reserva, pagamento, vistoria e repasse
 */

const API_BASE = 'http://localhost:5000';

// Security Note: Use environment variables for tokens in production
const ownerToken = process.env.TEST_OWNER_TOKEN;
const adminToken = process.env.TEST_ADMIN_TOKEN;

// Verify test tokens are configured
if (!ownerToken || !adminToken) {
  console.error('❌ Error: Test tokens not configured!');
  console.error('Set TEST_OWNER_TOKEN and TEST_ADMIN_TOKEN environment variables');
  process.exit(1);
}

async function apiCall(method, endpoint, data = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function testPayoutSystem() {
  console.log('🚀 Iniciando teste completo do sistema de repasse PIX');
  console.log('=' .repeat(60));

  // 1. Verificar estatísticas iniciais
  console.log('\n📊 1. Verificando estatísticas iniciais de repasse...');
  await apiCall('GET', '/api/admin/payout-stats', null, adminToken);

  // 2. Verificar reservas existentes
  console.log('\n📋 2. Verificando reservas existentes...');
  const bookingsResponse = await apiCall('GET', '/api/bookings', null, adminToken);
  
  if (bookingsResponse.status === 200 && bookingsResponse.data.length > 0) {
    const booking = bookingsResponse.data[0];
    console.log(`\n🎯 Usando reserva de teste: ID ${booking.id}`);
    
    // 3. Testar endpoint de repasse PIX diretamente
    console.log('\n💰 3. Testando repasse PIX direto...');
    await apiCall('POST', '/api/process-payment-transfer', {
      bookingId: booking.id,
      paymentIntentId: 'pi_test_' + Date.now()
    }, adminToken);
    
    // 4. Testar trigger manual de repasse
    console.log('\n🔄 4. Testando trigger manual de repasse...');
    await apiCall('POST', `/api/admin/trigger-payout/${booking.id}`, {}, adminToken);
    
    // 5. Verificar estatísticas finais
    console.log('\n📈 5. Verificando estatísticas finais...');
    await apiCall('GET', '/api/admin/payout-stats', null, adminToken);
    
  } else {
    console.log('\n⚠️ Nenhuma reserva encontrada. Criando dados de teste...');
    
    // Criar dados de teste mínimos
    console.log('\n🧪 Testando serviço PIX isoladamente...');
    
    // Testar validação de dados
    await apiCall('POST', '/api/process-payment-transfer', {
      bookingId: 999999, // ID inexistente
      paymentIntentId: 'pi_test_validation'
    }, adminToken);
  }

  console.log('\n✅ Teste do sistema de repasse PIX finalizado!');
  console.log('=' .repeat(60));
}

// Polyfill para fetch no Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

// Executar teste
testPayoutSystem().catch(console.error);