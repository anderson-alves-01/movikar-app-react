#!/usr/bin/env tsx

const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { subscriptionPlans } = require('./shared/schema');
const ws = require('ws');

// Configure WebSocket for Neon
const neonConfig = { webSocketConstructor: ws };

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Default subscription plans
const defaultPlans = [
  {
    name: 'free',
    displayName: 'Plano Gratuito',
    description: 'Ideal para começar no CarShare',
    monthlyPrice: '0.00',
    annualPrice: '0.00',
    maxVehicleListings: 2,
    highlightType: null,
    highlightCount: 0,
    features: [
      '2 anúncios de veículos',
      'Listagem básica nos resultados',
      'Suporte por email',
      'Perfil público básico'
    ],
    isActive: true,
    sortOrder: 0
  },
  {
    name: 'essencial',
    displayName: 'Plano Essencial',
    description: 'Para proprietários ativos que querem mais visibilidade',
    monthlyPrice: '29.90',
    annualPrice: '287.04', // 20% discount: 29.90 * 12 * 0.8 = 287.04
    maxVehicleListings: -1, // unlimited
    highlightType: 'prata',
    highlightCount: 3,
    features: [
      'Anúncios ilimitados de veículos',
      'Destaque prata (3x mais visualizações)',
      'Aparece no topo das pesquisas',
      'Suporte prioritário por email',
      'Estatísticas básicas de performance',
      'Badge de membro essencial'
    ],
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'plus',
    displayName: 'Plano Plus',
    description: 'Para máxima visibilidade e recursos premium',
    monthlyPrice: '59.90',
    annualPrice: '574.08', // 20% discount: 59.90 * 12 * 0.8 = 574.08
    maxVehicleListings: -1, // unlimited
    highlightType: 'diamante',
    highlightCount: 10,
    features: [
      'Anúncios ilimitados de veículos',
      'Destaque diamante (10x mais visualizações)',
      'Prioridade máxima nas pesquisas',
      'Suporte VIP 24/7 por chat',
      'Analytics avançados e relatórios',
      'Badge de proprietário premium',
      'Acesso antecipado a novos recursos',
      'Gerenciador de conta dedicado'
    ],
    isActive: true,
    sortOrder: 2
  }
];

async function populateSubscriptionPlans() {
  try {
    console.log('🚀 Populando planos de assinatura padrão...');
    
    // Check if plans already exist
    const existingPlans = await db.select().from(subscriptionPlans).limit(1);
    
    if (existingPlans.length > 0) {
      console.log('✅ Planos de assinatura já existem no banco de dados');
      return;
    }
    
    // Insert default plans
    for (const plan of defaultPlans) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✅ Plano "${plan.displayName}" criado com sucesso`);
    }
    
    console.log('🎉 Todos os planos de assinatura foram criados com sucesso!');
    
    // Update admin settings with default pricing
    const adminSettingsQuery = `
      INSERT INTO admin_settings (
        id, essential_plan_price, plus_plan_price, annual_discount_percentage,
        service_fee_percentage, insurance_fee_percentage, minimum_booking_days,
        maximum_booking_days, cancellation_policy_days, currency,
        support_email, support_phone, enable_pix_payment, enable_pix_transfer,
        pix_transfer_description, created_at, updated_at
      ) VALUES (
        1, 29.90, 59.90, 20.00, 10.00, 15.00, 1, 30, 2, 'BRL',
        'sac@alugae.mobi', '(11) 9999-9999', false, true,
        'Repasse CarShare', NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET
        essential_plan_price = EXCLUDED.essential_plan_price,
        plus_plan_price = EXCLUDED.plus_plan_price,
        annual_discount_percentage = EXCLUDED.annual_discount_percentage,
        updated_at = NOW()
    `;
    
    await pool.query(adminSettingsQuery);
    console.log('✅ Configurações administrativas atualizadas');
    
  } catch (error) {
    console.error('❌ Erro ao popular planos de assinatura:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
populateSubscriptionPlans()
  .then(() => {
    console.log('✅ Script finalizado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro no script:', error);
    process.exit(1);
  });