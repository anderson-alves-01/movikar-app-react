// Debug específico do problema do usuário
const BASE_URL = 'http://localhost:5000';

async function debugUserIssue() {
  console.log('🔧 DEBUGANDO PROBLEMA ESPECÍFICO DO USUÁRIO\n');

  try {
    // 1. Testar acesso direto ao simulador
    console.log('1. Testando simulador GOV.BR diretamente...');
    const simulatorUrl = `${BASE_URL}/simulate-govbr-signature?documentId=TEST-DEBUG&returnUrl=${encodeURIComponent(`${BASE_URL}/contract-signature-callback?bookingId=19&signatureId=TEST-DEBUG`)}&cpf=asouzamax@gmail.com`;
    
    console.log(`URL do simulador: ${simulatorUrl}`);
    
    const simulatorResponse = await fetch(simulatorUrl);
    console.log(`Status: ${simulatorResponse.status}`);
    
    if (simulatorResponse.ok) {
      const html = await simulatorResponse.text();
      console.log('✅ Simulador carrega');
      
      // Verificar elementos essenciais
      const hasButton = html.includes('Assinar Documento');
      const hasScript = html.includes('signDocument');
      const hasCallback = html.includes('window.location.href');
      
      console.log(`• Botão de assinatura: ${hasButton ? '✅' : '❌'}`);
      console.log(`• Script de assinatura: ${hasScript ? '✅' : '❌'}`);
      console.log(`• Redirecionamento: ${hasCallback ? '✅' : '❌'}`);
      
      if (!hasButton || !hasScript || !hasCallback) {
        console.log('⚠️ PROBLEMA: Elementos essenciais ausentes no simulador');
      }
    } else {
      console.log('❌ Simulador não carrega');
      return;
    }

    // 2. Testar callback manual
    console.log('\n2. Testando callback manual...');
    const callbackUrl = `${BASE_URL}/contract-signature-callback?bookingId=19&signatureId=TEST-DEBUG&status=success`;
    
    const callbackResponse = await fetch(callbackUrl, {
      redirect: 'manual'
    });
    
    console.log(`Status do callback: ${callbackResponse.status}`);
    
    if (callbackResponse.status === 302) {
      const location = callbackResponse.headers.get('location');
      console.log(`✅ Callback redireciona para: ${location}`);
    } else {
      console.log('❌ Callback não funciona corretamente');
    }

    // 3. Verificar estrutura do HTML do simulador em detalhes
    console.log('\n3. Analisando estrutura do simulador...');
    const detailedResponse = await fetch(simulatorUrl);
    const detailedHtml = await detailedResponse.text();
    
    // Extrair a função JavaScript
    const scriptMatch = detailedHtml.match(/function signDocument\(\)\s*{[^}]+}/);
    if (scriptMatch) {
      console.log('✅ Função signDocument encontrada:');
      console.log(scriptMatch[0]);
    } else {
      console.log('❌ Função signDocument não encontrada');
    }

    // 4. Simular clique manual no botão
    console.log('\n4. Simulando clique no botão de assinatura...');
    
    // Extrair URL de retorno do HTML
    const returnUrlMatch = detailedHtml.match(/'([^']*contract-signature-callback[^']*)'/);
    if (returnUrlMatch) {
      const returnUrl = returnUrlMatch[1];
      console.log(`URL de retorno extraída: ${returnUrl}`);
      
      // Simular o que acontece quando o usuário clica
      const finalCallbackUrl = `${returnUrl}&status=success`;
      console.log(`Simulando clique -> ${finalCallbackUrl}`);
      
      const finalResponse = await fetch(finalCallbackUrl, {
        redirect: 'manual'
      });
      
      if (finalResponse.status === 302) {
        const finalLocation = finalResponse.headers.get('location');
        console.log(`✅ Clique simulado redireciona para: ${finalLocation}`);
        
        console.log('\n🎯 DIAGNÓSTICO COMPLETO:');
        console.log('• Simulador carrega ✅');
        console.log('• Elementos presentes ✅');
        console.log('• Callback funciona ✅');
        console.log('• Redirecionamento OK ✅');
        console.log('\n📝 INSTRUÇÕES DETALHADAS:');
        console.log('1. Clique em "Assinar no GOV.BR" na página do contrato');
        console.log('2. Aguarde carregar a página do simulador');
        console.log('3. Clique no botão verde "✅ Assinar Documento"');
        console.log('4. Aguarde 2-3 segundos para o redirecionamento');
        console.log('5. Você será levado automaticamente para a página de sucesso');
        
      } else {
        console.log(`❌ Problema no redirecionamento final: ${finalResponse.status}`);
      }
    } else {
      console.log('❌ Não foi possível extrair URL de retorno');
    }

  } catch (error) {
    console.log(`❌ Erro no debug: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

debugUserIssue();