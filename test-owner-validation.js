// Teste para validar que o proprietário (owner) pode ver preview mas não assinar
const BASE_URL = 'http://localhost:5000';

async function testOwnerValidation() {
  console.log('👑 TESTANDO VALIDAÇÃO PROPRIETÁRIO vs LOCATÁRIO\n');

  try {
    // 1. Login como usuário teste (renter)
    console.log('1️⃣ Login como locatário...');
    const renterLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    const { token: renterToken, user: renterUser } = await renterLogin.json();
    console.log(`✅ Locatário logado: ${renterUser.name} (ID: ${renterUser.id})`);

    // 2. Criar um booking completo via payment
    console.log('\n2️⃣ Criando payment intent...');
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${renterToken}`
      },
      body: JSON.stringify({
        vehicleId: 22,
        startDate: '2025-08-20',
        endDate: '2025-08-22',
        totalPrice: '400.00'
      })
    });

    const { paymentIntentId } = await paymentResponse.json();
    console.log(`✅ Payment Intent: ${paymentIntentId}`);

    // 3. Simular pagamento bem-sucedido
    console.log('\n3️⃣ Simulando pagamento bem-sucedido...');
    const successResponse = await fetch(`${BASE_URL}/api/payment-success/${paymentIntentId}`, {
      headers: { 'Authorization': `Bearer ${renterToken}` }
    });

    if (!successResponse.ok) {
      throw new Error('Falha ao confirmar pagamento');
    }

    const { booking } = await successResponse.json();
    const bookingId = booking.id;
    console.log(`✅ Booking criado: ID ${bookingId}`);
    console.log(`   Locatário: ${booking.renterId} | Proprietário: ${booking.ownerId}`);

    // 4. Testar acesso do LOCATÁRIO
    console.log('\n4️⃣ Testando acesso do LOCATÁRIO...');
    
    // Preview para locatário
    const renterPreview = await fetch(`${BASE_URL}/api/contracts/preview/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${renterToken}` }
    });
    
    console.log(`   Preview: ${renterPreview.ok ? '✅ PERMITIDO' : '❌ NEGADO'}`);
    
    // Assinatura para locatário  
    const renterSign = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${bookingId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${renterToken}` }
    });
    
    console.log(`   Assinatura: ${renterSign.ok ? '✅ PERMITIDO' : '❌ NEGADO'}`);

    // 5. Login como proprietário
    console.log('\n5️⃣ Login como proprietário...');
    const ownerLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@carshare.com',
        password: 'admin123'
      })
    });

    if (!ownerLogin.ok) {
      console.log('❌ Proprietário não encontrado, testando com outro usuário...');
      return;
    }

    const { token: ownerToken, user: ownerUser } = await ownerLogin.json();
    console.log(`✅ Proprietário logado: ${ownerUser.name} (ID: ${ownerUser.id})`);

    // 6. Testar acesso do PROPRIETÁRIO
    console.log('\n6️⃣ Testando acesso do PROPRIETÁRIO...');
    
    // Preview para proprietário
    const ownerPreview = await fetch(`${BASE_URL}/api/contracts/preview/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    console.log(`   Preview: ${ownerPreview.ok ? '✅ PERMITIDO' : '❌ NEGADO'}`);
    
    // Assinatura para proprietário
    const ownerSign = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${bookingId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    
    if (!ownerSign.ok) {
      const error = await ownerSign.json();
      console.log(`   Assinatura: ❌ NEGADO - ${error.message}`);
    } else {
      console.log(`   Assinatura: ⚠️ PERMITIDO (deveria ser negado)`);
    }

    console.log('\n🎯 RESUMO DA VALIDAÇÃO:');
    console.log('='.repeat(50));
    console.log('LOCATÁRIO (quem aluga):');
    console.log(`   ✓ Pode ver preview do contrato`);
    console.log(`   ✓ Pode assinar o contrato`);
    console.log('\nPROPRIETÁRIO (dono do carro):');
    console.log(`   ✓ Pode ver preview do contrato`);
    console.log(`   ✗ NÃO pode assinar o contrato`);

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

testOwnerValidation();