#!/usr/bin/env node

/**
 * Análise de Logs do Sistema CarShare
 * Identifica padrões problemáticos e gera relatório detalhado
 */

import fs from 'fs';
import path from 'path';

// Padrões problemáticos nos logs
const PROBLEMATIC_PATTERNS = {
  AUTH_LOOPS: {
    pattern: /GET \/api\/auth\/user 401.*GET \/api\/auth\/user 401/g,
    description: 'Loops de autenticação (múltiplas requisições 401 consecutivas)',
    severity: 'HIGH'
  },
  FREQUENT_401: {
    pattern: /401.*Token de acesso obrigatório/g,
    description: 'Requisições frequentes sem token (possível problema de cookies)',
    severity: 'MEDIUM'
  },
  REFRESH_FAILURES: {
    pattern: /POST \/api\/auth\/refresh 401/g,
    description: 'Falhas no refresh de token',
    severity: 'HIGH'
  },
  UNREAD_COUNT_SPAM: {
    pattern: /GET \/api\/messages\/unread-count 304/g,
    description: 'Requisições excessivas para contagem de mensagens (polling)',
    severity: 'LOW'
  },
  CORS_ERRORS: {
    pattern: /CORS.*error/gi,
    description: 'Erros de CORS',
    severity: 'HIGH'
  },
  RATE_LIMIT_HITS: {
    pattern: /429.*rate limit/gi,
    description: 'Rate limit atingido',
    severity: 'MEDIUM'
  },
  DATABASE_ERRORS: {
    pattern: /database.*error|connection.*failed/gi,
    description: 'Erros de banco de dados',
    severity: 'CRITICAL'
  }
};

// Análise de performance
const PERFORMANCE_PATTERNS = {
  SLOW_REQUESTS: {
    pattern: /(\d+)ms/g,
    threshold: 1000,
    description: 'Requisições lentas (>1000ms)',
    severity: 'MEDIUM'
  },
  HIGH_FREQUENCY: {
    pattern: /GET \/api\/messages\/unread-count/g,
    description: 'Alta frequência de polling',
    severity: 'LOW'
  }
};

class LogAnalyzer {
  constructor() {
    this.logData = '';
    this.analysisResults = {
      patterns: {},
      performance: {},
      summary: {
        totalRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        uniqueEndpoints: new Set()
      }
    };
  }

  // Capturar logs em tempo real (simulação dos logs fornecidos)
  simulateRecentLogs() {
    return `
9:01:37 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:01:37 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:02:07 PM [express] GET /api/messages/unread-count 304 in 2ms :: {"count":0}
9:02:08 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:03:01 PM [express] GET /api/messages/unread-count 304 in 3ms :: {"count":0}
9:03:02 PM [express] GET /api/vehicles 304 in 290ms :: [{"id":45,"ownerId":4,"brand":"Toyota","model…
9:03:02 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:03:02 PM [express] GET /api/vehicles 304 in 59ms :: [{"id":45,"ownerId":4,"brand":"Toyota","model"…
9:03:33 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:03:33 PM [express] GET /api/messages/unread-count 304 in 0ms :: {"count":0}
9:04:03 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:04:03 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:04:33 PM [express] GET /api/messages/unread-count 304 in 0ms :: {"count":0}
9:04:33 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:05:03 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:05:03 PM [express] GET /api/messages/unread-count 304 in 0ms :: {"count":0}
9:05:33 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:05:34 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:07:34 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:07:34 PM [express] GET /api/messages/unread-count 304 in 0ms :: {"count":0}
9:08:04 PM [express] GET /api/messages/unread-count 304 in 0ms :: {"count":0}
9:08:05 PM [express] GET /api/messages/unread-count 304 in 1ms :: {"count":0}
9:01:21 PM [express] GET /api/auth/user 401 in 5ms :: {"message":"Token de acesso obrigatório"}
9:01:21 PM [express] POST /api/auth/refresh 401 in 1ms :: {"message":"Refresh token não encontrado"}
    `.trim();
  }

  // Analisar padrões problemáticos
  analyzePatterns() {
    console.log('🔍 Analisando padrões problemáticos nos logs...\n');

    for (const [key, config] of Object.entries(PROBLEMATIC_PATTERNS)) {
      const matches = this.logData.match(config.pattern) || [];
      this.analysisResults.patterns[key] = {
        count: matches.length,
        severity: config.severity,
        description: config.description,
        matches: matches.slice(0, 5) // Mostrar apenas os primeiros 5
      };

      if (matches.length > 0) {
        console.log(`🚨 ${config.severity}: ${config.description}`);
        console.log(`   Ocorrências: ${matches.length}`);
        if (matches.length > 5) {
          console.log(`   (Mostrando primeiras 5 de ${matches.length})`);
        }
        matches.slice(0, 5).forEach(match => {
          console.log(`   - ${match.substring(0, 100)}...`);
        });
        console.log('');
      }
    }
  }

  // Analisar performance
  analyzePerformance() {
    console.log('⚡ Analisando performance...\n');

    // Extrair tempos de resposta
    const responseTimeMatches = this.logData.match(/in (\d+)ms/g) || [];
    const responseTimes = responseTimeMatches.map(match => {
      const time = match.match(/(\d+)ms/);
      return time ? parseInt(time[1]) : 0;
    });

    if (responseTimes.length > 0) {
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const slowRequests = responseTimes.filter(time => time > 500).length;
      const verySlowRequests = responseTimes.filter(time => time > 1000).length;

      this.analysisResults.performance = {
        averageResponseTime: avgResponseTime.toFixed(2),
        slowRequests,
        verySlowRequests,
        totalRequests: responseTimes.length
      };

      console.log(`📊 Estatísticas de Performance:`);
      console.log(`   Tempo médio de resposta: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Requisições lentas (>500ms): ${slowRequests}`);
      console.log(`   Requisições muito lentas (>1000ms): ${verySlowRequests}`);
      console.log(`   Total de requisições: ${responseTimes.length}\n`);

      if (verySlowRequests > 0) {
        console.log('🐌 ALERTA: Requisições muito lentas detectadas');
        // Identificar quais endpoints são lentos
        const slowEndpointMatches = this.logData.match(/GET \/api\/\w+.*in \d{3,}ms/g) || [];
        slowEndpointMatches.slice(0, 5).forEach(match => {
          console.log(`   - ${match}`);
        });
        console.log('');
      }
    }
  }

  // Analisar frequência de requisições
  analyzeRequestFrequency() {
    console.log('📈 Analisando frequência de requisições...\n');

    const endpointCounts = {};
    const endpointMatches = this.logData.match(/GET \/api\/[\w\/-]+/g) || [];
    
    endpointMatches.forEach(endpoint => {
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });

    // Ordenar por frequência
    const sortedEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    console.log('📊 Top 10 endpoints por frequência:');
    sortedEndpoints.forEach(([endpoint, count]) => {
      console.log(`   ${endpoint}: ${count} requisições`);
    });
    console.log('');

    // Detectar polling excessivo
    const unreadCountRequests = endpointCounts['GET /api/messages/unread-count'] || 0;
    if (unreadCountRequests > 20) {
      console.log('🚨 ALERTA: Polling excessivo detectado');
      console.log(`   /api/messages/unread-count chamado ${unreadCountRequests} vezes`);
      console.log('   Recomendação: Implementar WebSocket ou aumentar intervalo de polling\n');
    }
  }

  // Verificar problemas específicos de autenticação
  analyzeAuthenticationIssues() {
    console.log('🔐 Analisando problemas de autenticação...\n');

    const authIssues = {
      missingTokens: (this.logData.match(/Token de acesso obrigatório/g) || []).length,
      invalidTokens: (this.logData.match(/Token inválido/g) || []).length,
      refreshFailures: (this.logData.match(/Refresh token não encontrado/g) || []).length,
      successfulLogins: (this.logData.match(/POST \/api\/auth\/login 200/g) || []).length,
      failedLogins: (this.logData.match(/POST \/api\/auth\/login 401/g) || []).length
    };

    console.log('🔍 Estatísticas de Autenticação:');
    Object.entries(authIssues).forEach(([issue, count]) => {
      if (count > 0) {
        console.log(`   ${issue}: ${count}`);
      }
    });

    // Detectar loops de autenticação
    const authUserRequests = this.logData.match(/GET \/api\/auth\/user/g) || [];
    const consecutiveAuth401s = this.logData.match(/GET \/api\/auth\/user 401.*GET \/api\/auth\/user 401/g) || [];

    if (consecutiveAuth401s.length > 0) {
      console.log('🚨 CRÍTICO: Loops de autenticação detectados!');
      console.log(`   ${consecutiveAuth401s.length} sequências de 401 consecutivos`);
      console.log('   Isso indica problema no sistema de refresh automático\n');
    } else if (authIssues.missingTokens === 0 && authIssues.refreshFailures === 0) {
      console.log('✅ Sistema de autenticação funcionando corretamente');
      console.log('   Nenhum loop de autenticação detectado\n');
    }
  }

  // Gerar recomendações
  generateRecommendations() {
    console.log('💡 RECOMENDAÇÕES DE CORREÇÃO:\n');

    const recommendations = [];

    // Baseado na análise dos padrões
    if (this.analysisResults.patterns.UNREAD_COUNT_SPAM?.count > 20) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Polling excessivo de mensagens não lidas',
        solution: 'Implementar WebSocket para notificações em tempo real ou aumentar intervalo de polling para 30-60 segundos'
      });
    }

    if (this.analysisResults.patterns.AUTH_LOOPS?.count > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Loops de autenticação detectados',
        solution: 'Verificar configurações de cookies (sameSite, secure) e implementar debounce no useAuth hook'
      });
    }

    if (this.analysisResults.patterns.FREQUENT_401?.count > 10) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Muitas requisições sem token',
        solution: 'Verificar se cookies httpOnly estão sendo enviados corretamente e revisar middleware de autenticação'
      });
    }

    if (this.analysisResults.performance.verySlowRequests > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Requisições lentas detectadas',
        solution: 'Otimizar queries de banco de dados, implementar cache, ou revisar índices'
      });
    }

    // Baseado nos logs atuais
    const unreadCountRequests = (this.logData.match(/GET \/api\/messages\/unread-count/g) || []).length;
    if (unreadCountRequests > 15) {
      recommendations.push({
        priority: 'LOW',
        issue: `Polling muito frequente (${unreadCountRequests} requisições)`,
        solution: 'Considerar implementar Server-Sent Events (SSE) ou WebSocket para notificações push'
      });
    }

    if (recommendations.length === 0) {
      console.log('✅ Nenhum problema crítico detectado nos logs');
      console.log('   Sistema aparenta estar funcionando dentro dos parâmetros normais');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   Solução: ${rec.solution}\n`);
      });
    }
  }

  // Executar análise completa
  async run() {
    console.log('🚀 INICIANDO ANÁLISE COMPLETA DE LOGS');
    console.log('=====================================\n');

    // Carregar dados dos logs (simulados)
    this.logData = this.simulateRecentLogs();
    
    console.log(`📝 Dados de log carregados: ${this.logData.split('\n').length} linhas\n`);

    // Executar análises
    this.analyzePatterns();
    this.analyzePerformance();
    this.analyzeRequestFrequency();
    this.analyzeAuthenticationIssues();
    this.generateRecommendations();

    console.log('✅ Análise de logs concluída!');
  }
}

// Executar análise
const analyzer = new LogAnalyzer();
analyzer.run().catch(console.error);