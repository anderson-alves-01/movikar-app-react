// Debug do problema de assinatura
const BASE_URL = 'http://localhost:5000';

async function debugSignatureIssue() {
  console.log('🔍 DEBUGANDO PROBLEMA DE ASSINATURA\n');

  try {
    // 1. Verificar se o simulador está respondendo
    console.log('1. Testando simulador GOV.BR diretamente...');
    const simulatorUrl = `${BASE_URL}/simulate-govbr-signature?documentId=TEST&returnUrl=${encodeURIComponent(`${BASE_URL}/contract-signature-callback?bookingId=18&signatureId=TEST`)}&cpf=test@email.com`;
    
    const simulatorResponse = await fetch(simulatorUrl);
    console.log(`Status do simulador: ${simulatorResponse.status}`);
    
    if (simulatorResponse.ok) {
      const html = await simulatorResponse.text();
      console.log('✅ Simulador carrega corretamente');
      
      // Verificar se tem JavaScript de redirecionamento
      if (html.includes('window.location.href')) {
        console.log('✅ Script de redirecionamento presente');
      } else {
        console.log('⚠️ Script de redirecionamento pode estar ausente');
      }
    } else {
      console.log('❌ Simulador não carrega');
    }

    // 2. Testar callback manualmente
    console.log('\n2. Testando callback de assinatura...');
    const callbackUrl = `${BASE_URL}/contract-signature-callback?bookingId=18&signatureId=TEST-MANUAL&status=success`;
    const callbackResponse = await fetch(callbackUrl);
    
    console.log(`Status do callback: ${callbackResponse.status}`);
    
    if (callbackResponse.status === 302) {
      console.log('✅ Callback redirecionando corretamente');
    } else if (callbackResponse.ok) {
      const result = await callbackResponse.text();
      console.log('Resposta do callback:', result.substring(0, 200));
    } else {
      console.log('❌ Callback com problema');
    }

    // 3. Verificar estado do contrato
    console.log('\n3. Verificando estado do contrato...');
    const contractResponse = await fetch(`${BASE_URL}/api/contracts/preview/18`);
    
    if (contractResponse.ok) {
      const contract = await contractResponse.json();
      console.log(`Status do contrato: ${contract.status || 'undefined'}`);
      console.log(`Booking ID: ${contract.bookingId}`);
      console.log(`Contrato existe: ${contract.id ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Erro ao buscar contrato');
    }

    // 4. Verificar estrutura de callback
    console.log('\n4. Testando estrutura completa...');
    const testCallbackUrl = `${BASE_URL}/contract-signature-callback?bookingId=18&signatureId=GOVBR-TEST&status=success`;
    const testCallback = await fetch(testCallbackUrl, { 
      method: 'GET',
      redirect: 'manual' // Não seguir redirecionamentos automaticamente
    });
    
    console.log(`Callback test status: ${testCallback.status}`);
    
    if (testCallback.status === 302) {
      const location = testCallback.headers.get('location');
      console.log(`✅ Redirecionando para: ${location}`);
    }

  } catch (error) {
    console.log(`❌ Erro no debug: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

debugSignatureIssue();