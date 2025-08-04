#!/usr/bin/env node

/**
 * Test Runner Script - alugae.mobi
 * 
 * Script para executar diferentes tipos de testes com opções flexíveis
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configurações
const config = {
  cypressConfig: 'cypress.config.ts',
  resultsDir: 'cypress/results',
  screenshotsDir: 'cypress/screenshots',
  videosDir: 'cypress/videos',
  baseUrl: 'http://localhost:5000',
  browser: 'chrome',
  timeout: 600000 // 10 minutos
};

// Conjuntos de testes predefinidos
const testSuites = {
  smoke: [
    'cypress/e2e/01-authentication.cy.ts',
    'cypress/e2e/03-booking-system.cy.ts'
  ],
  critical: [
    'cypress/e2e/01-authentication.cy.ts',
    'cypress/e2e/03-booking-system.cy.ts',
    'cypress/e2e/05-subscription-system.cy.ts',
    'cypress/e2e/06-admin-panel.cy.ts'
  ],
  full: [
    'cypress/e2e/01-authentication.cy.ts',
    'cypress/e2e/02-vehicle-management.cy.ts',
    'cypress/e2e/03-booking-system.cy.ts',
    'cypress/e2e/04-rewards-system.cy.ts',
    'cypress/e2e/05-subscription-system.cy.ts',
    'cypress/e2e/06-admin-panel.cy.ts',
    'cypress/e2e/07-messaging-system.cy.ts',
    'cypress/e2e/08-integration-tests.cy.ts'
  ],
  performance: [
    'cypress/e2e/09-performance-tests.cy.ts'
  ],
  accessibility: [
    'cypress/e2e/10-accessibility-tests.cy.ts'
  ]
};

class TestRunner {
  constructor(options = {}) {
    this.options = {
      suite: 'full',
      browser: config.browser,
      headless: true,
      record: false,
      parallel: false,
      spec: null,
      timeout: config.timeout,
      retries: 2,
      ...options
    };
    
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      startTime: Date.now()
    };
  }

  log(message, color = '\x1b[0m') {
    const timestamp = new Date().toISOString();
    console.log(`${color}[${timestamp}] ${message}\x1b[0m`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, '\x1b[32m');
  }

  logError(message) {
    this.log(`❌ ${message}`, '\x1b[31m');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, '\x1b[34m');
  }

  setupDirectories() {
    const dirs = [config.resultsDir, config.screenshotsDir, config.videosDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logInfo(`Criado diretório: ${dir}`);
      }
    });
  }

  getTestSpecs() {
    if (this.options.spec) {
      return [this.options.spec];
    }
    
    const suite = testSuites[this.options.suite];
    if (!suite) {
      throw new Error(`Suite de testes '${this.options.suite}' não encontrada`);
    }
    
    return suite;
  }

  buildCypressCommand() {
    const specs = this.getTestSpecs();
    const specPattern = specs.join(',');
    
    let command = 'npx cypress run';
    
    // Configurações básicas
    command += ` --spec "${specPattern}"`;
    command += ` --browser ${this.options.browser}`;
    command += ` --config baseUrl=${config.baseUrl}`;
    
    if (this.options.headless) {
      command += ' --headless';
    }
    
    // Relatórios
    command += ' --reporter json';
    command += ` --reporter-options output=${config.resultsDir}/test-results.json`;
    
    // Configurações de timeout
    command += ` --config defaultCommandTimeout=${this.options.timeout}`;
    
    // Parallelização (se suportado)
    if (this.options.parallel) {
      command += ' --parallel';
    }
    
    // Recording (se configurado)
    if (this.options.record && process.env.CYPRESS_RECORD_KEY) {
      command += ' --record';
    }
    
    return command;
  }

  async checkApplication() {
    this.logInfo('Verificando se a aplicação está rodando...');
    
    try {
      const healthCheck = execSync('curl -f http://localhost:5000/api/health', { 
        stdio: 'pipe',
        timeout: 10000 
      });
      
      this.logSuccess('Aplicação está respondendo');
      return true;
    } catch (error) {
      this.logError('Aplicação não está respondendo');
      return false;
    }
  }

  async runTests() {
    this.log('\n🧪 EXECUTANDO TESTES CYPRESS', '\x1b[36m\x1b[1m');
    this.log('='.repeat(50), '\x1b[36m');
    
    this.setupDirectories();
    
    // Verificar aplicação
    const appRunning = await this.checkApplication();
    if (!appRunning) {
      throw new Error('Aplicação não está rodando. Execute: npm run dev');
    }
    
    // Obter specs dos testes
    const specs = this.getTestSpecs();
    this.logInfo(`Executando ${specs.length} arquivo(s) de teste:`);
    specs.forEach(spec => console.log(`  - ${spec}`));
    
    // Construir comando
    const command = this.buildCypressCommand();
    this.logInfo(`Comando: ${command}`);
    
    // Executar testes com retries
    let attempt = 0;
    let testResult = null;
    
    while (attempt < this.options.retries) {
      attempt++;
      
      try {
        this.logInfo(`Tentativa ${attempt}/${this.options.retries}`);
        
        const output = execSync(command, {
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: this.options.timeout
        });
        
        this.logSuccess('Testes executados com sucesso');
        testResult = { success: true, output };
        break;
        
      } catch (error) {
        this.logError(`Tentativa ${attempt} falhou`);
        testResult = { success: false, error: error.message, output: error.stdout };
        
        if (attempt < this.options.retries) {
          this.logInfo('Aguardando 10 segundos antes da próxima tentativa...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
    
    return testResult;
  }

  parseResults() {
    const resultsPath = path.join(config.resultsDir, 'test-results.json');
    
    if (!fs.existsSync(resultsPath)) {
      this.logError('Arquivo de resultados não encontrado');
      return null;
    }
    
    try {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      
      this.results.total = results.stats.tests;
      this.results.passed = results.stats.passes;
      this.results.failed = results.stats.failures;
      this.results.duration = results.stats.duration;
      
      return results;
    } catch (error) {
      this.logError(`Erro ao analisar resultados: ${error.message}`);
      return null;
    }
  }

  generateReport(results) {
    this.log('\n📊 RELATÓRIO DE TESTES', '\x1b[36m\x1b[1m');
    this.log('='.repeat(50), '\x1b[36m');
    
    if (results) {
      console.log(`📋 Total de testes: ${results.stats.tests}`);
      console.log(`✅ Sucessos: ${results.stats.passes}`);
      console.log(`❌ Falhas: ${results.stats.failures}`);
      console.log(`⏳ Pendentes: ${results.stats.pending}`);
      console.log(`⏱️  Duração: ${(results.stats.duration / 1000).toFixed(2)}s`);
      
      if (results.failures && results.failures.length > 0) {
        this.log('\n❌ TESTES QUE FALHARAM:', '\x1b[31m');
        results.failures.forEach((failure, index) => {
          console.log(`${index + 1}. ${failure.fullTitle}`);
          console.log(`   Erro: ${failure.err.message}`);
        });
      }
      
      // Calcular taxa de sucesso
      const successRate = ((results.stats.passes / results.stats.tests) * 100).toFixed(1);
      console.log(`\n📈 Taxa de sucesso: ${successRate}%`);
      
      // Determinar se passou
      const passed = results.stats.failures === 0;
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASSOU' : 'FALHOU';
      const color = passed ? '\x1b[32m' : '\x1b[31m';
      
      this.log(`\n${icon} RESULTADO FINAL: ${status}`, color);
      
      return passed;
    }
    
    return false;
  }

  async run() {
    try {
      const totalStartTime = Date.now();
      
      this.log('\n🚀 INICIANDO EXECUÇÃO DE TESTES', '\x1b[36m\x1b[1m');
      this.log(`Suite: ${this.options.suite}`, '\x1b[36m');
      this.log(`Browser: ${this.options.browser}`, '\x1b[36m');
      this.log(`Headless: ${this.options.headless}`, '\x1b[36m');
      
      // Executar testes
      const testResult = await this.runTests();
      
      if (!testResult.success) {
        throw new Error('Execução dos testes falhou');
      }
      
      // Analisar resultados
      const results = this.parseResults();
      const passed = this.generateReport(results);
      
      const totalDuration = (Date.now() - totalStartTime) / 1000;
      this.log(`\n⏱️  Tempo total: ${totalDuration.toFixed(2)}s`);
      
      if (passed) {
        this.logSuccess('Todos os testes passaram!');
        process.exit(0);
      } else {
        this.logError('Alguns testes falharam');
        process.exit(1);
      }
      
    } catch (error) {
      this.log('\n💥 EXECUÇÃO DE TESTES FALHOU', '\x1b[31m\x1b[1m');
      this.logError(`Erro: ${error.message}`);
      process.exit(1);
    }
  }
}

// CLI Interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--suite':
        options.suite = args[++i];
        break;
      case '--spec':
        options.spec = args[++i];
        break;
      case '--browser':
        options.browser = args[++i];
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--record':
        options.record = true;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--retries':
        options.retries = parseInt(args[++i]);
        break;
      case '--help':
        showHelp();
        process.exit(0);
        break;
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
🧪 Test Runner - alugae.mobi

USAGE:
  node scripts/run-tests.js [options]

OPTIONS:
  --suite <name>      Test suite to run (smoke, critical, full, performance, accessibility)
  --spec <path>       Specific test file to run
  --browser <name>    Browser to use (chrome, firefox, edge)
  --headed            Run in headed mode (default: headless)
  --record            Record tests (requires CYPRESS_RECORD_KEY)
  --parallel          Run tests in parallel
  --retries <num>     Number of retries (default: 2)
  --help              Show this help

EXAMPLES:
  node scripts/run-tests.js --suite smoke
  node scripts/run-tests.js --spec cypress/e2e/01-authentication.cy.ts
  node scripts/run-tests.js --suite full --headed
  node scripts/run-tests.js --suite critical --browser firefox

TEST SUITES:
  smoke         - Basic functionality tests
  critical      - Core business logic tests  
  full          - All main functionality tests
  performance   - Performance and load tests
  accessibility - Accessibility compliance tests
`);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  const runner = new TestRunner(options);
  runner.run();
}

export default TestRunner;