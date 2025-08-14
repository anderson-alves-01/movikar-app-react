#!/usr/bin/env node

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;

if (!INTEGRATION_KEY) {
  console.error('❌ DOCUSIGN_INTEGRATION_KEY não encontrada');
  process.exit(1);
}

// Gerar URL de consentimento seguindo documentação oficial DocuSign
// Formato: SERVER/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=CLIENT_ID&redirect_uri=REDIRECT_URI

// Para demo environment (development)
const SERVER = 'https://account-d.docusign.com';
const SCOPE = 'signature%20impersonation'; // encoded scopes
const REDIRECT_URI = encodeURIComponent('https://www.docusign.com'); // must match integration key settings

const consentURL = `${SERVER}/oauth/auth?response_type=code&scope=${SCOPE}&client_id=${INTEGRATION_KEY}&redirect_uri=${REDIRECT_URI}`;

console.log('🔑 DOCUSIGN INDIVIDUAL CONSENT - SOLUÇÃO OFICIAL');
console.log('');
console.log('📋 Seguindo a documentação oficial DocuSign:');
console.log('   https://developers.docusign.com/platform/auth/oauth/jwt/consent/');
console.log('');
console.log('🎯 PASSO 1: Configurar Integration Key');
console.log('   1. Acesse: https://apps-d.docusign.com/');
console.log('   2. Encontre sua aplicação:', INTEGRATION_KEY);
console.log('   3. Configure:');
console.log('      - Authentication: Authorization Code Grant');
console.log('      - Redirect URI: https://www.docusign.com');
console.log('');
console.log('🎯 PASSO 2: Autorizar Individual Consent');
console.log('   Abra esta URL no seu navegador:');
console.log('');
console.log(consentURL);
console.log('');
console.log('   - Faça login com sua conta DocuSign');
console.log('   - Autorize a aplicação para scopes: signature e impersonation');
console.log('   - Será redirecionado para docusign.com (normal)');
console.log('');
console.log('🎯 PASSO 3: Testar Integração');
console.log('   Após autorização, execute: node test-docusign-direct.js');
console.log('');
console.log('⚠️ IMPORTANTE: Este consent é obrigatório UMA vez por usuário');
console.log('✅ Depois da autorização, JWT funcionará automaticamente');