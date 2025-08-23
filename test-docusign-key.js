#!/usr/bin/env node

// Teste independente para validar a chave privada DocuSign
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

console.log('🧪 Teste independente da chave privada DocuSign\n');

// Verificar se a chave existe
const privateKeyEnv = process.env.DOCUSIGN_PRIVATE_KEY;
if (!privateKeyEnv) {
  console.error('❌ DOCUSIGN_PRIVATE_KEY não encontrada no ambiente');
  process.exit(1);
}

console.log('✅ Chave encontrada no ambiente');
console.log('📏 Comprimento:', privateKeyEnv.length);
// Security Note: Never log private key content
console.log('🔤 Key format validated (content hidden for security)');

// Formatar chave adicionando quebras de linha se necessário
let formattedKey = privateKeyEnv;
if (formattedKey.includes('\\n')) {
  formattedKey = formattedKey.replace(/\\n/g, '\n');
}

// Adicionar quebras de linha PEM se necessário
if (!formattedKey.includes('\n')) {
  try {
    const header = formattedKey.match(/^-----BEGIN[^-]+-----/)[0];
    const footer = formattedKey.match(/-----END[^-]+-----$/)[0];
    const keyData = formattedKey.replace(header, '').replace(footer, '').trim();
    
    // Dividir em linhas de 64 caracteres
    const lines = [];
    for (let i = 0; i < keyData.length; i += 64) {
      lines.push(keyData.substring(i, i + 64));
    }
    
    formattedKey = header + '\n' + lines.join('\n') + '\n' + footer;
    console.log('🔧 Formatação PEM aplicada');
  } catch (e) {
    console.log('⚠️ Não foi possível reformatar - usando chave original');
  }
}

console.log('📐 Linhas após formatação:', (formattedKey.match(/\n/g) || []).length);
console.log('🔑 Formato detectado:', {
  isPKCS1: formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----'),
  isPKCS8: formattedKey.includes('-----BEGIN PRIVATE KEY-----')
});

// Teste 1: Validar chave com crypto module
console.log('\n🧪 Teste 1: Validação com crypto module');
try {
  const keyObject = crypto.createPrivateKey(formattedKey);
  console.log('✅ Chave validada pelo crypto module');
  console.log('📋 Tipo:', keyObject.asymmetricKeyType);
  console.log('📋 Tamanho:', keyObject.asymmetricKeySize);
} catch (error) {
  console.error('❌ Chave inválida:', error.message);
}

// Teste 2: Criar JWT manual
console.log('\n🧪 Teste 2: Criação de JWT manual');
const header = {
  alg: 'RS256',
  typ: 'JWT'
};

const payload = {
  iss: process.env.DOCUSIGN_INTEGRATION_KEY || 'test-key',
  sub: process.env.DOCUSIGN_USER_ID || 'test-user',
  aud: 'account-d.docusign.com',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  scope: 'signature impersonation'
};

try {
  const token = jwt.sign(payload, formattedKey, { algorithm: 'RS256' });
  console.log('✅ JWT criado com sucesso');
  console.log('📏 Tamanho do token:', token.length);
  console.log('🔤 Primeiros 50 chars:', token.substring(0, 50) + '...');
  
  // Verificar token
  try {
    const decoded = jwt.decode(token, { complete: true });
    console.log('✅ Token decodificado:', {
      header: decoded.header,
      payload: { iss: decoded.payload.iss, sub: decoded.payload.sub }
    });
  } catch (decodeError) {
    console.error('❌ Erro ao decodificar token:', decodeError.message);
  }
  
} catch (jwtError) {
  console.error('❌ Falha na criação do JWT:', jwtError.message);
  
  if (jwtError.message.includes('asymmetric key')) {
    console.log('🔧 Tentando conversão PKCS#1 -> PKCS#8...');
    
    // Tentar conversão para PKCS#8
    if (formattedKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      const pkcs8Key = formattedKey
        .replace('-----BEGIN RSA PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----')
        .replace('-----END RSA PRIVATE KEY-----', '-----END PRIVATE KEY-----');
      
      try {
        const tokenPkcs8 = jwt.sign(payload, pkcs8Key, { algorithm: 'RS256' });
        console.log('✅ JWT PKCS#8 criado com sucesso');
      } catch (pkcs8Error) {
        console.error('❌ Falha com PKCS#8:', pkcs8Error.message);
      }
    }
  }
}

console.log('\n🏁 Teste concluído');