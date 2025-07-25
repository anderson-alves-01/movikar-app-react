// Debug para verificar papéis de usuário no sistema
const BASE_URL = 'http://localhost:5000';

async function debugAuthRoles() {
  console.log('🔍 DEBUGANDO PAPÉIS DE USUÁRIO\n');

  try {
    // 1. Login do usuário atual
    console.log('1️⃣ Login do usuário atual...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teste.payment@carshare.com',
        password: 'senha123'
      })
    });

    const { token, user } = await loginResponse.json();
    console.log(`✅ Usuário logado: ${user.name} (ID: ${user.id})`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'N/A'}`);

    // 2. Verificar veículo ID 22
    console.log('\n2️⃣ Verificando veículo ID 22...');
    const vehicleResponse = await fetch(`${BASE_URL}/api/vehicles/22`);
    const vehicle = await vehicleResponse.json();
    
    if (vehicle) {
      console.log(`✅ Veículo encontrado: ${vehicle.brand} ${vehicle.model}`);
      console.log(`   Proprietário ID: ${vehicle.ownerId}`);
      console.log(`   Usuário atual é proprietário? ${user.id === vehicle.ownerId ? 'SIM' : 'NÃO'}`);
    }

    // 3. Buscar um booking recente do usuário
    console.log('\n3️⃣ Buscando bookings do usuário...');
    const bookingsResponse = await fetch(`${BASE_URL}/api/bookings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const bookings = await bookingsResponse.json();
    
    if (bookings.length > 0) {
      const lastBooking = bookings[bookings.length - 1];
      console.log(`✅ Último booking encontrado: ID ${lastBooking.id}`);
      console.log(`   Veículo ID: ${lastBooking.vehicleId}`);
      console.log(`   Locatário ID: ${lastBooking.renterId}`);
      console.log(`   Proprietário ID: ${lastBooking.ownerId}`);
      console.log(`   Usuário atual é locatário? ${user.id === lastBooking.renterId ? 'SIM' : 'NÃO'}`);
      console.log(`   Usuário atual é proprietário? ${user.id === lastBooking.ownerId ? 'SIM' : 'NÃO'}`);

      // 4. Testar acesso ao preview
      console.log('\n4️⃣ Testando acesso ao preview...');
      const previewResponse = await fetch(`${BASE_URL}/api/contracts/preview/${lastBooking.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (previewResponse.ok) {
        console.log('✅ Preview acessível');
      } else {
        const error = await previewResponse.json();
        console.log(`❌ Erro no preview: ${error.message}`);
      }

      // 5. Testar assinatura
      console.log('\n5️⃣ Testando processo de assinatura...');
      const signResponse = await fetch(`${BASE_URL}/api/contracts/sign-govbr/${lastBooking.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (signResponse.ok) {
        const signResult = await signResponse.json();
        console.log('✅ Assinatura iniciada com sucesso');
      } else {
        const error = await signResponse.json();
        console.log(`❌ Erro na assinatura: ${error.message}`);
      }
    } else {
      console.log('❌ Nenhum booking encontrado');
    }

    console.log('\n🎯 ANÁLISE COMPLETA:');
    console.log('='.repeat(50));
    console.log(`Usuário: ${user.name} (ID: ${user.id})`);
    console.log(`Papel no sistema: ${user.role || 'Usuário padrão'}`);
    if (vehicle) {
      console.log(`Relação com veículo 22: ${user.id === vehicle.ownerId ? 'PROPRIETÁRIO' : 'OUTRO'}`);
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

debugAuthRoles();