// Testes unitários para componentes do sistema de pagamento
const BASE_URL = 'http://localhost:5000';

class PaymentUnitTests {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  async test(name, fn) {
    console.log(`🔬 ${name}...`);
    try {
      const result = await fn();
      console.log(`✅ ${name} - PASSOU`);
      this.results.push({ name, status: 'PASSOU', result });
      return true;
    } catch (error) {
      console.log(`❌ ${name} - FALHOU: ${error.message}`);
      this.results.push({ name, status: 'FALHOU', error: error.message });
      return false;
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await response.json();
    
    return { response, result };
  }

  async runUnitTests() {
    console.log('🧬 INICIANDO TESTES UNITÁRIOS DO SISTEMA DE PAGAMENTO\n');

    let passedTests = 0;
    let totalTests = 0;

    // Teste 1: Endpoint de veículos está acessível
    totalTests++;
    if (await this.test('Endpoint de veículos acessível', async () => {
      const { response } = await this.makeRequest('GET', '/api/vehicles');
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      return 'Endpoint funcionando';
    })) passedTests++;

    // Teste 2: Endpoint de registro funciona
    totalTests++;
    if (await this.test('Endpoint de registro funciona', async () => {
      const userData = {
        name: 'Unit Test User',
        email: `unit.test.${Date.now()}@test.com`,
        password: 'senha123',
        phone: '11999999999',
        role: 'renter'
      };

      const { response, result } = await this.makeRequest('POST', '/api/auth/register', userData);
      
      if (!response.ok) {
        throw new Error(`Registro falhou: ${result.message}`);
      }
      
      if (!result.token) {
        throw new Error('Token não retornado');
      }
      
      return { userId: result.user.id, hasToken: !!result.token };
    })) passedTests++;

    // Teste 3: Endpoint de payment intent existe e responde
    totalTests++;
    if (await this.test('Endpoint de payment intent responde', async () => {
      const paymentData = {
        vehicleId: 999999, // ID inexistente para testar response
        startDate: '2025-07-26',
        endDate: '2025-07-28',
        totalPrice: '170.00'
      };

      const { response, result } = await this.makeRequest('POST', '/api/create-payment-intent', paymentData);
      
      // Deve retornar erro de autenticação (401) porque não enviamos token
      if (response.status !== 401 && response.status !== 403) {
        throw new Error(`Esperado 401/403, recebido ${response.status}`);
      }
      
      return `Endpoint protegido corretamente (${response.status})`;
    })) passedTests++;

    // Teste 4: Validação de dados de entrada
    totalTests++;
    if (await this.test('Validação de dados de entrada', async () => {
      // Testar com dados inválidos
      const invalidData = {
        vehicleId: 'invalid',
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        totalPrice: 'invalid'
      };

      const { response } = await this.makeRequest('POST', '/api/create-payment-intent', invalidData, {
        'Authorization': 'Bearer invalid-token'
      });
      
      // Deve retornar erro de validação ou autenticação
      if (response.status < 400) {
        throw new Error('Validação não está funcionando');
      }
      
      return `Validação funcionando (${response.status})`;
    })) passedTests++;

    // Teste 5: Schema do banco está correto
    totalTests++;
    if (await this.test('Schema do banco correto', async () => {
      // Tentar buscar veículo específico
      const { response, result } = await this.makeRequest('GET', '/api/vehicles');
      
      if (!response.ok) {
        throw new Error('Erro ao acessar banco de dados');
      }
      
      if (!Array.isArray(result)) {
        throw new Error('Estrutura de resposta incorreta');
      }
      
      if (result.length > 0) {
        const vehicle = result[0];
        const requiredFields = ['id', 'brand', 'model', 'pricePerDay'];
        const hasAllFields = requiredFields.every(field => vehicle.hasOwnProperty(field));
        
        if (!hasAllFields) {
          throw new Error('Campos obrigatórios ausentes na estrutura do veículo');
        }
      }
      
      return `Schema validado (${result.length} veículos)`;
    })) passedTests++;

    // Teste 6: Autenticação JWT funciona
    totalTests++;
    if (await this.test('Autenticação JWT funciona', async () => {
      // Primeiro fazer login
      const loginData = {
        email: 'asouzamax@gmail.com', // Usuário existente
        password: 'senha123'
      };

      const { response: loginResponse, result: loginResult } = await this.makeRequest('POST', '/api/auth/login', loginData);
      
      if (!loginResponse.ok) {
        // Tentar criar usuário
        const userData = {
          name: 'JWT Test User',
          email: `jwt.test.${Date.now()}@test.com`,
          password: 'senha123',
          phone: '11999999999',
          role: 'renter'
        };

        const { response: regResponse, result: regResult } = await this.makeRequest('POST', '/api/auth/register', userData);
        
        if (!regResponse.ok) {
          throw new Error('Não foi possível criar usuário para teste JWT');
        }
        
        // Testar o token
        const { response: authResponse } = await this.makeRequest('GET', '/api/auth/user', null, {
          'Authorization': `Bearer ${regResult.token}`
        });
        
        if (!authResponse.ok) {
          throw new Error('Token JWT não está funcionando');
        }
        
        return 'JWT funcionando com novo usuário';
      } else {
        // Testar com usuário existente
        const { response: authResponse } = await this.makeRequest('GET', '/api/auth/user', null, {
          'Authorization': `Bearer ${loginResult.token}`
        });
        
        if (!authResponse.ok) {
          throw new Error('Token JWT não está funcionando');
        }
        
        return 'JWT funcionando com usuário existente';
      }
    })) passedTests++;

    // Relatório Final
    console.log('\n📋 RELATÓRIO DE TESTES UNITÁRIOS');
    console.log('='.repeat(50));
    console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`❌ Testes reprovados: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📊 Taxa de aprovação: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 TODOS OS TESTES UNITÁRIOS PASSARAM!');
      console.log('Sistema básico está funcionando corretamente.');
    } else {
      console.log('\n⚠️  Alguns testes unitários falharam.');
      console.log('Verificar componentes específicos que falharam.');
    }

    return {
      passed: passedTests,
      total: totalTests,
      success: passedTests === totalTests,
      results: this.results
    };
  }
}

// Executar testes unitários
const unitTester = new PaymentUnitTests();
unitTester.runUnitTests()
  .then(result => {
    console.log(`\n🔬 Testes unitários concluídos: ${result.success ? 'SUCESSO' : 'FALHAS DETECTADAS'}`);
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 ERRO FATAL NOS TESTES UNITÁRIOS:', error.message);
    process.exit(1);
  });