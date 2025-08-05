#!/usr/bin/env node

/**
 * Script de teste para verificar problema de cache de autenticação
 */

import { execSync } from 'child_process';

console.log('🧪 Teste de Cache de Autenticação\n');

const baseUrl = 'http://localhost:5000';

// Função para fazer requisições e testar cache
async function testAuthCache() {
  console.log('1. Testando acesso não autenticado...');
  
  try {
    const response1 = await fetch(`${baseUrl}/api/auth/user`, {
      credentials: 'include'
    });
    console.log(`   Status: ${response1.status}`);
    console.log(`   Headers: Cache-Control = ${response1.headers.get('cache-control')}`);
    
    const response2 = await fetch(`${baseUrl}/api/auth/user?_t=${Date.now()}`, {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.log(`   Status com cache bypass: ${response2.status}`);
    
  } catch (error) {
    console.log(`   Erro: ${error.message}`);
  }

  console.log('\n2. Testando endpoint de health...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('   Health check:', healthData.status);
  } catch (error) {
    console.log(`   Erro health: ${error.message}`);
  }

  console.log('\n3. Testando endpoint de veículos...');
  try {
    const vehiclesResponse = await fetch(`${baseUrl}/api/vehicles`);
    console.log(`   Veículos status: ${vehiclesResponse.status}`);
    console.log(`   Vehicles cache headers: ${vehiclesResponse.headers.get('cache-control')}`);
  } catch (error) {
    console.log(`   Erro veículos: ${error.message}`);
  }
}

// Executar teste
testAuthCache().then(() => {
  console.log('\n✅ Teste de cache concluído');
}).catch(error => {
  console.log('\n❌ Erro no teste:', error.message);
});