import axios from 'axios';
const BASE_URL = 'http://localhost:5000';

async function testEmailSystem() {
  console.log('🧪 Testando sistema de e-mails automáticos...\n');
  
  try {
    // 1. Fazer login como um usuário de teste
    console.log('1. Fazendo login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const authToken = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // 2. Buscar um veículo disponível
    console.log('\n2. Buscando veículos disponíveis...');
    const vehiclesResponse = await axios.get(`${BASE_URL}/api/vehicles`);
    const vehicles = vehiclesResponse.data.vehicles;
    
    if (vehicles.length === 0) {
      console.log('❌ Nenhum veículo encontrado para teste');
      return;
    }
    
    const testVehicle = vehicles[0];
    console.log(`✅ Veículo encontrado: ${testVehicle.brand} ${testVehicle.model} (ID: ${testVehicle.id})`);
    
    // 3. Testar o endpoint /api/rent-now
    console.log('\n3. Testando solicitação de aluguel com envio de e-mails...');
    const rentRequest = {
      vehicleId: testVehicle.id,
      startDate: '2025-08-25',
      endDate: '2025-08-28',
      totalPrice: 300.00,
      serviceFee: 30.00,
      insuranceFee: 45.00,
      securityDeposit: 60.00,
      includeInsurance: true
    };
    
    const rentResponse = await axios.post(`${BASE_URL}/api/rent-now`, rentRequest, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Solicitação de aluguel processada com sucesso!');
    console.log('📧 E-mails enviados:', rentResponse.data.emails);
    console.log('📝 Mensagem:', rentResponse.data.message);
    console.log('🆔 ID da reserva criada:', rentResponse.data.booking.id);
    
    // 4. Verificar se a reserva foi criada
    console.log('\n4. Verificando reserva criada...');
    const bookingsResponse = await axios.get(`${BASE_URL}/api/bookings`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const userBookings = bookingsResponse.data.bookings.filter(b => b.id === rentResponse.data.booking.id);
    if (userBookings.length > 0) {
      console.log('✅ Reserva encontrada no sistema');
      console.log('📋 Status da reserva:', userBookings[0].status);
      console.log('💰 Valor total:', userBookings[0].totalCost);
    }
    
    console.log('\n🎉 Teste do sistema de e-mails concluído com sucesso!');
    console.log('\n📨 Fluxo completo:');
    console.log('• Usuário clica no botão "Alugar"');
    console.log('• Sistema cria reserva no banco de dados');
    console.log('• E-mail de confirmação enviado para o locatário');
    console.log('• E-mail de notificação enviado para o proprietário');
    console.log('• Resposta enviada ao frontend com confirmação');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

// Executar teste
testEmailSystem();