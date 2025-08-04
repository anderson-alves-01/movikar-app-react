#!/usr/bin/env node

/**
 * Health Check Script - alugae.mobi
 * 
 * Verifica se a aplicação está rodando corretamente
 */

import http from 'http';
import { execSync } from 'child_process';

const config = {
  host: 'localhost',
  port: 5000,
  timeout: 10000,
  maxRetries: 5,
  retryDelay: 2000
};

function makeHealthRequest() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: config.host,
      port: config.port,
      path: '/api/health',
      method: 'GET',
      timeout: config.timeout
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const health = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: health
          });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkHealth() {
  console.log(`🔍 Verificando saúde da aplicação em ${config.host}:${config.port}`);
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt}/${config.maxRetries}...`);
      
      const result = await makeHealthRequest();
      
      if (result.status === 200) {
        console.log('✅ Aplicação está saudável!');
        console.log('📊 Status:', JSON.stringify(result.data, null, 2));
        
        // Verificar componentes específicos
        if (result.data.services) {
          console.log('\n🔧 Status dos serviços:');
          Object.entries(result.data.services).forEach(([service, status]) => {
            const icon = status === 'healthy' ? '✅' : '❌';
            console.log(`  ${icon} ${service}: ${status}`);
          });
        }
        
        return true;
      } else {
        throw new Error(`Health check retornou status ${result.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Tentativa ${attempt} falhou: ${error.message}`);
      
      if (attempt === config.maxRetries) {
        console.log('\n💥 Aplicação não está respondendo corretamente');
        return false;
      }
      
      if (attempt < config.maxRetries) {
        console.log(`⏳ Aguardando ${config.retryDelay/1000}s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  return false;
}

async function checkDependencies() {
  console.log('\n🔍 Verificando dependências...');
  
  const checks = [
    {
      name: 'Node.js',
      command: 'node --version',
      required: true
    },
    {
      name: 'npm',
      command: 'npm --version',
      required: true
    },
    {
      name: 'PostgreSQL',
      command: 'pg_isready',
      required: false
    },
    {
      name: 'Cypress',
      command: 'npx cypress version',
      required: false
    }
  ];
  
  for (const check of checks) {
    try {
      const result = execSync(check.command, { encoding: 'utf8', stdio: 'pipe' });
      console.log(`✅ ${check.name}: ${result.trim()}`);
    } catch (error) {
      const icon = check.required ? '❌' : '⚠️';
      console.log(`${icon} ${check.name}: Não disponível`);
      
      if (check.required) {
        console.log(`💥 Dependência obrigatória ${check.name} não encontrada`);
        return false;
      }
    }
  }
  
  return true;
}

async function main() {
  console.log('🏥 HEALTH CHECK - alugae.mobi');
  console.log('='.repeat(50));
  
  // Verificar dependências
  const depsOk = await checkDependencies();
  if (!depsOk) {
    process.exit(1);
  }
  
  // Verificar saúde da aplicação
  const healthOk = await checkHealth();
  
  console.log('\n' + '='.repeat(50));
  
  if (healthOk) {
    console.log('🎉 HEALTH CHECK PASSOU - Aplicação está funcionando corretamente!');
    process.exit(0);
  } else {
    console.log('💥 HEALTH CHECK FALHOU - Aplicação não está funcionando corretamente');
    console.log('\n📋 Passos para resolver:');
    console.log('1. Verifique se a aplicação está rodando: npm run dev');
    console.log('2. Verifique se o banco de dados está acessível');
    console.log('3. Verifique os logs da aplicação para erros');
    console.log('4. Execute: npm run db:push para aplicar migrações');
    process.exit(1);
  }
}

// Executar health check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Erro inesperado no health check:', error.message);
    process.exit(1);
  });
}

export { checkHealth, checkDependencies };