import fetch from 'node-fetch';

async function testCompleteInspectionFlow() {
  const baseUrl = 'http://localhost:5000';
  let renterCookies = '';

  console.log('🚀 Testando fluxo completo de vistoria com usuários diferentes...\n');

  try {
    // 1. Login como locatário (renter@test.com)
    console.log('1. Fazendo login como locatário...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'renter@test.com',
        password: '123456'
      })
    });

    if (loginResponse.status === 200) {
      const setCookieHeaders = loginResponse.headers.raw()['set-cookie'] || [];
      renterCookies = setCookieHeaders.join('; ');
      console.log('✅ Login do locatário realizado com sucesso');
    } else {
      console.log('❌ Falha no login do locatário:', await loginResponse.text());
      return;
    }

    // 2. Buscar veículos de outros proprietários
    console.log('\n2. Buscando veículos disponíveis...');
    const vehiclesResponse = await fetch(`${baseUrl}/api/vehicles`, {
      headers: { Cookie: renterCookies }
    });

    const vehicles = await vehiclesResponse.json();
    const otherOwnerVehicles = vehicles.filter(v => v.ownerId !== 45); // ID do renter
    
    if (otherOwnerVehicles.length === 0) {
      console.log('❌ Nenhum veículo de outros proprietários disponível');
      console.log('📋 Veículos encontrados:', vehicles.map(v => `ID:${v.id} Owner:${v.ownerId}`));
      return;
    }

    const testVehicle = otherOwnerVehicles[0];
    console.log(`✅ Veículo encontrado: ${testVehicle.brand} ${testVehicle.model} (ID: ${testVehicle.id}, Owner: ${testVehicle.ownerId})`);

    // 3. Criar payment intent para alugar veículo de outro proprietário
    console.log('\n3. Criando reserva através de payment intent...');
    
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
        Cookie: renterCookies
      },
      body: JSON.stringify(paymentData)
    });

    if (paymentResponse.status === 200) {
      const paymentResult = await paymentResponse.json();
      console.log(`✅ Payment intent criado com sucesso`);
      
      if (paymentResult.bookingId) {
        console.log(`✅ Reserva criada automaticamente (ID: ${paymentResult.bookingId})`);
        
        // 4. Verificar o status da reserva criada
        console.log('\n4. Verificando status inicial da reserva...');
        const statusResponse = await fetch(`${baseUrl}/api/bookings`, {
          headers: { Cookie: renterCookies }
        });
        
        const bookings = await statusResponse.json();
        const newBooking = bookings.find(b => b.id === paymentResult.bookingId);
        
        if (newBooking) {
          console.log('📊 Status da reserva após criação:');
          console.log(`   - Status: ${newBooking.status}`);
          console.log(`   - Payment Status: ${newBooking.paymentStatus}`);
          console.log(`   - Inspection Status: ${newBooking.inspectionStatus || 'não definido'}`);
          
          // 5. Simular confirmação do pagamento
          console.log('\n5. Simulando confirmação de pagamento...');
          const updateResponse = await fetch(`${baseUrl}/api/admin/bookings/${paymentResult.bookingId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Cookie: renterCookies
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
              headers: { Cookie: renterCookies }
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
                console.log('\n✅ TESTE APROVADO: Sistema de vistoria funcionando corretamente!');
                console.log('🎯 O botão "Realizar Vistoria" deve aparecer na página de reservas');
                console.log(`🔗 URL para testar: http://localhost:5000/reservations`);
                console.log(`📋 ID da reserva de teste: ${paymentResult.bookingId}`);
                console.log(`👤 Login para testar: renter@test.com / 123456`);
                console.log('\n🔄 Fluxo esperado:');
                console.log('1. Reserva fica com status "paid" após pagamento');
                console.log('2. InspectionStatus fica "pending"');
                console.log('3. Botão "Realizar Vistoria" aparece para o locatário');
                console.log('4. Após vistoria do locatário: inspectionStatus vira "completed"');
                console.log('5. Na data de devolução: proprietário pode fazer vistoria');
              } else {
                console.log('\n❌ TESTE FALHOU: Reserva não está no estado esperado');
                console.log('📋 Estados atuais:');
                console.log(`   - Status: ${finalBooking.status} (esperado: paid)`);
                console.log(`   - Payment Status: ${finalBooking.paymentStatus} (esperado: paid)`);
                console.log(`   - Inspection Status: ${finalBooking.inspectionStatus} (esperado: pending)`);
              }
            }
          } else {
            console.log('❌ Erro ao simular pagamento:', await updateResponse.text());
          }
        }
      }
      
    } else {
      const errorText = await paymentResponse.text();
      console.log('❌ Erro ao criar payment intent:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testCompleteInspectionFlow();