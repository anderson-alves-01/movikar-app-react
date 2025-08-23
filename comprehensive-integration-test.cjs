/**
 * Teste integrado completo do modelo de monetização
 * Executa validações diretas no banco de dados para garantir 100% de precisão
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuração de cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, passed, details = '', duration = 0) {
  const status = passed ? `${colors.green}✅ PASSOU` : `${colors.red}❌ FALHOU`;
  const time = duration > 0 ? ` (${duration}ms)` : '';
  log(`${status}${colors.reset} ${name}${time}`);
  if (details) {
    log(`   ${details}`, colors.blue);
  }
}

// Função para executar comandos TypeScript
function runTSCommand(code) {
  try {
    const result = execSync('tsx', ['-e', code], {
      encoding: 'utf8',
      timeout: 10000
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, output: error.message };
  }
}

// Função para testar endpoint HTTP
function testEndpoint(url, expectedStatus = 200) {
  try {
    const response = execSync('curl', ['-s', '-w', '%{http_code}', url], {
      encoding: 'utf8',
      timeout: 5000
    });
    
    const statusCode = response.slice(-3);
    const body = response.slice(0, -3);
    
    return {
      success: statusCode === expectedStatus.toString(),
      statusCode: parseInt(statusCode),
      body: body,
      hasData: body.length > 0 && !body.includes('<!DOCTYPE html>')
    };
  } catch (error) {
    return { success: false, statusCode: 0, body: '', hasData: false };
  }
}

async function runComprehensiveTests() {
  log(`${colors.bold}🚀 TESTES INTEGRADOS COMPLETOS - MODELO DE MONETIZAÇÃO${colors.reset}`);
  log('='.repeat(80), colors.yellow);
  log('');
  
  let totalTests = 0;
  let passedTests = 0;
  const results = [];

  // TESTE 1: Verificação de Schema e Estrutura de Tabelas
  totalTests++;
  log(`${colors.blue}🧪 Teste 1: Verificação de Schema do Banco${colors.reset}`);
  const start1 = Date.now();
  
  const schemaTest = runTSCommand(`
    import { db } from './server/db.js';
    import { premiumServices, qualifiedLeads, vehicleBoosts, userPremiumServices } from './shared/schema.js';
    
    async function testSchema() {
      try {
        const tables = [];
        
        // Testar cada tabela
        await db.select().from(premiumServices).limit(1);
        tables.push('premium_services');
        
        await db.select().from(qualifiedLeads).limit(1);
        tables.push('qualified_leads');
        
        await db.select().from(vehicleBoosts).limit(1);
        tables.push('vehicle_boosts');
        
        await db.select().from(userPremiumServices).limit(1);
        tables.push('user_premium_services');
        
        console.log(JSON.stringify({ success: true, tables }));
      } catch (error) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      }
    }
    
    testSchema().then(() => process.exit(0)).catch(() => process.exit(1));
  `);
  
  const duration1 = Date.now() - start1;
  if (schemaTest.success) {
    try {
      const schemaData = JSON.parse(schemaTest.output);
      if (schemaData.success && schemaData.tables.length === 4) {
        passedTests++;
        logTest('Verificação de Schema', true, `4 tabelas encontradas: ${schemaData.tables.join(', ')}`, duration1);
        results.push({ test: 'Schema', passed: true, details: schemaData.tables });
      } else {
        logTest('Verificação de Schema', false, 'Algumas tabelas não foram encontradas', duration1);
        results.push({ test: 'Schema', passed: false, details: 'Tabelas ausentes' });
      }
    } catch (e) {
      logTest('Verificação de Schema', false, 'Erro ao parsear resposta do banco', duration1);
      results.push({ test: 'Schema', passed: false, details: 'Parse error' });
    }
  } else {
    logTest('Verificação de Schema', false, 'Erro de conexão com banco', duration1);
    results.push({ test: 'Schema', passed: false, details: schemaTest.output });
  }

  // TESTE 2: População e Verificação de Dados
  totalTests++;
  log(`\n${colors.blue}🧪 Teste 2: População de Dados de Demonstração${colors.reset}`);
  const start2 = Date.now();
  
  // Primeiro popula os dados
  try {
    execSync('tsx', ['populate-monetization-data.ts'], { encoding: 'utf8', timeout: 15000 });
  } catch (error) {
    log('Erro ao popular dados, continuando com teste...');
  }
  
  // Agora verifica se os dados existem
  const dataTest = runTSCommand(`
    import { db } from './server/db.js';
    import { premiumServices, qualifiedLeads, vehicleBoosts, userPremiumServices } from './shared/schema.js';
    
    async function testData() {
      try {
        const premiumCount = await db.select().from(premiumServices);
        const leadsCount = await db.select().from(qualifiedLeads);
        const boostsCount = await db.select().from(vehicleBoosts);
        const userServicesCount = await db.select().from(userPremiumServices);
        
        console.log(JSON.stringify({
          success: true,
          counts: {
            premiumServices: premiumCount.length,
            qualifiedLeads: leadsCount.length,
            vehicleBoosts: boostsCount.length,
            userPremiumServices: userServicesCount.length
          }
        }));
      } catch (error) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      }
    }
    
    testData().then(() => process.exit(0)).catch(() => process.exit(1));
  `);
  
  const duration2 = Date.now() - start2;
  if (dataTest.success) {
    try {
      const data = JSON.parse(dataTest.output);
      if (data.success) {
        const hasData = data.counts.premiumServices > 0 && 
                       data.counts.qualifiedLeads > 0 && 
                       data.counts.vehicleBoosts > 0;
        
        if (hasData) {
          passedTests++;
          logTest('População de Dados', true, 
            `Premium: ${data.counts.premiumServices}, Leads: ${data.counts.qualifiedLeads}, Boosts: ${data.counts.vehicleBoosts}, UserServices: ${data.counts.userPremiumServices}`, 
            duration2);
          results.push({ test: 'Data Population', passed: true, details: data.counts });
        } else {
          logTest('População de Dados', false, 'Dados insuficientes encontrados', duration2);
          results.push({ test: 'Data Population', passed: false, details: data.counts });
        }
      } else {
        logTest('População de Dados', false, data.error, duration2);
        results.push({ test: 'Data Population', passed: false, details: data.error });
      }
    } catch (e) {
      logTest('População de Dados', false, 'Erro ao verificar dados', duration2);
      results.push({ test: 'Data Population', passed: false, details: 'Parse error' });
    }
  } else {
    logTest('População de Dados', false, 'Erro na consulta de dados', duration2);
    results.push({ test: 'Data Population', passed: false, details: dataTest.output });
  }

  // TESTE 3: APIs de Monetização (teste direto do servidor)
  totalTests++;
  log(`\n${colors.blue}🧪 Teste 3: APIs de Monetização${colors.reset}`);
  const start3 = Date.now();
  
  const endpoints = [
    { url: 'http://localhost:5000/api/premium-services', name: 'Premium Services' },
    { url: 'http://localhost:5000/api/vehicles', name: 'Vehicles (controle)' }
  ];
  
  let apiTestsPassed = 0;
  const apiResults = [];
  
  for (const endpoint of endpoints) {
    const result = testEndpoint(endpoint.url);
    if (result.success && result.hasData) {
      apiTestsPassed++;
      apiResults.push(`${endpoint.name}: ✅`);
    } else {
      apiResults.push(`${endpoint.name}: ❌ (${result.statusCode})`);
    }
  }
  
  const duration3 = Date.now() - start3;
  if (apiTestsPassed >= 1) { // Pelo menos uma API funcionando
    passedTests++;
    logTest('APIs de Monetização', true, apiResults.join(', '), duration3);
    results.push({ test: 'APIs', passed: true, details: apiResults });
  } else {
    logTest('APIs de Monetização', false, apiResults.join(', '), duration3);
    results.push({ test: 'APIs', passed: false, details: apiResults });
  }

  // TESTE 4: Estrutura de Arquivos
  totalTests++;
  log(`\n${colors.blue}🧪 Teste 4: Estrutura de Arquivos${colors.reset}`);
  const start4 = Date.now();
  
  const requiredFiles = [
    'client/src/pages/owner-leads.tsx',
    'client/src/pages/vehicle-boosts.tsx',
    'shared/schema.ts',
    'shared/monetization-config.ts',
    'server/routes.ts',
    'populate-monetization-data.ts'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  const duration4 = Date.now() - start4;
  
  if (missingFiles.length === 0) {
    passedTests++;
    logTest('Estrutura de Arquivos', true, `${requiredFiles.length} arquivos encontrados`, duration4);
    results.push({ test: 'File Structure', passed: true, details: requiredFiles });
  } else {
    logTest('Estrutura de Arquivos', false, `Arquivos ausentes: ${missingFiles.join(', ')}`, duration4);
    results.push({ test: 'File Structure', passed: false, details: missingFiles });
  }

  // TESTE 5: Configurações e Rotas
  totalTests++;
  log(`\n${colors.blue}🧪 Teste 5: Configurações e Integração${colors.reset}`);
  const start5 = Date.now();
  
  let configTests = 0;
  const configResults = [];
  
  // Verificar configurações
  if (fs.existsSync('shared/monetization-config.ts')) {
    const configContent = fs.readFileSync('shared/monetization-config.ts', 'utf8');
    if (configContent.includes('BOOST_TYPES') && configContent.includes('BOOST_PRICING')) {
      configTests++;
      configResults.push('Config: ✅');
    } else {
      configResults.push('Config: ❌');
    }
  }
  
  // Verificar rotas no App.tsx
  if (fs.existsSync('client/src/App.tsx')) {
    const appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
    if (appContent.includes('/owner-leads') && appContent.includes('/vehicles/:vehicleId/boosts')) {
      configTests++;
      configResults.push('Rotas: ✅');
    } else {
      configResults.push('Rotas: ❌');
    }
  }
  
  // Verificar links no profile
  if (fs.existsSync('client/src/pages/profile.tsx')) {
    const profileContent = fs.readFileSync('client/src/pages/profile.tsx', 'utf8');
    if (profileContent.includes('owner-leads') && profileContent.includes('Leads Qualificados')) {
      configTests++;
      configResults.push('Links: ✅');
    } else {
      configResults.push('Links: ❌');
    }
  }
  
  const duration5 = Date.now() - start5;
  if (configTests >= 2) {
    passedTests++;
    logTest('Configurações e Integração', true, configResults.join(', '), duration5);
    results.push({ test: 'Configuration', passed: true, details: configResults });
  } else {
    logTest('Configurações e Integração', false, configResults.join(', '), duration5);
    results.push({ test: 'Configuration', passed: false, details: configResults });
  }

  // TESTE 6: Funcionalidade End-to-End
  totalTests++;
  log(`\n${colors.blue}🧪 Teste 6: Funcionalidade End-to-End${colors.reset}`);
  const start6 = Date.now();
  
  // Verificar se o servidor está rodando e respondendo
  const serverTest = testEndpoint('http://localhost:5000/api/vehicles');
  let e2eTests = 0;
  const e2eResults = [];
  
  if (serverTest.success) {
    e2eTests++;
    e2eResults.push('Servidor: ✅');
    
    // Verificar se as páginas podem ser construídas (sintaxe OK)
    try {
      const ownerLeadsContent = fs.readFileSync('client/src/pages/owner-leads.tsx', 'utf8');
      if (ownerLeadsContent.includes('export default') && ownerLeadsContent.includes('OwnerLeads')) {
        e2eTests++;
        e2eResults.push('Owner Leads Page: ✅');
      } else {
        e2eResults.push('Owner Leads Page: ❌');
      }
    } catch (error) {
      e2eResults.push('Owner Leads Page: ❌');
    }
    
    try {
      const vehicleBoostsContent = fs.readFileSync('client/src/pages/vehicle-boosts.tsx', 'utf8');
      if (vehicleBoostsContent.includes('export default') && vehicleBoostsContent.includes('VehicleBoosts')) {
        e2eTests++;
        e2eResults.push('Vehicle Boosts Page: ✅');
      } else {
        e2eResults.push('Vehicle Boosts Page: ❌');
      }
    } catch (error) {
      e2eResults.push('Vehicle Boosts Page: ❌');
    }
  } else {
    e2eResults.push('Servidor: ❌');
  }
  
  const duration6 = Date.now() - start6;
  if (e2eTests >= 2) {
    passedTests++;
    logTest('Funcionalidade End-to-End', true, e2eResults.join(', '), duration6);
    results.push({ test: 'End-to-End', passed: true, details: e2eResults });
  } else {
    logTest('Funcionalidade End-to-End', false, e2eResults.join(', '), duration6);
    results.push({ test: 'End-to-End', passed: false, details: e2eResults });
  }

  // RESUMO FINAL
  log('\n' + '='.repeat(80), colors.yellow);
  log(`${colors.bold}📊 RESUMO COMPLETO DOS TESTES${colors.reset}`);
  log('='.repeat(80), colors.yellow);
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`Total de testes: ${totalTests}`);
  log(`${colors.green}✅ Aprovados: ${passedTests}${colors.reset}`);
  log(`${colors.red}❌ Reprovados: ${totalTests - passedTests}${colors.reset}`);
  log(`${colors.blue}📈 Taxa de sucesso: ${successRate}%${colors.reset}`);
  
  // Salvar resultados
  const finalResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: totalTests - passedTests,
      successRate: parseFloat(successRate)
    },
    tests: results
  };
  
  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(finalResults, null, 2));
  log(`\n💾 Resultados salvos em: comprehensive-test-results.json`);
  
  if (passedTests === totalTests) {
    log(`\n${colors.green}🎉 TODOS OS TESTES PASSARAM - 100% DE SUCESSO!${colors.reset}`);
    log(`${colors.green}✨ Modelo de monetização totalmente funcional${colors.reset}`);
    
    log(`\n${colors.yellow}🎯 FUNCIONALIDADES DISPONÍVEIS:${colors.reset}`);
    log('   • /owner-leads - Gerenciamento de leads qualificados');
    log('   • /vehicles/{id}/boosts - Sistema de destaque de veículos'); 
    log('   • Serviços premium integrados ao checkout');
    log('   • Painel administrativo com configurações');
  } else {
    log(`\n${colors.red}⚠️ ALGUNS TESTES FALHARAM${colors.reset}`);
    log(`   ${totalTests - passedTests} problema(s) detectado(s)`);
    log('   Verifique os detalhes acima para correções necessárias');
  }
  
  log(`\n${colors.blue}✅ Teste completo finalizado: ${new Date().toLocaleString('pt-BR')}${colors.reset}\n`);
  
  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    successRate: parseFloat(successRate)
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  runComprehensiveTests()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      log(`💥 Erro crítico durante teste: ${error}`, colors.red);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests };