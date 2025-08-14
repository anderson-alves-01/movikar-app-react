#!/usr/bin/env node

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;

if (!INTEGRATION_KEY) {
  console.error('❌ DOCUSIGN_INTEGRATION_KEY não encontrada');
  process.exit(1);
}

console.log('🔧 CONFIGURAÇÃO DOCUSIGN - CONSENT ADMINISTRATIVO');
console.log('');
console.log('📋 O erro "no redirect URIs registered" indica que a aplicação');
console.log('   DocuSign precisa ser configurada com URIs de redirecionamento.');
console.log('');
console.log('🎯 OPÇÃO 1: Consent Direto (Recomendado)');
console.log('');
console.log('Acesse esta URL para autorizar a aplicação:');
console.log('');
console.log(`https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${INTEGRATION_KEY}&redirect_uri=https://developers.docusign.com/platform/auth/consent`);
console.log('');
console.log('🎯 OPÇÃO 2: Admin Consent (Se a primeira falhar)');
console.log('');
console.log('Se a URL acima não funcionar, use o Admin Consent:');
console.log('');
console.log(`https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${INTEGRATION_KEY}&state=max&redirect_uri=https://www.docusign.com/&admin_consent_required=true`);
console.log('');
console.log('🎯 OPÇÃO 3: Configurar Redirect URI Manualmente');
console.log('');
console.log('1. Acesse: https://apps-d.docusign.com/');
console.log('2. Encontre sua aplicação:', INTEGRATION_KEY);
console.log('3. Adicione estes Redirect URIs:');
console.log('   - https://developers.docusign.com/platform/auth/consent');
console.log('   - https://www.docusign.com/');
console.log('   - https://account-d.docusign.com/oauth/code');
console.log('');
console.log('✅ Após qualquer uma das opções, teste com: node test-docusign-direct.js');