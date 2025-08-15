/**
 * Script para popular dados de demonstração do novo modelo de monetização
 * Cria serviços premium, leads qualificados e boosts de exemplo
 */

const { db, pool } = require('./server/db.js');
const { 
  premiumServices,
  qualifiedLeads,
  vehicleBoosts,
  userPremiumServices,
  users,
  vehicles 
} = require('./shared/schema.js');

async function populateMonetizationData() {
  console.log('🚀 Populando dados do novo modelo de monetização...');

  try {
    // 1. Criar serviços premium
    console.log('📊 Criando serviços premium...');
    
    const premiumServicesData = [
      {
        name: 'Entrega e Retirada VIP',
        description: 'Serviço de entrega e retirada do veículo no local desejado pelo locatário',
        serviceType: 'delivery',
        price: '35.00',
        duration: 1, // Válido por 1 dia (durante a locação)
        features: ['Entrega no endereço', 'Retirada incluída', 'Sem custo extra de deslocamento'],
        isActive: true
      },
      {
        name: 'Seguro Premium',
        description: 'Cobertura completa com franquia reduzida e assistência 24h',
        serviceType: 'insurance',
        price: '25.00',
        duration: 1, // Por dia de locação
        features: ['Franquia reduzida', 'Assistência 24h', 'Cobertura para terceiros'],
        isActive: true
      },
      {
        name: 'Vistoria Digital Avançada',
        description: 'Vistoria com inteligência artificial e relatório detalhado',
        serviceType: 'inspection',
        price: '15.00',
        duration: 30, // Válido por 30 dias
        features: ['IA para detecção de danos', 'Relatório PDF', 'Fotos em alta resolução'],
        isActive: true
      },
      {
        name: 'Suporte Priority',
        description: 'Atendimento prioritário com tempo de resposta garantido',
        serviceType: 'support',
        price: '10.00',
        duration: 30, // Válido por 30 dias
        features: ['Resposta em até 2h', 'Canal exclusivo', 'Suporte por WhatsApp'],
        isActive: true
      },
      {
        name: 'Kit Higienização Premium',
        description: 'Limpeza e sanitização profissional do veículo',
        serviceType: 'cleaning',
        price: '20.00',
        duration: 1, // Por locação
        features: ['Limpeza interna e externa', 'Sanitização anti-COVID', 'Aromatização'],
        isActive: true
      }
    ];

    for (const service of premiumServicesData) {
      await db.insert(premiumServices).values(service).onConflictDoNothing();
    }

    // 2. Buscar usuários e veículos existentes para criar dados de exemplo
    const existingUsers = await db.select().from(users).limit(5);
    const existingVehicles = await db.select().from(vehicles).limit(10);

    if (existingUsers.length === 0 || existingVehicles.length === 0) {
      console.log('⚠️  Não foram encontrados usuários ou veículos para criar dados de exemplo');
      console.log('   Certifique-se de ter dados base antes de executar este script');
      return;
    }

    // 3. Criar alguns leads qualificados de exemplo
    console.log('👥 Criando leads qualificados de exemplo...');
    
    const sampleLeads = [];
    for (let i = 0; i < Math.min(5, existingVehicles.length); i++) {
      const vehicle = existingVehicles[i];
      const renter = existingUsers[Math.floor(Math.random() * existingUsers.length)];
      
      // Evitar criar lead onde o locatário é o próprio dono
      if (renter.id === vehicle.ownerId) continue;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7) + 1);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 3 dias

      const leadScore = Math.floor(Math.random() * 50) + 10; // Score entre 10-60
      
      sampleLeads.push({
        vehicleId: vehicle.id,
        ownerId: vehicle.ownerId,
        renterId: renter.id,
        startDate,
        endDate,
        contactInfo: {
          name: renter.name,
          phone: renter.phone || `(11) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          email: renter.email
        },
        leadScore,
        status: Math.random() > 0.3 ? 'pending' : 'purchased', // 70% pendentes
        purchasedPrice: '50.00',
        expiresAt
      });
    }

    for (const lead of sampleLeads) {
      await db.insert(qualifiedLeads).values(lead).onConflictDoNothing();
    }

    // 4. Criar alguns boosts de veículos de exemplo
    console.log('⚡ Criando boosts de veículos de exemplo...');
    
    const boostTypes = ['homepage_highlight', 'category_highlight', 'event_highlight'];
    const sampleBoosts = [];
    
    for (let i = 0; i < Math.min(3, existingVehicles.length); i++) {
      const vehicle = existingVehicles[i];
      const boostType = boostTypes[Math.floor(Math.random() * boostTypes.length)];
      
      const prices = {
        homepage_highlight: '15.00',
        category_highlight: '10.00', 
        event_highlight: '25.00'
      };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 10)); // Alguns já começaram
      const duration = [3, 7, 14][Math.floor(Math.random() * 3)];
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
      
      const isActive = endDate > new Date();
      
      sampleBoosts.push({
        vehicleId: vehicle.id,
        ownerId: vehicle.ownerId,
        boostType,
        boostTitle: `Destaque ${boostType.replace('_', ' ')}`,
        boostDescription: `Veículo destacado por ${duration} dias`,
        price: prices[boostType],
        duration,
        startDate,
        endDate,
        status: isActive ? 'active' : 'expired',
        paymentIntentId: `pi_demo_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    for (const boost of sampleBoosts) {
      await db.insert(vehicleBoosts).values(boost).onConflictDoNothing();
    }

    // 5. Criar algumas compras de serviços premium de exemplo
    console.log('💎 Criando compras de serviços premium de exemplo...');
    
    const createdServices = await db.select().from(premiumServices).limit(3);
    const sampleUserServices = [];
    
    for (let i = 0; i < Math.min(2, existingUsers.length); i++) {
      const user = existingUsers[i];
      const service = createdServices[Math.floor(Math.random() * createdServices.length)];
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + service.duration);
      
      sampleUserServices.push({
        userId: user.id,
        serviceId: service.id,
        bookingId: null, // Pode ser associado a uma reserva específica
        status: Math.random() > 0.2 ? 'active' : 'used', // 80% ativos
        purchasePrice: service.price,
        paymentIntentId: `pi_premium_${Math.random().toString(36).substr(2, 9)}`,
        expiresAt
      });
    }

    for (const userService of sampleUserServices) {
      await db.insert(userPremiumServices).values(userService).onConflictDoNothing();
    }

    console.log('✅ Dados de monetização populados com sucesso!');
    console.log(`
📊 Resumo dos dados criados:
   • ${premiumServicesData.length} serviços premium
   • ${sampleLeads.length} leads qualificados
   • ${sampleBoosts.length} boosts de veículos  
   • ${sampleUserServices.length} compras de serviços premium

🎯 Para testar o novo modelo:
   • Acesse /owner-leads para ver leads qualificados
   • Acesse /vehicles/{id}/boosts para gerenciar boosts
   • Os serviços premium aparecerão durante o checkout
    `);

  } catch (error) {
    console.error('❌ Erro ao popular dados de monetização:', error);
    throw error;
  }
}

// Executar script se chamado diretamente
if (require.main === module) {
  populateMonetizationData()
    .then(() => {
      console.log('🎉 Script concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro ao executar script:', error);
      process.exit(1);
    });
}

module.exports = { populateMonetizationData };