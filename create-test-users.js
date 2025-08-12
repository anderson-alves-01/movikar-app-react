import fetch from 'node-fetch';

async function createTestUsers() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🚀 Criando usuários de teste para validação do fluxo de vistoria...\n');

  try {
    // 1. Criar usuário proprietário (renter1@test.com)
    console.log('1. Criando proprietário de veículo...');
    const ownerData = {
      name: 'Maria Proprietária',
      email: 'owner@test.com', 
      password: '123456',
      phone: '11999999999',
      acceptedTerms: true
    };

    const ownerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ownerData)
    });

    if (ownerResponse.status === 201) {
      console.log('✅ Proprietário criado: owner@test.com / 123456');
    } else {
      const error = await ownerResponse.text();
      console.log('ℹ️  Proprietário já existe ou erro:', error);
    }

    // 2. Criar usuário locatário (renter@test.com)
    console.log('\n2. Criando locatário...');
    const renterData = {
      name: 'João Locatário', 
      email: 'renter@test.com',
      password: '123456',
      phone: '11888888888',
      acceptedTerms: true
    };

    const renterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(renterData)
    });

    if (renterResponse.status === 201) {
      console.log('✅ Locatário criado: renter@test.com / 123456');
    } else {
      const error = await renterResponse.text();
      console.log('ℹ️  Locatário já existe ou erro:', error);
    }

    console.log('\n✅ USUÁRIOS DE TESTE PRONTOS:');
    console.log('👤 Proprietário: owner@test.com / 123456');  
    console.log('👤 Locatário: renter@test.com / 123456');
    console.log('\n🎯 Agora você pode:');
    console.log('1. Login como owner@test.com para cadastrar um veículo');
    console.log('2. Login como renter@test.com para alugar e testar o fluxo de vistoria');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTestUsers();