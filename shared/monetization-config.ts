// Configurações do novo modelo de monetização focado em locadores
export const MONETIZATION_CONFIG = {
  // 1. Planos de Assinatura para Locadores (Modelo Freemium)
  SUBSCRIPTION_PLANS: {
    FREE: {
      name: 'free',
      displayName: 'Básico (Gratuito)',
      monthlyPrice: 0,
      annualPrice: 0,
      maxVehicleListings: 1,
      highlightType: null,
      features: [
        'Até 1 anúncio ativo',
        'Cálculo básico de diárias',
        'Calendário de disponibilidade simples',
        'Aparece em buscas orgânicas'
      ]
    },
    PREMIUM: {
      name: 'essencial',
      displayName: 'Plano Essencial',
      monthlyPrice: 39.90,
      annualPrice: 399.90,
      maxVehicleListings: 10, // Até 10 veículos
      highlightType: 'prata',
      features: [
        'Destaque prata (3x mais visualizações)',
        'Relatórios básicos',
        'Gestão simples de anúncios',
        'Suporte por email'
      ]
    },
    ENTERPRISE: {
      name: 'plus',
      displayName: 'Plano Plus',
      monthlyPrice: 149.90,
      annualPrice: 1499.90,
      maxVehicleListings: 50, // Até 50 veículos
      highlightType: 'diamante',
      features: [
        'Destaque diamante (10x mais visualizações)',
        'Relatórios avançados',
        'Gestão completa de frotas',
        'Dashboard multiusuário',
        'API de integração',
        'Suporte prioritário'
      ]
    }
  },

  // 2. Destaque Pago por Anúncio (Pay-per-Boost)
  BOOST_TYPES: {
    HOMEPAGE_HIGHLIGHT: {
      id: 'homepage_highlight',
      name: 'Destaque na Página Inicial',
      description: 'Seu anúncio aparece em destaque na página inicial',
      price: 15.00,
      duration: 7, // dias
    },
    CATEGORY_HIGHLIGHT: {
      id: 'category_highlight',
      name: 'Destaque em Buscas por Categoria',
      description: 'Destaque em buscas específicas (carros populares, SUVs, etc.)',
      price: 10.00,
      duration: 7, // dias
    },
    EVENT_HIGHLIGHT: {
      id: 'event_highlight',
      name: 'Destaque durante Eventos',
      description: 'Destaque durante eventos locais (Carnaval, Rock in Rio, etc.)',
      price: 25.00,
      duration: 7, // dias
    }
  },

  // Preços dos boosts para fácil referência
  BOOST_PRICING: {
    HOMEPAGE_HIGHLIGHT: 15.00,
    CATEGORY_HIGHLIGHT: 10.00,
    EVENT_HIGHLIGHT: 25.00
  },

  // 3. Ferramentas de Gestão Avançada (Módulos Opcionais)
  MANAGEMENT_MODULES: {
    CHECKIN_CHECKOUT: {
      id: 'checkin_checkout',
      name: 'Gestão de Check-in/Check-out',
      description: 'Sistema para registrar entradas/saídas e gerar relatórios de uso',
      monthlyPrice: 19.90
    },
    DYNAMIC_PRICING: {
      id: 'dynamic_pricing',
      name: 'Preços Dinâmicos Automáticos',
      description: 'Ajuste automático de diárias com base em demanda, concorrência ou eventos',
      monthlyPrice: 29.90
    },
    INSURANCE_INTEGRATION: {
      id: 'insurance_integration',
      name: 'Integração com Seguradoras',
      description: 'Conexão direta para oferecer seguros aos locatários',
      monthlyPrice: 15.00
    }
  },

  // 4. Leads Qualificados para Locadores
  LEADS_SYSTEM: {
    LEAD_PACKAGES: [
      {
        quantity: 10,
        price: 50.00,
        description: '10 leads qualificados'
      },
      {
        quantity: 25,
        price: 110.00,
        description: '25 leads qualificados (desconto 12%)'
      },
      {
        quantity: 50,
        price: 200.00,
        description: '50 leads qualificados (desconto 20%)'
      }
    ],
    LEAD_EXPIRY_HOURS: 72 // 3 dias para expirar
  },

  // 5. Serviços Premium para Locatários (Opcionais)
  PREMIUM_SERVICES: {
    DOCUMENT_VERIFICATION: {
      id: 'express_document_verification',
      name: 'Verificação Expressa de Documentos',
      description: 'Locatários pagam para ter seus documentos pré-validados',
      price: 9.90,
      duration: 30 // dias válidos
    },
    PROTECTION_INSURANCE: {
      id: 'protection_insurance',
      name: 'Seguro de Proteção',
      description: 'Parceria com seguradoras para cobrir danos ao veículo/imóvel',
      pricePerDay: 15.00
    },
    GOOD_PAYER_CERTIFICATE: {
      id: 'good_payer_certificate',
      name: 'Certificado de Bom Pagador',
      description: 'Certificado baseado no histórico de aluguéis',
      price: 19.90,
      duration: 90 // dias válidos
    }
  },

  // Configurações gerais
  GENERAL: {
    COMMISSION_RATE: 0.05, // 5% de comissão em seguros por indicação
    LEAD_SCORE_FACTORS: {
      PROFILE_COMPLETED: 10,
      DOCUMENTS_VERIFIED: 15,
      PREVIOUS_RENTALS: 20,
      CONTACT_ATTEMPT: 5
    }
  }
} as const;

export type BoostType = keyof typeof MONETIZATION_CONFIG.BOOST_TYPES;
export type ManagementModule = keyof typeof MONETIZATION_CONFIG.MANAGEMENT_MODULES;
export type PremiumServiceType = keyof typeof MONETIZATION_CONFIG.PREMIUM_SERVICES;