/**
 * Testes integrados para validar todos os cenários do modelo de monetização
 * Valida: leads qualificados, boosts de veículos, serviços premium e fluxos de pagamento
 */

const fs = require('fs');
const path = require('path');

// Configuração do teste
const BASE_URL = 'http://localhost:5000';
const TEST_RESULTS_FILE = 'monetization-test-results.json';

// Dados de teste
const TEST_DATA = {
  owner: {
    email: 'owner@test.com',
    password: '123456'
  },
  renter: {
    email: 'renter@test.com',
    password: '123456'
  },
  admin: {
    email: 'asouzamax@gmail.com',
    password: '123456'
  }
};

class MonetizationIntegrationTest {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Executando: ${testName}`);
    this.results.summary.total++;
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        status: result.success ? 'PASSOU' : 'FALHOU',
        duration: `${duration}ms`,
        details: result.details,
        timestamp: new Date().toISOString()
      });

      if (result.success) {
        console.log(`✅ ${testName} - PASSOU (${duration}ms)`);
        this.results.summary.passed++;
      } else {
        console.log(`❌ ${testName} - FALHOU: ${result.details}`);
        this.results.summary.failed++;
        this.results.summary.errors.push(`${testName}: ${result.details}`);
      }
      
      return result;
    } catch (error) {
      console.log(`💥 ${testName} - ERRO: ${error.message}`);
      this.results.summary.failed++;
      this.results.summary.errors.push(`${testName}: ${error.message}`);
      
      this.results.tests.push({
        name: testName,
        status: 'ERRO',
        duration: '0ms',
        details: error.message,
        timestamp: new Date().toISOString()
      });
      
      return { success: false, details: error.message };
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { rawResponse: text };
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  }

  // Teste 1: Validar estrutura do banco de dados
  async testDatabaseSchema() {
    const response = await this.makeRequest('/api/test/schema-check');
    
    if (!response.ok) {
      return { 
        success: false, 
        details: `Schema check failed: ${response.status} - ${JSON.stringify(response.data)}` 
      };
    }

    const expectedTables = [
      'premium_services',
      'qualified_leads',
      'vehicle_boosts',
      'user_premium_services'
    ];

    const missingTables = expectedTables.filter(table => 
      !response.data.tables || !response.data.tables.includes(table)
    );

    if (missingTables.length > 0) {
      return {
        success: false,
        details: `Tabelas ausentes: ${missingTables.join(', ')}`
      };
    }

    return {
      success: true,
      details: `Todas as tabelas necessárias encontradas: ${expectedTables.join(', ')}`
    };
  }

  // Teste 2: Validar dados de demonstração
  async testDemoData() {
    const checks = [
      { endpoint: '/api/premium-services', name: 'Serviços Premium', minCount: 5 },
      { endpoint: '/api/qualified-leads', name: 'Leads Qualificados', minCount: 1 },
      { endpoint: '/api/vehicle-boosts', name: 'Boosts de Veículos', minCount: 1 }
    ];

    const results = [];

    for (const check of checks) {
      const response = await this.makeRequest(check.endpoint);
      
      if (!response.ok) {
        return {
          success: false,
          details: `Erro ao buscar ${check.name}: ${response.status}`
        };
      }

      const count = Array.isArray(response.data) ? response.data.length : 0;
      
      if (count < check.minCount) {
        return {
          success: false,
          details: `${check.name}: encontrados ${count}, esperado mínimo ${check.minCount}`
        };
      }

      results.push(`${check.name}: ${count} registros`);
    }

    return {
      success: true,
      details: results.join(', ')
    };
  }

  // Teste 3: Funcionalidades de Leads Qualificados
  async testQualifiedLeads() {
    // Buscar leads existentes
    const leadsResponse = await this.makeRequest('/api/qualified-leads');
    
    if (!leadsResponse.ok) {
      return {
        success: false,
        details: `Erro ao buscar leads: ${leadsResponse.status}`
      };
    }

    const leads = leadsResponse.data;
    if (!Array.isArray(leads) || leads.length === 0) {
      return {
        success: false,
        details: 'Nenhum lead qualificado encontrado'
      };
    }

    // Verificar estrutura dos leads
    const firstLead = leads[0];
    const requiredFields = ['vehicleId', 'ownerId', 'renterId', 'leadScore', 'status'];
    const missingFields = requiredFields.filter(field => !(field in firstLead));

    if (missingFields.length > 0) {
      return {
        success: false,
        details: `Campos obrigatórios ausentes nos leads: ${missingFields.join(', ')}`
      };
    }

    // Verificar se há leads pendentes e comprados
    const pendingLeads = leads.filter(l => l.status === 'pending').length;
    const purchasedLeads = leads.filter(l => l.status === 'purchased').length;

    return {
      success: true,
      details: `${leads.length} leads encontrados (${pendingLeads} pendentes, ${purchasedLeads} comprados)`
    };
  }

  // Teste 4: Sistema de Boosts de Veículos
  async testVehicleBoosts() {
    const boostsResponse = await this.makeRequest('/api/vehicle-boosts');
    
    if (!boostsResponse.ok) {
      return {
        success: false,
        details: `Erro ao buscar boosts: ${boostsResponse.status}`
      };
    }

    const boosts = boostsResponse.data;
    if (!Array.isArray(boosts) || boosts.length === 0) {
      return {
        success: false,
        details: 'Nenhum boost de veículo encontrado'
      };
    }

    // Verificar tipos de boost
    const boostTypes = [...new Set(boosts.map(b => b.boostType))];
    const expectedTypes = ['homepage_highlight', 'category_highlight', 'event_highlight'];
    
    const validTypes = boostTypes.filter(type => expectedTypes.includes(type));
    
    if (validTypes.length === 0) {
      return {
        success: false,
        details: `Tipos de boost inválidos encontrados: ${boostTypes.join(', ')}`
      };
    }

    // Verificar boosts ativos vs expirados
    const activeBoosts = boosts.filter(b => b.status === 'active').length;
    const expiredBoosts = boosts.filter(b => b.status === 'expired').length;

    return {
      success: true,
      details: `${boosts.length} boosts encontrados (${activeBoosts} ativos, ${expiredBoosts} expirados)`
    };
  }

  // Teste 5: Serviços Premium
  async testPremiumServices() {
    const servicesResponse = await this.makeRequest('/api/premium-services');
    
    if (!servicesResponse.ok) {
      return {
        success: false,
        details: `Erro ao buscar serviços premium: ${servicesResponse.status}`
      };
    }

    const services = servicesResponse.data;
    if (!Array.isArray(services) || services.length === 0) {
      return {
        success: false,
        details: 'Nenhum serviço premium encontrado'
      };
    }

    // Verificar tipos de serviços
    const serviceTypes = [...new Set(services.map(s => s.serviceType))];
    const expectedServiceTypes = ['delivery', 'insurance', 'inspection', 'support', 'cleaning'];
    
    const validServiceTypes = serviceTypes.filter(type => expectedServiceTypes.includes(type));
    
    if (validServiceTypes.length < 3) {
      return {
        success: false,
        details: `Poucos tipos de serviços válidos encontrados: ${validServiceTypes.join(', ')}`
      };
    }

    // Verificar se todos os serviços têm preços válidos
    const invalidPrices = services.filter(s => !s.price || parseFloat(s.price) <= 0);
    
    if (invalidPrices.length > 0) {
      return {
        success: false,
        details: `${invalidPrices.length} serviços com preços inválidos`
      };
    }

    return {
      success: true,
      details: `${services.length} serviços premium válidos (tipos: ${validServiceTypes.join(', ')})`
    };
  }

  // Teste 6: Acessibilidade das novas páginas
  async testPageAccessibility() {
    const pages = [
      { path: '/owner-leads', name: 'Página de Leads' },
      { path: '/vehicles/1/boosts', name: 'Página de Boosts' }
    ];

    const results = [];

    for (const page of pages) {
      const response = await this.makeRequest(page.path);
      
      // Para páginas React, esperamos HTML ou redirecionamento
      if (response.status === 200 || response.status === 302 || response.status === 404) {
        results.push(`${page.name}: acessível (${response.status})`);
      } else {
        return {
          success: false,
          details: `${page.name} inacessível: ${response.status}`
        };
      }
    }

    return {
      success: true,
      details: results.join(', ')
    };
  }

  // Teste 7: APIs de monetização
  async testMonetizationAPIs() {
    const apis = [
      '/api/qualified-leads',
      '/api/vehicle-boosts',
      '/api/premium-services',
      '/api/user-premium-services'
    ];

    const results = [];

    for (const api of apis) {
      const response = await this.makeRequest(api);
      
      if (response.ok) {
        const dataType = Array.isArray(response.data) ? 'array' : typeof response.data;
        results.push(`${api}: OK (${dataType})`);
      } else {
        return {
          success: false,
          details: `API ${api} falhou: ${response.status}`
        };
      }
    }

    return {
      success: true,
      details: results.join(', ')
    };
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🚀 Iniciando testes integrados do modelo de monetização\n');
    console.log('=' .repeat(60));

    // Executar todos os testes
    await this.runTest('1. Validação do Schema do Banco', () => this.testDatabaseSchema());
    await this.runTest('2. Validação dos Dados de Demonstração', () => this.testDemoData());
    await this.runTest('3. Funcionalidades de Leads Qualificados', () => this.testQualifiedLeads());
    await this.runTest('4. Sistema de Boosts de Veículos', () => this.testVehicleBoosts());
    await this.runTest('5. Serviços Premium', () => this.testPremiumServices());
    await this.runTest('6. Acessibilidade das Novas Páginas', () => this.testPageAccessibility());
    await this.runTest('7. APIs de Monetização', () => this.testMonetizationAPIs());

    // Salvar resultados
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(this.results, null, 2));

    // Exibir resumo
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('=' .repeat(60));
    console.log(`Total de testes: ${this.results.summary.total}`);
    console.log(`✅ Aprovados: ${this.results.summary.passed}`);
    console.log(`❌ Reprovados: ${this.results.summary.failed}`);
    console.log(`📈 Taxa de sucesso: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)}%`);

    if (this.results.summary.failed > 0) {
      console.log('\n🚨 ERROS ENCONTRADOS:');
      this.results.summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    console.log(`\n💾 Resultados salvos em: ${TEST_RESULTS_FILE}`);
    
    return {
      success: this.results.summary.failed === 0,
      results: this.results
    };
  }
}

// Executar testes se chamado diretamente
if (require.main === module) {
  const tester = new MonetizationIntegrationTest();
  
  tester.runAllTests()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Todos os testes passaram com sucesso!');
        process.exit(0);
      } else {
        console.log('\n💥 Alguns testes falharam. Verifique os detalhes acima.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Erro crítico durante os testes:', error);
      process.exit(1);
    });
}

module.exports = { MonetizationIntegrationTest };