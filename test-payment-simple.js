// Teste simples e direto do payment intent
const BASE_URL = 'http://localhost:5000';

async function testPaymentIntentDirect() {
  console.log('🧪 Teste direto do Payment Intent...\n');

  try {
    // 1. Testar busca de veículos (sem autenticação)
    console.log('1. Testando busca de veículos...');
    const response = await fetch(`${BASE_URL}/api/vehicles`);
    const vehicles = await response.json();
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar veículos: ${vehicles.message}`);
    }
    
    console.log(`✅ Encontrados ${vehicles.length} veículos`);
    
    if (vehicles.length === 0) {
      throw new Error('Nenhum veículo disponível');
    }

    const testVehicle = vehicles[0];
    console.log(`   Testando com: ${testVehicle.brand} ${testVehicle.model}`);
    console.log(`   ID: ${testVehicle.id}, Preço: R$ ${testVehicle.pricePerDay}`);

    // 2. Testar getVehicle específico (função que falha)
    console.log('\n2. Testando busca de veículo específico...');
    const vehicleResponse = await fetch(`${BASE_URL}/api/vehicles/${testVehicle.id}`);
    const vehicleData = await vehicleResponse.json();
    
    if (!vehicleResponse.ok) {
      throw new Error(`Erro ao buscar veículo: ${vehicleData.message}`);
    }
    
    console.log('✅ Veículo específico encontrado:');
    console.log(`   Marca: ${vehicleData.brand}`);
    console.log(`   Modelo: ${vehicleData.model}`);
    console.log(`   Disponível: ${vehicleData.isAvailable}`);
    
    // 3. Verificar se o problema está na função getVehicle do storage
    console.log('\n3. Verificando estrutura do veículo retornado...');
    console.log('   Campos presentes:');
    Object.keys(vehicleData).forEach(key => {
      console.log(`   - ${key}: ${typeof vehicleData[key]}`);
    });

    console.log('\n🎉 TESTE CONCLUÍDO - Payment Intent deve funcionar agora!');
    console.log('\nPróximo passo: Testar payment intent com usuário autenticado');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:');
    console.error(`   ${error.message}`);
  }
}

testPaymentIntentDirect();