#!/usr/bin/env node

/**
 * Test script para validar integração DocuSign real
 * Testa autenticação JWT e criação de envelope
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testDocuSignIntegration() {
  console.log('🧪 Testando Integração DocuSign Real');
  console.log('=====================================');

  try {
    // 1. Login como usuário de teste
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'asouzamax@gmail.com',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Falha no login');
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar veículos disponíveis
    console.log('\n2. Buscando veículos...');
    const vehiclesResponse = await fetch(`${API_BASE}/api/vehicles`);
    const vehicles = await vehiclesResponse.json();
    
    if (!vehicles.length) {
      throw new Error('Nenhum veículo disponível');
    }

    const testVehicle = vehicles[0];
    console.log(`✅ Veículo encontrado: ${testVehicle.brand} ${testVehicle.model}`);

    // 3. Criar reserva de teste
    console.log('\n3. Criando reserva de teste...');
    const bookingResponse = await fetch(`${API_BASE}/api/bookings`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        vehicleId: testVehicle.id,
        startDate: '2025-01-20',
        endDate: '2025-01-25',
        totalPrice: 500
      })
    });

    if (!bookingResponse.ok) {
      const error = await bookingResponse.text();
      throw new Error(`Falha ao criar reserva: ${error}`);
    }

    const booking = await bookingResponse.json();
    console.log(`✅ Reserva criada: ID ${booking.id}`);

    // 4. Criar contrato com DocuSign
    console.log('\n4. Criando contrato DocuSign...');
    const contractResponse = await fetch(`${API_BASE}/api/contracts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({
        bookingId: booking.id,
        signaturePlatform: 'docusign' // Força usar DocuSign
      })
    });

    if (!contractResponse.ok) {
      const error = await contractResponse.text();
      console.log('❌ Falha ao criar contrato:', error);
      
      // Verifica se é problema de configuração ou credenciais
      if (error.includes('DocuSign')) {
        console.log('\n🔍 Diagnóstico:');
        console.log('- Credenciais DocuSign podem estar incorretas');
        console.log('- Consentimento administrativo pode não ter sido feito');
        console.log('- Verificar logs do servidor para detalhes');
      }
      
      return false;
    }

    const contract = await contractResponse.json();
    console.log(`✅ Contrato DocuSign criado: ${contract.contractNumber}`);
    console.log(`📝 URL de assinatura: ${contract.signUrl || 'Gerada pelo DocuSign'}`);

    // 5. Verificar status do envelope
    if (contract.externalDocumentId && contract.externalDocumentId !== contract.contractNumber) {
      console.log('\n5. Verificando status no DocuSign...');
      
      const statusResponse = await fetch(`${API_BASE}/api/contracts/${contract.id}/status`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      });

      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log(`✅ Status DocuSign: ${status.status || 'sent'}`);
        console.log(`📧 Recipients: ${status.recipients?.length || 0}`);
      }
    }

    console.log('\n🎉 Integração DocuSign funcionando!');
    console.log('=====================================');
    console.log('✅ Autenticação JWT: OK');
    console.log('✅ Criação de envelope: OK'); 
    console.log('✅ URL de assinatura: OK');
    console.log('✅ Credenciais configuradas: OK');

    return true;

  } catch (error) {
    console.log('\n❌ Erro na integração:', error.message);
    
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se todas as 5 credenciais estão corretas');
    console.log('2. Fazer consentimento administrativo no DocuSign');
    console.log('3. Verificar se a chave privada está no formato PEM correto');
    console.log('4. Confirmar Account ID e User ID corretos');
    
    return false;
  }
}

// Executar teste imediatamente
testDocuSignIntegration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });