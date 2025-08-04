#!/usr/bin/env node

/**
 * Script de Deployment - alugae.mobi
 * 
 * Este script executa o deployment apenas após verificar que todos os testes passaram.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import PreDeployment from './pre-deploy.js';

class Deployment {
  constructor() {
    this.startTime = Date.now();
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

  async runPreDeployment() {
    this.log('\n🔍 EXECUTANDO PRÉ-DEPLOYMENT...', '\x1b[36m\x1b[1m');
    
    try {
      const preDeployment = new PreDeployment();
      await preDeployment.run();
      this.logSuccess('Pré-deployment concluído com sucesso');
      return true;
    } catch (error) {
      this.logError(`Pré-deployment falhou: ${error.message}`);
      return false;
    }
  }

  async deployToReplit() {
    this.log('\n🚀 INICIANDO DEPLOYMENT NO REPLIT...', '\x1b[36m\x1b[1m');

    try {
      // Verificar se estamos no ambiente Replit
      if (!process.env.REPL_ID) {
        this.logInfo('Ambiente Replit não detectado. Deployment local.');
      }

      // Parar serviços existentes
      this.logInfo('Parando serviços existentes...');
      try {
        execSync('pkill -f "npm run dev"', { stdio: 'ignore' });
      } catch (e) {
        // Ignorar erro se processo não existir
      }

      // Fazer backup do banco se necessário
      this.logInfo('Criando backup do banco de dados...');
      const backupCommand = `pg_dump $DATABASE_URL > backups/backup-$(date +%Y%m%d-%H%M%S).sql`;
      try {
        execSync(backupCommand, { stdio: 'pipe' });
        this.logSuccess('Backup criado com sucesso');
      } catch (error) {
        this.logInfo('Backup não pôde ser criado (continuando...)');
      }

      // Aplicar migrações de banco
      this.logInfo('Aplicando migrações do banco de dados...');
      execSync('npm run db:push', { stdio: 'inherit' });
      this.logSuccess('Migrações aplicadas com sucesso');

      // Reiniciar aplicação
      this.logInfo('Reiniciando aplicação...');
      
      // No Replit, a aplicação será reiniciada automaticamente
      // Aqui podemos fazer verificações adicionais
      
      this.logSuccess('Deployment concluído com sucesso!');
      return true;

    } catch (error) {
      this.logError(`Deployment falhou: ${error.message}`);
      return false;
    }
  }

  async verifyDeployment() {
    this.log('\n🔍 VERIFICANDO DEPLOYMENT...', '\x1b[36m\x1b[1m');

    const maxAttempts = 10;
    const delay = 5000; // 5 segundos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logInfo(`Tentativa ${attempt}/${maxAttempts} - Verificando saúde da aplicação...`);
        
        const healthCheck = execSync('curl -f http://localhost:5000/api/health', { 
          stdio: 'pipe',
          timeout: 10000 
        });
        
        this.logSuccess('Aplicação está rodando corretamente!');
        
        // Executar smoke tests básicos
        this.logInfo('Executando smoke tests...');
        const smokeTests = execSync('npx cypress run --spec "cypress/e2e/01-authentication.cy.ts" --headless', {
          stdio: 'pipe',
          timeout: 60000
        });
        
        this.logSuccess('Smoke tests passaram!');
        return true;

      } catch (error) {
        if (attempt === maxAttempts) {
          this.logError('Falha na verificação do deployment');
          return false;
        }
        
        this.logInfo(`Tentativa ${attempt} falhou. Aguardando ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  async rollback() {
    this.log('\n🔄 EXECUTANDO ROLLBACK...', '\x1b[33m\x1b[1m');

    try {
      // Restaurar último backup se disponível
      const backupDir = 'backups';
      if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
          .filter(file => file.endsWith('.sql'))
          .sort()
          .reverse();

        if (backups.length > 0) {
          const latestBackup = backups[0];
          this.logInfo(`Restaurando backup: ${latestBackup}`);
          execSync(`psql $DATABASE_URL < ${backupDir}/${latestBackup}`, { stdio: 'inherit' });
          this.logSuccess('Backup restaurado com sucesso');
        }
      }

      // Reverter para versão anterior (se usando Git)
      try {
        execSync('git log --oneline -n 5', { stdio: 'inherit' });
        this.logInfo('Use "git revert" ou "git reset" para reverter código se necessário');
      } catch (e) {
        // Git não disponível
      }

      this.logSuccess('Rollback concluído');

    } catch (error) {
      this.logError(`Rollback falhou: ${error.message}`);
    }
  }

  async run() {
    try {
      this.log('\n🚀 INICIANDO PROCESSO DE DEPLOYMENT', '\x1b[36m\x1b[1m');
      this.log('='.repeat(60), '\x1b[36m');

      // 1. Executar pré-deployment
      const preDeployOk = await this.runPreDeployment();
      if (!preDeployOk) {
        throw new Error('Pré-deployment falhou - deployment abortado');
      }

      // 2. Fazer deployment
      const deployOk = await this.deployToReplit();
      if (!deployOk) {
        throw new Error('Deployment falhou');
      }

      // 3. Verificar deployment
      const verifyOk = await this.verifyDeployment();
      if (!verifyOk) {
        this.logError('Verificação do deployment falhou. Iniciando rollback...');
        await this.rollback();
        throw new Error('Deployment falhou na verificação');
      }

      // 4. Sucesso
      const duration = (Date.now() - this.startTime) / 1000;
      this.log('\n🎉 DEPLOYMENT CONCLUÍDO COM SUCESSO!', '\x1b[32m\x1b[1m');
      this.log('='.repeat(60), '\x1b[32m');
      this.logSuccess(`Duração total: ${duration.toFixed(2)}s`);
      this.logSuccess('Aplicação está rodando em produção!');

      process.exit(0);

    } catch (error) {
      this.log('\n💥 DEPLOYMENT FALHOU', '\x1b[31m\x1b[1m');
      this.log('='.repeat(60), '\x1b[31m');
      this.logError(`Erro: ${error.message}`);
      this.logError('Verifique os logs e corrija os problemas antes de tentar novamente');

      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployment = new Deployment();
  deployment.run();
}

export default Deployment;