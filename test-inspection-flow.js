import fetch from 'node-fetch';

async function testInspectionFlow() {
  const baseUrl = 'http://localhost:5000';
  let cookies = '';

  console.log('🚀 Iniciando teste do fluxo de vistoria...\n');

  try {
    // 1. Login como usuário de teste
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'asouzamax@gmail.com',
        password: '123456'
      })
    });

    if (loginResponse.status === 200) {
      const setCookieHeaders = loginResponse.headers.raw()['set-cookie'] || [];
      cookies = setCookieHeaders.join('; ');
      console.log('✅ Login realizado com sucesso');
    } else {
      console.log('❌ Falha no login:', await loginResponse.text());
      return;
    }

    // 2. Buscar veículos disponíveis
    console.log('\n2. Buscando veículos disponíveis...');
    const vehiclesResponse = await fetch(`${baseUrl}/api/vehicles`, {
      headers: { Cookie: cookies }
    });

    const vehicles = await vehiclesResponse.json();
    if (vehicles.length === 0) {
      console.log('❌ Nenhum veículo disponível');
      return;
    }

    const testVehicle = vehicles[0];
    console.log(`✅ Veículo encontrado: ${testVehicle.brand} ${testVehicle.model} (ID: ${testVehicle.id})`);

    // 3. Usar API de payment intent para criar reserva de forma válida
    console.log('\n3. Criando payment intent de teste...');
    
    const paymentData = {
      vehicleId: testVehicle.id,
      startDate: '2025-08-13',
      endDate: '2025-08-15',
      totalAmount: 200,
      usePoints: false,
      insuranceSelected: false
    };

    const paymentResponse = await fetch(`${baseUrl}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies
      },
      body: JSON.stringify(paymentData)
    });

    if (paymentResponse.status === 200) {
      const paymentResult = await paymentResponse.json();
      console.log(`✅ Payment intent criado: ${paymentResult.clientSecret}`);
      
      if (paymentResult.bookingId) {
        console.log(`✅ Reserva criada automaticamente (ID: ${paymentResult.bookingId})`);
        
        // 4. Verificar o status da reserva criada
        console.log('\n4. Verificando status da reserva...');
        const statusResponse = await fetch(`${baseUrl}/api/bookings`, {
          headers: { Cookie: cookies }
        });
        
        const bookings = await statusResponse.json();
        const newBooking = bookings.find(b => b.id === paymentResult.bookingId);
        
        if (newBooking) {
          console.log('📊 Status da reserva após criação:');
          console.log(`   - Status: ${newBooking.status}`);
          console.log(`   - Payment Status: ${newBooking.paymentStatus}`);
          console.log(`   - Inspection Status: ${newBooking.inspectionStatus || 'não definido'}`);
          
          // Simular confirmação do pagamento
          console.log('\n5. Simulando confirmação de pagamento...');
          const updateResponse = await fetch(`${baseUrl}/api/bookings/${paymentResult.bookingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Cookie: cookies
            },
            body: JSON.stringify({
              status: 'paid',
              paymentStatus: 'paid',
              inspectionStatus: 'pending'
            })
          });

          if (updateResponse.status === 200) {
            console.log('✅ Pagamento confirmado e vistoria definida como pendente');
            
            // 6. Verificar o status final
            console.log('\n6. Verificando status final da reserva...');
            const finalStatusResponse = await fetch(`${baseUrl}/api/bookings`, {
              headers: { Cookie: cookies }
            });
            
            const finalBookings = await finalStatusResponse.json();
            const finalBooking = finalBookings.find(b => b.id === paymentResult.bookingId);
            
            if (finalBooking) {
              console.log('📊 Status final da reserva:');
              console.log(`   - Status: ${finalBooking.status}`);
              console.log(`   - Payment Status: ${finalBooking.paymentStatus}`);
              console.log(`   - Inspection Status: ${finalBooking.inspectionStatus || 'não definido'}`);
              
              // Verificar se os botões aparecem corretamente
              if (finalBooking.status === 'paid' && 
                  finalBooking.paymentStatus === 'paid' && 
                  finalBooking.inspectionStatus === 'pending') {
                console.log('\n✅ TESTE APROVADO: Reserva está no estado correto para mostrar botão de vistoria!');
                console.log('🎯 O botão "Realizar Vistoria" deve aparecer na página de reservas');
                console.log(`🔗 URL para testar: http://localhost:5000/reservations`);
                console.log(`📋 ID da reserva de teste: ${paymentResult.bookingId}`);
              } else {
                console.log('\n❌ TESTE FALHOU: Reserva não está no estado esperado');
              }
            }
          } else {
            console.log('❌ Erro ao simular pagamento:', await updateResponse.text());
          }
        }
      }
      
    } else {
      console.log('❌ Erro ao criar payment intent:', await paymentResponse.text());
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testInspectionFlow();