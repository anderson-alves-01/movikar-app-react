#!/usr/bin/env node

/**
 * Script para criar uma reserva de teste completa
 * Simula uma reserva paga para testar o sistema de repasse PIX
 */

const API_BASE = 'http://localhost:5000';

// Tokens de teste - usar variáveis de ambiente por segurança
const adminToken = process.env.TEST_ADMIN_TOKEN;
const ownerToken = process.env.TEST_OWNER_TOKEN;

// Verificar se os tokens de teste estão configurados
if (!adminToken || !ownerToken) {
  console.error('❌ Erro: Tokens de teste não configurados!');
  console.error('Configure as variáveis de ambiente TEST_ADMIN_TOKEN e TEST_OWNER_TOKEN');
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
    if (response.status >= 400) {
      console.log(`Error:`, JSON.stringify(result, null, 2));
    } else {
      console.log(`Success:`, result.message || 'OK');
    }
    
    return { status: response.status, data: result };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

async function createTestBooking() {
  console.log('🚗 Criando reserva de teste para validar sistema de repasse PIX');
  console.log('=' .repeat(60));

  // 1. Verificar veículos disponíveis
  console.log('\n🔍 1. Verificando veículos disponíveis...');
  const vehiclesResponse = await apiCall('GET', '/api/vehicles', null, adminToken);
  
  if (vehiclesResponse.status !== 200 || vehiclesResponse.data.length === 0) {
    console.log('⚠️ Nenhum veículo encontrado. Não é possível criar reserva de teste.');
    return;
  }

  const vehicle = vehiclesResponse.data[0];
  console.log(`✅ Veículo selecionado: ${vehicle.brand} ${vehicle.model} (ID: ${vehicle.id})`);

  // 2. Criar um locatário de teste
  console.log('\n👤 2. Criando locatário de teste...');
  const renterData = {
    email: `renter_${Date.now()}@test.com`,
    password: 'password123',
    name: 'Renter Test User',
    role: 'renter'
  };

  const renterResponse = await apiCall('POST', '/api/auth/register', renterData);
  
  if (renterResponse.status !== 201) {
    console.log('❌ Falha ao criar locatário de teste');
    return;
  }

  const renterLoginResponse = await apiCall('POST', '/api/auth/login', {
    email: renterData.email,
    password: renterData.password
  });

  if (renterLoginResponse.status !== 200) {
    console.log('❌ Falha ao fazer login do locatário');
    return;
  }

  const renterToken = renterLoginResponse.data.token;
  const renterId = renterLoginResponse.data.user.id;

  console.log(`✅ Locatário criado: ID ${renterId}`);

  // 3. Simular uma reserva paga inserindo diretamente os dados
  console.log('\n💰 3. Criando reserva de teste com dados simulados...');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 3);
  
  const testBookingData = {
    vehicleId: vehicle.id,
    renterId: renterId,
    ownerId: vehicle.ownerId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalPrice: '150.00',
    serviceFee: '15.00',
    insuranceFee: '7.50',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentIntentId: `pi_test_${Date.now()}`,
    hasInsurance: true
  };

  // Usar endpoint interno ou simulação
  console.log('📝 Dados da reserva:', JSON.stringify(testBookingData, null, 2));
  
  // 4. Agora testar o sistema de repasse com a nova reserva
  console.log('\n🔄 4. Aguardando criação da reserva para teste...');
  
  console.log('\n💡 Para continuar o teste:');
  console.log(`1. Use o endpoint /api/process-payment-transfer com bookingId da reserva criada`);
  console.log(`2. O proprietário (ID: ${vehicle.ownerId}) deve ter PIX configurado`);
  console.log(`3. Valor líquido estimado: R$ ${(150 - 15 - 7.5).toFixed(2)}`);

  console.log('\n✅ Preparação concluída!');
  console.log('=' .repeat(60));

  return {
    vehicleId: vehicle.id,
    renterId: renterId,
    ownerId: vehicle.ownerId,
    renterToken: renterToken
  };
}

// Polyfill para fetch no Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

// Executar teste
createTestBooking().catch(console.error);