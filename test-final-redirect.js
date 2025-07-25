// Teste final com usuário correto
const BASE_URL = 'http://localhost:5000';

async function testFinalRedirect() {
  console.log('🎯 TESTE FINAL - REDIRECIONAMENTO GOV.BR\n');

  try {
    // Login com usuário correto (ID 5 - locatário da reserva 16)
    console.log('1. Login com usuário correto...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login falhou - usuário pode não ter senha padrão');
      
      // Tentar resetar senha do usuário
      console.log('🔧 Tentando atualizar senha...');
      const updateQuery = `UPDATE users SET password = '$2b$10$K7L1OtTlwYN6z3Y9X4j.JuOE7r3i4x.GgN.oOiF7l5xYi9Zp9YqTK' WHERE id = 5;`;
      // Esta é a hash para 'senha123'
      
      return console.log('❌ Precisa ajustar senha do usuário manualmente');
    }

    const { token, user } = await loginResponse.json();
    console.log(`✅ Login: ${user.name} (ID: ${user.id})`);

    // Testar assinatura com booking 16
    console.log('\n2. Testando assinatura...');
    const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/16`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${signResponse.status}`);
    const data = await signResponse.json();

    if (signResponse.ok && data.signatureUrl) {
      console.log('✅ SUCESSO! Assinatura iniciada');
      console.log(`🔗 URL: ${data.signatureUrl}`);
      console.log(`📝 Mensagem: ${data.message}`);

      // Testar simulador
      console.log('\n3. Testando simulador...');
      const simulatorResponse = await fetch(data.signatureUrl);
      
      if (simulatorResponse.ok) {
        const html = await simulatorResponse.text();
        if (html.includes('GOV.BR') && html.includes('Assinatura Digital')) {
          console.log('✅ PERFEITO! Simulador funcionando');
          console.log('🎉 REDIRECIONAMENTO FUNCIONANDO 100%');
          
          // Simular clique em "Assinar Documento"
          const callbackMatch = html.match(/const returnUrl = "([^"]+)"/);
          if (callbackMatch) {
            console.log(`\n4. Testando callback...: ${callbackMatch[1]}&status=success`);
            const callbackResponse = await fetch(`${callbackMatch[1]}&status=success`);
            if (callbackResponse.ok) {
              console.log('✅ Callback funcionando - contrato seria assinado');
            }
          }
        }
      }
    } else {
      console.log(`❌ Falha: ${data.message}`);
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testFinalRedirect();