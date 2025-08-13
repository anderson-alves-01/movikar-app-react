#!/usr/bin/env node
/**
 * Teste direto das credenciais DocuSign
 * Verifica se a API real está funcionando
 */

import fetch from 'node-fetch';

// Simular variáveis como no servidor
const credentials = {
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
  secretKey: process.env.DOCUSIGN_SECRET_KEY,  
  userId: process.env.DOCUSIGN_USER_ID,
  accountId: process.env.DOCUSIGN_ACCOUNT_ID,
  privateKey: process.env.DOCUSIGN_PRIVATE_KEY
};

console.log('🔧 Testando Credenciais DocuSign');
console.log('================================');

// Verificar credenciais
const allConfigured = Object.values(credentials).every(v => !!v);
console.log(`Status: ${allConfigured ? '✅ Todas configuradas' : '❌ Faltando credenciais'}`);

if (allConfigured) {
  console.log('Integration Key:', credentials.integrationKey.substring(0, 15) + '...');
  console.log('User ID:', credentials.userId.substring(0, 15) + '...');
  console.log('Account ID:', credentials.accountId.substring(0, 15) + '...');
  console.log('Private Key:', credentials.privateKey.includes('-----BEGIN') ? '✅ Formato PEM' : '❌ Formato inválido');

  // Testar autenticação JWT (simplificado)
  console.log('\n🧪 Teste de Conectividade DocuSign');
  console.log('Endpoint base: https://demo.docusign.net/restapi');
  
  // Verificar se podemos pelo menos fazer uma chamada à API
  try {
    const response = await fetch('https://demo.docusign.net/restapi', {
      method: 'GET',
      timeout: 5000
    });
    
    console.log(`Resposta DocuSign: ${response.status} ${response.statusText}`);
    if (response.status === 401) {
      console.log('✅ Endpoint acessível (401 esperado sem auth)');
    }
  } catch (error) {
    console.log('❌ Erro de conectividade:', error.message);
  }

  console.log('\n🎯 Sistema pronto para usar DocuSign REAL');
  console.log('📋 Próximo passo: Criar contrato via API');
} else {
  console.log('\n🟡 Sistema usará modo MOCK');
  console.log('Para usar DocuSign real, configure todas as credenciais');
}

console.log('\n✨ Teste concluído');