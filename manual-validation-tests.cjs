/**
 * Testes manuais de validação para o modelo de monetização
 * Executa validações diretas sem depender de endpoints complexos
 */

const { execSync } = require('child_process');
const fs = require('fs');

function logTest(name, result, details) {
  const status = result ? '✅ PASSOU' : '❌ FALHOU';
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${name}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
  if (!result) {
    console.log(`   📍 Falha detectada em: ${name}`);
  }
  console.log('');
}

async function runValidationTests() {
  console.log('🚀 EXECUTANDO TESTES DE VALIDAÇÃO DO MODELO DE MONETIZAÇÃO');
  console.log('=' .repeat(70));
  console.log('');

  let totalTests = 0;
  let passedTests = 0;

  // Teste 1: Verificar se as páginas foram criadas
  totalTests++;
  const ownerLeadsExists = fs.existsSync('client/src/pages/owner-leads.tsx');
  const vehicleBoostsExists = fs.existsSync('client/src/pages/vehicle-boosts.tsx');
  
  if (ownerLeadsExists && vehicleBoostsExists) {
    passedTests++;
    logTest('1. Páginas de Monetização', true, 'owner-leads.tsx e vehicle-boosts.tsx criadas');
  } else {
    logTest('1. Páginas de Monetização', false, 
      `owner-leads.tsx: ${ownerLeadsExists ? 'OK' : 'AUSENTE'}, ` +
      `vehicle-boosts.tsx: ${vehicleBoostsExists ? 'OK' : 'AUSENTE'}`
    );
  }

  // Teste 2: Verificar se as rotas foram adicionadas ao App.tsx
  totalTests++;
  const appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
  const hasOwnerLeadsRoute = appContent.includes('/owner-leads');
  const hasVehicleBoostsRoute = appContent.includes('/vehicles/:vehicleId/boosts');
  const hasImports = appContent.includes('import OwnerLeads') && appContent.includes('import VehicleBoosts');
  
  if (hasOwnerLeadsRoute && hasVehicleBoostsRoute && hasImports) {
    passedTests++;
    logTest('2. Integração de Rotas', true, 'Rotas adicionadas corretamente no App.tsx');
  } else {
    logTest('2. Integração de Rotas', false, 
      `Rotas: ${hasOwnerLeadsRoute && hasVehicleBoostsRoute ? 'OK' : 'AUSENTE'}, ` +
      `Imports: ${hasImports ? 'OK' : 'AUSENTE'}`
    );
  }

  // Teste 3: Verificar se o schema foi atualizado
  totalTests++;
  const schemaContent = fs.readFileSync('shared/schema.ts', 'utf8');
  const hasMonetizationTables = [
    'premiumServices',
    'qualifiedLeads', 
    'vehicleBoosts',
    'userPremiumServices'
  ].every(table => schemaContent.includes(table));

  if (hasMonetizationTables) {
    passedTests++;
    logTest('3. Schema de Monetização', true, 'Todas as tabelas de monetização definidas');
  } else {
    logTest('3. Schema de Monetização', false, 'Algumas tabelas de monetização ausentes no schema');
  }

  // Teste 4: Verificar se as APIs foram adicionadas
  totalTests++;
  const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
  const hasMonetizationAPIs = [
    '/api/premium-services',
    '/api/qualified-leads',
    '/api/vehicle-boosts',
    '/api/user-premium-services'
  ].every(route => routesContent.includes(route));

  if (hasMonetizationAPIs) {
    passedTests++;
    logTest('4. APIs de Monetização', true, 'Todas as APIs de monetização implementadas');
  } else {
    logTest('4. APIs de Monetização', false, 'Algumas APIs de monetização ausentes');
  }

  // Teste 5: Verificar se os links de navegação foram adicionados
  totalTests++;
  const profileContent = fs.readFileSync('client/src/pages/profile.tsx', 'utf8');
  const hasNavigationLinks = profileContent.includes('owner-leads') && 
                             profileContent.includes('Leads Qualificados') &&
                             profileContent.includes('Destacar Veículos');

  if (hasNavigationLinks) {
    passedTests++;
    logTest('5. Links de Navegação', true, 'Links para funcionalidades de monetização adicionados');
  } else {
    logTest('5. Links de Navegação', false, 'Links de navegação para monetização ausentes');
  }

  // Teste 6: Verificar se o script de dados foi criado
  totalTests++;
  const dataScriptExists = fs.existsSync('populate-monetization-data.ts');
  
  if (dataScriptExists) {
    passedTests++;
    logTest('6. Script de População de Dados', true, 'Script populate-monetization-data.ts criado');
  } else {
    logTest('6. Script de População de Dados', false, 'Script de população de dados não encontrado');
  }

  // Teste 7: Verificar configurações de monetização
  totalTests++;
  const configExists = fs.existsSync('shared/monetization-config.ts');
  
  if (configExists) {
    const configContent = fs.readFileSync('shared/monetization-config.ts', 'utf8');
    const hasBoostTypes = configContent.includes('BOOST_TYPES');
    const hasPricing = configContent.includes('BOOST_PRICING');
    
    if (hasBoostTypes && hasPricing) {
      passedTests++;
      logTest('7. Configurações de Monetização', true, 'Configurações de boost e preços definidas');
    } else {
      logTest('7. Configurações de Monetização', false, 'Configurações de monetização incompletas');
    }
  } else {
    logTest('7. Configurações de Monetização', false, 'Arquivo de configurações não encontrado');
  }

  // Teste 8: Verificar se o servidor está executando
  totalTests++;
  try {
    const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/vehicles', 
                             { encoding: 'utf8', timeout: 5000 });
    
    if (response.trim() === '200') {
      passedTests++;
      logTest('8. Status do Servidor', true, 'Servidor executando corretamente na porta 5000');
    } else {
      logTest('8. Status do Servidor', false, `Servidor retornou status ${response.trim()}`);
    }
  } catch (error) {
    logTest('8. Status do Servidor', false, 'Servidor não está respondendo');
  }

  // Teste 9: Verificar se as APIs básicas estão funcionando
  totalTests++;
  try {
    const premiumServicesResponse = execSync(
      'curl -s -w "%{http_code}" http://localhost:5000/api/premium-services', 
      { encoding: 'utf8', timeout: 5000 }
    );
    
    const statusCode = premiumServicesResponse.slice(-3);
    
    if (statusCode === '200') {
      passedTests++;
      logTest('9. API Premium Services', true, 'Endpoint respondendo corretamente');
    } else {
      logTest('9. API Premium Services', false, `Status ${statusCode}`);
    }
  } catch (error) {
    logTest('9. API Premium Services', false, 'Erro na requisição à API');
  }

  // Teste 10: Verificar estrutura do projeto
  totalTests++;
  const projectStructureOk = [
    'client/src/pages/owner-leads.tsx',
    'client/src/pages/vehicle-boosts.tsx',
    'shared/schema.ts',
    'shared/monetization-config.ts',
    'server/routes.ts'
  ].every(file => fs.existsSync(file));

  if (projectStructureOk) {
    passedTests++;
    logTest('10. Estrutura do Projeto', true, 'Todos os arquivos principais presentes');
  } else {
    logTest('10. Estrutura do Projeto', false, 'Alguns arquivos principais ausentes');
  }

  // Resumo final
  console.log('=' .repeat(70));
  console.log('📊 RESUMO DA VALIDAÇÃO');
  console.log('=' .repeat(70));
  console.log(`Total de testes: ${totalTests}`);
  console.log(`✅ Aprovados: ${passedTests}`);
  console.log(`❌ Reprovados: ${totalTests - passedTests}`);
  console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('');

  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✨ O modelo de monetização foi implementado com sucesso.');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('   • Acesse /profile → aba "Como Proprietário" para ver as novas funcionalidades');
    console.log('   • Teste /owner-leads para gerenciar leads qualificados');
    console.log('   • Teste os boosts de veículos nas páginas de veículos');
    console.log('   • Configure preços e funcionalidades no painel administrativo');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM');
    console.log('   Revise os itens marcados como "FALHOU" acima.');
    console.log(`   ${totalTests - passedTests} problema(s) detectado(s).`);
  }

  console.log('');
  console.log(`✅ Validação concluída às ${new Date().toLocaleString('pt-BR')}`);
  
  return {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    success: passedTests === totalTests
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  runValidationTests()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erro durante validação:', error);
      process.exit(1);
    });
}

module.exports = { runValidationTests };