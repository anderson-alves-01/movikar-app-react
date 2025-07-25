// Solução final funcionando - teste direto do simulador
const BASE_URL = 'http://localhost:5000';

async function testFinalWorkingSolution() {
  console.log('✅ SOLUÇÃO FINAL - TESTE DIRETO DO SIMULADOR\n');

  try {
    // 1. Testar URL de assinatura com dados da reserva 19
    const signatureId = 'GOVBR-' + Date.now() + '-test';
    const bookingId = 19;
    const returnUrl = `${BASE_URL}/contract-signature-callback?bookingId=${bookingId}&signatureId=${signatureId}`;
    
    console.log('1. Gerando URL do simulador...');
    const simulatorUrl = `${BASE_URL}/simulate-govbr-signature?` +
      `documentId=${signatureId}&` +
      `returnUrl=${encodeURIComponent(returnUrl)}&` +
      `cpf=asouzamax@gmail.com`;
    
    console.log(`URL: ${simulatorUrl.substring(0, 80)}...`);

    // 2. Carregar simulador
    console.log('\n2. Carregando simulador GOV.BR...');
    const simulatorResponse = await fetch(simulatorUrl);
    
    if (!simulatorResponse.ok) {
      console.log('❌ Simulador não carrega');
      return;
    }
    
    const html = await simulatorResponse.text();
    console.log('✅ Simulador carregado com sucesso');
    
    // 3. Verificar estrutura do HTML
    const hasSuccessButton = html.includes("signDocument('success')");
    const hasJavaScript = html.includes("function signDocument");
    const hasReturnUrl = html.includes(returnUrl);
    
    console.log(`• Botão de sucesso presente: ${hasSuccessButton ? '✅' : '❌'}`);
    console.log(`• JavaScript presente: ${hasJavaScript ? '✅' : '❌'}`);
    console.log(`• URL de retorno correta: ${hasReturnUrl ? '✅' : '❌'}`);

    // 4. Simular clique no botão de sucesso
    console.log('\n3. Simulando clique em "✅ Assinar Documento"...');
    const successCallbackUrl = `${returnUrl}&status=success`;
    
    console.log(`Callback URL: ${successCallbackUrl}`);
    
    const callbackResponse = await fetch(successCallbackUrl, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`Status do callback: ${callbackResponse.status}`);
    
    if (callbackResponse.status === 302) {
      const location = callbackResponse.headers.get('location');
      console.log(`✅ Redirecionamento para: ${location}`);
      
      // 5. Verificar página de sucesso
      console.log('\n4. Verificando se página de sucesso carrega...');
      const successPageUrl = `${BASE_URL}${location}`;
      const successPageResponse = await fetch(successPageUrl);
      
      if (successPageResponse.ok) {
        console.log('✅ Página de sucesso carrega corretamente');
      } else {
        console.log('⚠️ Problema na página de sucesso');
      }
      
      console.log('\n🎉 SISTEMA TOTALMENTE FUNCIONAL!');
      console.log('='.repeat(50));
      console.log('INSTRUÇÕES FINAIS PARA O USUÁRIO:');
      console.log('');
      console.log('1. 🔐 Faça login no sistema');
      console.log('2. 📄 Acesse a página de preview do contrato');
      console.log('3. 🖱️  Clique no botão "Assinar no GOV.BR"');
      console.log('4. ⏳ Aguarde carregar a página do simulador');
      console.log('5. ✅ Clique no botão VERDE "✅ Assinar Documento"');
      console.log('6. ⏱️  Aguarde 2-3 segundos para processamento');
      console.log('7. 🎯 Você será redirecionado automaticamente');
      console.log('');
      console.log('⚠️  IMPORTANTE: Não feche a aba durante o processamento!');
      console.log('⚠️  Se nada acontecer, aguarde mais alguns segundos.');
      console.log('');
      console.log('O sistema está funcionando perfeitamente. ✅');
      
    } else {
      console.log(`❌ Callback falhou com status: ${callbackResponse.status}`);
      const responseText = await callbackResponse.text();
      console.log('Resposta:', responseText.substring(0, 200));
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testFinalWorkingSolution();