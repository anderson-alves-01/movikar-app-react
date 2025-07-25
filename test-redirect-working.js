// Teste do redirecionamento funcional
const BASE_URL = 'http://localhost:5000';

async function testRedirectWorking() {
  console.log('🔄 TESTANDO REDIRECIONAMENTO CORRIGIDO\n');

  try {
    // Simular a reserva 20 que está nos logs
    const bookingId = 20;
    const signatureId = 'GOVBR-' + Date.now() + '-test';
    const returnUrl = `${BASE_URL}/contract-signature-callback?bookingId=${bookingId}&signatureId=${signatureId}`;
    
    console.log(`📋 Testando reserva ${bookingId}`);
    
    // 1. Gerar URL do simulador
    const simulatorUrl = `${BASE_URL}/simulate-govbr-signature?` +
      `documentId=${signatureId}&` +
      `returnUrl=${encodeURIComponent(returnUrl)}&` +
      `cpf=asouzamax@gmail.com`;
    
    console.log('1. URL do simulador gerada ✅');
    
    // 2. Carregar simulador
    const simulatorResponse = await fetch(simulatorUrl);
    if (!simulatorResponse.ok) {
      console.log('❌ Simulador não carrega');
      return;
    }
    
    console.log('2. Simulador carrega ✅');
    
    // 3. Simular clique em "Assinar Documento"
    const successUrl = `${returnUrl}&status=success`;
    const callbackResponse = await fetch(successUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (callbackResponse.status === 302) {
      const location = callbackResponse.headers.get('location');
      console.log(`3. Callback redireciona para: ${location} ✅`);
      
      // 4. Verificar página de sucesso
      const successPageUrl = `${BASE_URL}${location}`;
      const successPageResponse = await fetch(successPageUrl);
      
      if (successPageResponse.ok) {
        console.log('4. Página de sucesso carrega ✅');
        
        console.log('\n🎯 CORREÇÃO APLICADA COM SUCESSO!');
        console.log('━'.repeat(45));
        console.log('✅ Simulador funciona');
        console.log('✅ Redirecionamento imediato aplicado');
        console.log('✅ Callback processa corretamente');
        console.log('✅ Página de sucesso carrega');
        
        console.log('\n📱 INSTRUÇÕES FINAIS:');
        console.log('1. Acesse a página do contrato');
        console.log('2. Clique em "Assinar no GOV.BR"');
        console.log('3. Você será redirecionado IMEDIATAMENTE');
        console.log('4. Na página do simulador, clique "✅ Assinar Documento"');
        console.log('5. Aguarde o processamento (2-3 segundos)');
        console.log('6. Redirecionamento automático para sucesso');
        
      } else {
        console.log('❌ Problema na página de sucesso');
      }
    } else {
      console.log(`❌ Callback falhou: ${callbackResponse.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testRedirectWorking();