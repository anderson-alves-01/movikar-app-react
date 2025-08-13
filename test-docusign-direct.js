#!/usr/bin/env node

import jwt from 'jsonwebtoken';
import axios from 'axios';

console.log('🧪 Teste direto da API DocuSign\n');

const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
const USER_ID = process.env.DOCUSIGN_USER_ID;
const ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const PRIVATE_KEY = process.env.DOCUSIGN_PRIVATE_KEY;

if (!INTEGRATION_KEY || !USER_ID || !ACCOUNT_ID || !PRIVATE_KEY) {
  console.error('❌ Credenciais DocuSign não encontradas');
  process.exit(1);
}

console.log('✅ Credenciais encontradas:');
console.log('🔑 Integration Key:', INTEGRATION_KEY.substring(0, 10) + '...');
console.log('👤 User ID:', USER_ID.substring(0, 10) + '...');
console.log('🏢 Account ID:', ACCOUNT_ID.substring(0, 10) + '...');

// Formatar chave privada
let formattedKey = PRIVATE_KEY;
if (formattedKey.includes('\\n')) {
  formattedKey = formattedKey.replace(/\\n/g, '\n');
}

if (!formattedKey.includes('\n')) {
  try {
    const header = formattedKey.match(/^-----BEGIN[^-]+-----/)[0];
    const footer = formattedKey.match(/-----END[^-]+-----$/)[0];
    const keyData = formattedKey.replace(header, '').replace(footer, '').trim();
    
    const lines = [];
    for (let i = 0; i < keyData.length; i += 64) {
      lines.push(keyData.substring(i, i + 64));
    }
    
    formattedKey = header + '\n' + lines.join('\n') + '\n' + footer;
  } catch (e) {
    console.warn('⚠️ Não foi possível reformatar chave');
  }
}

// Criar JWT assertion
const jwtPayload = {
  iss: INTEGRATION_KEY,
  sub: USER_ID,
  aud: 'account-d.docusign.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  scope: 'signature impersonation'
};

console.log('\n🔄 Criando JWT assertion...');
let jwtAssertion;
try {
  jwtAssertion = jwt.sign(jwtPayload, formattedKey, { algorithm: 'RS256' });
  console.log('✅ JWT assertion criado');
} catch (error) {
  console.error('❌ Erro criando JWT:', error.message);
  process.exit(1);
}

// Fazer requisição de token diretamente à API DocuSign
console.log('\n🔄 Solicitando access token...');
try {
  const tokenResponse = await axios.post(
    'https://account-d.docusign.com/oauth/token',
    'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwtAssertion,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  console.log('✅ Access token obtido com sucesso!');
  console.log('📋 Token type:', tokenResponse.data.token_type);
  console.log('⏰ Expires in:', tokenResponse.data.expires_in);
  console.log('🔑 Access token:', tokenResponse.data.access_token.substring(0, 30) + '...');

  // Testar chamada à API DocuSign
  const accessToken = tokenResponse.data.access_token;
  
  console.log('\n🔄 Testando chamada à API DocuSign...');
  const apiResponse = await axios.get(
    `https://demo.docusign.net/restapi/v2.1/accounts/${ACCOUNT_ID}/users`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  console.log('✅ Chamada à API bem-sucedida!');
  console.log('📋 Status:', apiResponse.status);
  console.log('👥 Usuários encontrados:', apiResponse.data.users?.length || 0);
  console.log();
  console.log('🎉 DOCUSIGN API FUNCIONANDO COMPLETAMENTE! 🎉');
  console.log('✅ JWT authentication: OK');
  console.log('✅ Access token: OK'); 
  console.log('✅ API call: OK');

} catch (error) {
  console.error('❌ Erro na requisição:', error.response?.status, error.response?.statusText);
  console.error('📋 Erro detalhes:', error.response?.data || error.message);
  
  if (error.response?.status === 400) {
    console.log('\n🔍 Análise do erro 400:');
    console.log('- Verifique se Integration Key está correto');
    console.log('- Verifique se User ID está correto');
    console.log('- Verifique se a chave privada corresponde ao certificado público');
    console.log('- Verifique se o usuário tem consent para a aplicação');
  }
}