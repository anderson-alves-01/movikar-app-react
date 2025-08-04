#!/usr/bin/env node

/**
 * Sistema Simplificado de Pré-Deployment para alugae.mobi
 * 
 * Este script executa validações essenciais antes do deployment
 * sem depender de ferramentas externas complexas como Cypress.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configurações
const config = {
  appUrl: 'http://localhost:5000',
  timeout: 30000,
  requiredFiles: [
    'package.json',
    'shared/schema.ts',
    'server/index.ts',
    'client/src/App.tsx'
  ],
  healthEndpoints: [
    '/api/health',
    '/api/vehicles',
    '/api/admin/settings'
  ]
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

class SimplePreDeploy {
  constructor() {
    this.results = {
      fileCheck: false,
      healthCheck: false,
      apiCheck: false,
      buildCheck: false
    };
    this.startTime = Date.now();
  }

  log(message, color = colors.reset) {
    const timestamp = new Date().toISOString();
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, colors.green);
  }

  logError(message) {
    this.log(`❌ ${message}`, colors.red);
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  logSection(title) {
    console.log('\n' + '='.repeat(60));
    this.log(title, colors.bold);
    console.log('='.repeat(60));
  }

  async executeCommand(command, timeout = 10000) {
    try {
      const result = execSync(command, {
        stdio: 'pipe',
        timeout: timeout,
        encoding: 'utf8'
      });
      return { success: true, output: result.trim() };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        output: error.stdout ? error.stdout.trim() : '' 
      };
    }
  }

  async checkFiles() {
    this.logSection('📁 VERIFICANDO ARQUIVOS CRÍTICOS');
    
    let existingFiles = 0;
    const missingFiles = [];

    for (const file of config.requiredFiles) {
      if (fs.existsSync(file)) {
        this.logSuccess(`Arquivo encontrado: ${file}`);
        existingFiles++;
      } else {
        this.logError(`Arquivo não encontrado: ${file}`);
        missingFiles.push(file);
      }
    }

    // Verificar se dist existe (build)
    if (fs.existsSync('dist')) {
      this.logSuccess('Diretório de build encontrado');
      existingFiles++;
    } else {
      this.logWarning('Diretório de build não encontrado');
    }

    this.results.fileCheck = existingFiles >= config.requiredFiles.length;
    
    if (this.results.fileCheck) {
      this.logSuccess(`Verificação de arquivos: ${existingFiles}/${config.requiredFiles.length + 1} OK`);
    } else {
      this.logError(`Arquivos faltando: ${missingFiles.join(', ')}`);
    }

    return this.results.fileCheck;
  }

  async checkHealth() {
    this.logSection('🏥 VERIFICANDO SAÚDE DA APLICAÇÃO');
    
    try {
      const result = await this.executeCommand(
        `curl -s ${config.appUrl}/api/health || echo "FAILED"`,
        10000
      );

      if (result.success && !result.output.includes('FAILED')) {
        try {
          const healthData = JSON.parse(result.output);
          this.logSuccess(`Aplicação saudável: ${healthData.status} (${healthData.environment})`);
          this.logInfo(`Uptime: ${(healthData.uptime || 0).toFixed(2)}s`);
          this.results.healthCheck = true;
        } catch (e) {
          this.logSuccess('Aplicação respondendo (formato não-JSON)');
          this.results.healthCheck = true;
        }
      } else {
        this.logError('Aplicação não está respondendo');
        this.results.healthCheck = false;
      }
    } catch (error) {
      this.logError(`Erro na verificação de saúde: ${error.message}`);
      this.results.healthCheck = false;
    }

    return this.results.healthCheck;
  }

  async checkAPIs() {
    this.logSection('🔌 VERIFICANDO ENDPOINTS DA API');
    
    let workingEndpoints = 0;
    
    for (const endpoint of config.healthEndpoints) {
      try {
        const result = await this.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" ${config.appUrl}${endpoint}`,
          5000
        );
        
        const statusCode = result.output || '000';
        
        if (['200', '401', '403', '304'].includes(statusCode)) {
          this.logSuccess(`${endpoint}: ${statusCode} (OK)`);
          workingEndpoints++;
        } else if (statusCode === '500') {
          this.logWarning(`${endpoint}: ${statusCode} (Erro interno)`);
        } else {
          this.logError(`${endpoint}: ${statusCode} (Falha)`);
        }
      } catch (error) {
        this.logError(`${endpoint}: Erro - ${error.message}`);
      }
    }

    this.results.apiCheck = workingEndpoints >= Math.ceil(config.healthEndpoints.length * 0.6);
    
    const successRate = (workingEndpoints / config.healthEndpoints.length * 100).toFixed(1);
    if (this.results.apiCheck) {
      this.logSuccess(`APIs funcionando: ${workingEndpoints}/${config.healthEndpoints.length} (${successRate}%)`);
    } else {
      this.logError(`APIs falhando: ${workingEndpoints}/${config.healthEndpoints.length} (${successRate}%)`);
    }

    return this.results.apiCheck;
  }

  async checkBuild() {
    this.logSection('🏗️  VERIFICANDO BUILD');
    
    // Verificar se pode fazer build
    const buildResult = await this.executeCommand('npm run build', 60000);
    
    if (buildResult.success) {
      this.logSuccess('Build executado com sucesso');
      
      // Verificar arquivos de build
      const criticalBuildFiles = [
        'dist/index.js',
        'dist/public/index.html'
      ];
      
      let buildFilesOk = 0;
      for (const file of criticalBuildFiles) {
        if (fs.existsSync(file)) {
          this.logSuccess(`Build file: ${file}`);
          buildFilesOk++;
        } else {
          this.logWarning(`Build file faltando: ${file}`);
        }
      }
      
      this.results.buildCheck = buildFilesOk >= criticalBuildFiles.length;
    } else {
      this.logError('Build falhou');
      this.logError(buildResult.error);
      this.results.buildCheck = false;
    }

    return this.results.buildCheck;
  }

  generateReport() {
    this.logSection('📋 RELATÓRIO FINAL');
    
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const passed = Object.values(this.results).filter(Boolean).length;
    const total = Object.keys(this.results).length;
    const score = ((passed / total) * 100).toFixed(1);

    console.log('\n' + '━'.repeat(60));
    console.log(`                    📋 RESUMO FINAL`);
    console.log('━'.repeat(60));
    
    Object.entries(this.results).forEach(([test, result]) => {
      const status = result ? '✅ PASSOU' : '❌ FALHOU';
      const testName = test.replace(/([A-Z])/g, ' $1').toUpperCase();
      console.log(`${status.padEnd(10)} ${testName}`);
    });
    
    console.log('━'.repeat(60));
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`📊 Score: ${passed}/${total} testes (${score}%)`);
    console.log('━'.repeat(60));

    // Salvar relatório em arquivo
    const report = {
      timestamp: new Date().toISOString(),
      duration: parseFloat(duration),
      results: this.results,
      score: parseFloat(score),
      passed: passed,
      total: total,
      status: score >= 75 ? 'APROVADO' : 'REJEITADO'
    };

    try {
      fs.mkdirSync('deployment-reports', { recursive: true });
      const reportFile = `deployment-reports/simple-pre-deploy-${Date.now()}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      this.logSuccess(`Relatório salvo: ${reportFile}`);
    } catch (error) {
      this.logWarning(`Não foi possível salvar relatório: ${error.message}`);
    }

    return report;
  }

  async run() {
    this.logSection('🚀 INICIANDO VALIDAÇÃO PRÉ-DEPLOYMENT');
    this.logInfo('Sistema Simplificado de Validação - alugae.mobi');

    try {
      // Executar todas as verificações
      await this.checkFiles();
      await this.checkHealth();
      await this.checkAPIs();
      await this.checkBuild();

      // Gerar relatório
      const report = this.generateReport();

      // Determinar se deve aprovar deployment
      if (report.score >= 75) {
        this.logSuccess('🎉 VALIDAÇÃO APROVADA - Deployment pode prosseguir');
        process.exit(0);
      } else {
        this.logError('❌ VALIDAÇÃO REJEITADA - Corrija os problemas antes do deployment');
        process.exit(1);
      }

    } catch (error) {
      this.logError(`Falha crítica na validação: ${error.message}`);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new SimplePreDeploy();
  validator.run();
}

export default SimplePreDeploy;