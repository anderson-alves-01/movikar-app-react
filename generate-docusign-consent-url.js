#!/usr/bin/env node

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;

if (!INTEGRATION_KEY) {
  console.error('❌ DOCUSIGN_INTEGRATION_KEY não encontrada');
  process.exit(1);
}

// Gerar URL de consentimento
const consentURL = `https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${INTEGRATION_KEY}&redirect_uri=https://www.docusign.com`;

console.log('🔑 DOCUSIGN CONSENT URL GERADA');
console.log('');
console.log('📋 Para resolver o erro "consent_required", você precisa:');
console.log('');
console.log('1. Abra esta URL no seu navegador:');
console.log('');
console.log(consentURL);
console.log('');
console.log('2. Faça login com sua conta DocuSign');
console.log('3. Autorize a aplicação');
console.log('4. Após autorização, teste novamente a integração');
console.log('');
console.log('⚠️ IMPORTANTE: Este passo é obrigatório apenas UMA vez por aplicação');
console.log('✅ Depois da autorização, a integração funcionará automaticamente');