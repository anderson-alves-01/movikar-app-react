// Teste simples para verificar DocuSign
import fetch from 'node-fetch';

console.log('🧪 Teste Direto DocuSign API');

// 1. Verificar se variáveis estão disponíveis
const credentials = {
  integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY,
  secretKey: process.env.DOCUSIGN_SECRET_KEY,
  userId: process.env.DOCUSIGN_USER_ID,
  accountId: process.env.DOCUSIGN_ACCOUNT_ID,
  privateKey: process.env.DOCUSIGN_PRIVATE_KEY
};

console.log('Credenciais DocuSign:');
Object.entries(credentials).forEach(([key, value]) => {
  console.log(`${key}: ${value ? '✅ Presente' : '❌ Ausente'}`);
});

const allPresent = Object.values(credentials).every(v => v);
console.log(`\nTodas as credenciais: ${allPresent ? '✅ Configuradas' : '❌ Faltando'}`);

if (allPresent) {
  console.log('\n🎉 DocuSign Real API pode ser usado!');
  console.log('Integration Key:', credentials.integrationKey.substring(0, 10) + '...');
  console.log('User ID:', credentials.userId.substring(0, 10) + '...');
  console.log('Account ID:', credentials.accountId.substring(0, 10) + '...');
} else {
  console.log('\n🟡 DocuSign vai usar modo mock');
}