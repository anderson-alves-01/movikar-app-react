
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🎭 Executando Testes Playwright para alugae.mobi\n');

// Criar diretórios necessários
if (!existsSync('tests/results')) {
  mkdirSync('tests/results', { recursive: true });
}

// Função para verificar se o servidor está rodando
async function checkServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://0.0.0.0:5000/api/vehicles');
      if (response.status === 200) {
        console.log('✅ Servidor está rodando');
        return true;
      }
    } catch (error) {
      // Servidor ainda não está pronto
    }
    
    if (i < maxAttempts - 1) {
      console.log(`⏳ Aguardando servidor... (tentativa ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('❌ Servidor não respondeu dentro do tempo esperado');
  return false;
}

// Função principal
async function runPlaywrightTests() {
  try {
    // Verificar se o servidor está rodando
    const serverReady = await checkServer();
    if (!serverReady) {
      console.log('⚠️ Inicie o servidor com: npm run dev');
      process.exit(1);
    }

    // Argumentos para o Playwright
    const args = [
      'playwright',
      'test',
      '--config=tests/playwright-config.js'
    ];

    // Adicionar argumentos específicos baseado no ambiente
    if (process.env.CI) {
      args.push('--workers=1');
      args.push('--retries=2');
    }

    // Adicionar argumentos da linha de comando
    if (process.argv.includes('--headed')) {
      args.push('--headed');
    }

    if (process.argv.includes('--debug')) {
      args.push('--debug');
    }

    if (process.argv.includes('--ui')) {
      args.push('--ui');
    }

    // Executar testes específicos se especificado
    const testFile = process.argv.find(arg => arg.endsWith('.spec.js'));
    if (testFile) {
      args.push(testFile);
    }

    console.log('🚀 Executando:', ['npx', ...args].join(' '));
    console.log('='.repeat(60));

    // Executar Playwright
    const playwright = spawn('npx', args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });

    playwright.on('close', (code) => {
      console.log('\n' + '='.repeat(60));
      if (code === 0) {
        console.log('🎉 TODOS OS TESTES PLAYWRIGHT PASSARAM!');
        console.log('✅ Aplicação está funcionando corretamente');
      } else {
        console.log('❌ Alguns testes falharam');
        console.log('📊 Verifique o relatório em tests/results/');
      }
      process.exit(code);
    });

    playwright.on('error', (error) => {
      console.error('❌ Erro ao executar Playwright:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runPlaywrightTests();
}

export { runPlaywrightTests };
