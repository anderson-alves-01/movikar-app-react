# Guia de Testes Automatizados - alugae.mobi

## Visão Geral

Este guia documenta a suíte completa de testes automatizados implementada com Cypress para o sistema alugae.mobi. O sistema inclui mais de 200 cenários de teste cobrindo todas as funcionalidades principais da aplicação.

## Arquitetura de Testes

### Estrutura de Diretórios

```
cypress/
├── e2e/                          # Testes end-to-end
│   ├── 01-authentication.cy.ts   # Autenticação e registro
│   ├── 02-vehicle-management.cy.ts # Gestão de veículos
│   ├── 03-booking-system.cy.ts   # Sistema de reservas
│   ├── 04-rewards-system.cy.ts   # Sistema de recompensas
│   ├── 05-subscription-system.cy.ts # Sistema de assinaturas
│   ├── 06-admin-panel.cy.ts      # Painel administrativo
│   ├── 07-messaging-system.cy.ts # Sistema de mensagens
│   ├── 08-integration-tests.cy.ts # Testes de integração
│   ├── 09-performance-tests.cy.ts # Testes de performance
│   └── 10-accessibility-tests.cy.ts # Testes de acessibilidade
├── fixtures/                     # Dados de teste
│   └── test-data.json            # Dados estruturados para testes
├── support/                      # Utilitários e comandos
│   ├── commands.ts               # Comandos customizados
│   ├── e2e.ts                   # Configurações globais
│   ├── api-helpers.ts           # Helpers para API
│   └── database-helpers.ts      # Helpers para banco de dados
└── results/                     # Resultados dos testes
    ├── test-results.json        # Relatórios JSON
    ├── screenshots/             # Screenshots de falhas
    └── videos/                  # Gravações dos testes
```

## Suites de Teste

### 1. Testes de Autenticação (`01-authentication.cy.ts`)
- **Cobertura**: Login, registro, logout, recuperação de senha
- **Cenários**: 25+ testes
- **Funcionalidades testadas**:
  - Login com credenciais válidas/inválidas
  - Registro de novos usuários
  - Validação de campos obrigatórios
  - Sistema de refresh tokens
  - Logout seguro
  - Redirecionamentos pós-autenticação
  - Sistema de referral

### 2. Gestão de Veículos (`02-vehicle-management.cy.ts`)
- **Cobertura**: CRUD de veículos, aprovação, busca
- **Cenários**: 30+ testes
- **Funcionalidades testadas**:
  - Criação de anúncios de veículos
  - Upload de imagens e documentos
  - Sistema de aprovação administrativa
  - Busca e filtros avançados
  - Edição e exclusão de veículos
  - Validação de dados do veículo
  - Sistema de disponibilidade

### 3. Sistema de Reservas (`03-booking-system.cy.ts`)
- **Cobertura**: Fluxo completo de reserva e pagamento
- **Cenários**: 35+ testes
- **Funcionalidades testadas**:
  - Seleção de datas e cálculo de preços
  - Processo de checkout com Stripe
  - Aplicação de pontos e descontos
  - Estados da reserva (pendente, aprovada, ativa)
  - Contratos digitais com DocuSign
  - Cancelamento e reembolsos
  - Histórico de reservas

### 4. Sistema de Recompensas (`04-rewards-system.cy.ts`)
- **Cobertura**: Pontos, referrals e transações
- **Cenários**: 25+ testes
- **Funcionalidades testadas**:
  - Sistema de pontos por ações
  - Links de referral personalizados
  - Aplicação automática de referrals
  - Uso de pontos como desconto
  - Histórico de transações
  - Validações de segurança

### 5. Sistema de Assinaturas (`05-subscription-system.cy.ts`)
- **Cobertura**: Planos, pagamentos, limites
- **Cenários**: 40+ testes
- **Funcionalidades testadas**:
  - Seleção de planos de assinatura
  - Pagamento via Stripe com valores dinâmicos
  - Aplicação de desconto com pontos
  - Limites de veículos por plano
  - Gestão de assinaturas ativas
  - Cancelamento e renovação

### 6. Painel Administrativo (`06-admin-panel.cy.ts`)
- **Cobertura**: Gestão completa do sistema
- **Cenários**: 50+ testes
- **Funcionalidades testadas**:
  - Dashboard com métricas em tempo real
  - Gestão de usuários (CRUD completo)
  - Aprovação de veículos
  - Gestão de reservas
  - Configurações do sistema
  - Relatórios e analytics

### 7. Sistema de Mensagens (`07-messaging-system.cy.ts`)
- **Cobertura**: Comunicação entre usuários
- **Cenários**: 20+ testes
- **Funcionalidades testadas**:
  - Centro de mensagens
  - Threads por veículo
  - Status de leitura
  - Notificações em tempo real
  - Anexos e imagens

### 8. Testes de Integração (`08-integration-tests.cy.ts`)
- **Cobertura**: Jornadas completas do usuário
- **Cenários**: 15+ testes
- **Funcionalidades testadas**:
  - Fluxo completo: registro → anúncio → reserva → pagamento
  - Integração entre todos os sistemas
  - Estados consistentes entre módulos
  - Rollback em caso de falhas

### 9. Testes de Performance (`09-performance-tests.cy.ts`)
- **Cobertura**: Velocidade e responsividade
- **Cenários**: 10+ testes
- **Métricas avaliadas**:
  - Tempo de carregamento de páginas (< 3s)
  - Tempo de resposta da API (< 500ms)
  - Performance de queries do banco
  - Simulação de carga com múltiplos usuários

### 10. Testes de Acessibilidade (`10-accessibility-tests.cy.ts`)
- **Cobertura**: Conformidade WCAG 2.1
- **Cenários**: 15+ testes
- **Validações**:
  - Navegação por teclado
  - Suporte a leitores de tela
  - Atributos ARIA corretos
  - Contraste de cores adequado
  - Responsividade mobile

## Comandos Customizados

### Autenticação
```typescript
cy.login(email, password)           // Login com credenciais
cy.loginAsAdmin()                   // Login como administrador
cy.logout()                         // Logout seguro
cy.registerUser(userData)           // Registro de usuário
```

### Banco de Dados
```typescript
cy.clearDatabase()                  // Limpar dados de teste
cy.seedDatabase()                   // Popular com dados iniciais
cy.createTestVehicle(vehicleData)   // Criar veículo para teste
cy.addPointsToUser(userId, points)  // Adicionar pontos
```

### Utilidades
```typescript
cy.waitForAPI(endpoint)             // Aguardar resposta da API
cy.checkAccessibility()             // Verificar acessibilidade
cy.measurePageLoad()                // Medir performance
cy.takeFullScreenshot(name)         // Screenshot completo
```

## Configuração e Execução

### Configuração Inicial

1. **Instalar dependências**:
```bash
npm install
```

2. **Configurar variáveis de ambiente**:
```bash
cp .env.example .env
# Editar .env com configurações de teste
```

3. **Preparar banco de dados**:
```bash
npm run db:push
```

### Execução dos Testes

#### Interface Gráfica (Desenvolvimento)
```bash
# Abrir Cypress Test Runner
npx cypress open

# Ou usando script customizado
node scripts/run-tests.js --headed
```

#### Modo Headless (CI/CD)
```bash
# Executar todos os testes
npx cypress run

# Executar suite específica
node scripts/run-tests.js --suite smoke
node scripts/run-tests.js --suite critical
node scripts/run-tests.js --suite full

# Executar teste específico
node scripts/run-tests.js --spec cypress/e2e/01-authentication.cy.ts
```

#### Opções Avançadas
```bash
# Com browser específico
node scripts/run-tests.js --browser firefox

# Com retry automático
node scripts/run-tests.js --retries 3

# Performance tests
node scripts/run-tests.js --suite performance

# Accessibility tests
node scripts/run-tests.js --suite accessibility
```

## Processo de Pré-Deployment

### Script de Pré-Deployment

O sistema inclui um processo automatizado que executa todos os testes antes do deployment:

```bash
# Executar pré-deployment completo
node scripts/pre-deploy.js

# Ou através do deployment seguro
node scripts/deploy.js
```

### Fluxo do Pré-Deployment

1. **Verificação de Pré-requisitos**
   - Node.js e dependências
   - Conectividade com banco de dados
   - Configuração do Cypress

2. **Build da Aplicação**
   - Compilação TypeScript
   - Bundle dos assets
   - Verificação de tipos

3. **Execução dos Testes**
   - Suite completa de testes Cypress
   - Retry automático em caso de falha
   - Relatórios detalhados

4. **Validação dos Resultados**
   - Taxa de sucesso mínima (95%)
   - Máximo de falhas permitidas (5)
   - Cobertura de testes adequada

5. **Relatório Final**
   - Métricas consolidadas
   - Logs de falhas
   - Recomendações de correção

### Abortar Deployment

O deployment é automaticamente abortado se:
- Build falhar
- Verificação de tipos falhar
- Mais de 5 testes falharem
- Taxa de sucesso menor que 95%
- Tempo limite excedido (10 minutos)

## CI/CD Integration

### GitHub Actions

O sistema inclui workflow completo para CI/CD:

```yaml
# .github/workflows/pre-deployment.yml
name: Pre-Deployment Tests
on: [push, pull_request]
jobs:
  pre-deployment:
    runs-on: ubuntu-latest
    steps:
      - checkout
      - setup node
      - install dependencies
      - setup database
      - build application
      - run tests
      - upload results
```

### Configuração de Secrets

```bash
# GitHub Secrets necessários
STRIPE_SECRET_KEY          # Chave secreta do Stripe
VITE_STRIPE_PUBLIC_KEY     # Chave pública do Stripe
DATABASE_URL               # URL do banco de teste
CYPRESS_RECORD_KEY         # Para recording no Dashboard
```

## Boas Práticas

### Estrutura dos Testes

1. **Organize por funcionalidade**: Cada arquivo testa um módulo específico
2. **Use describe/it descritivos**: Nomes claros das funcionalidades testadas
3. **Prepare dados limpos**: Setup/teardown adequados
4. **Isole testes**: Cada teste deve ser independente

### Seletores Estáveis

```typescript
// ✅ Bom - usando data-testid
cy.get('[data-testid="button-login"]').click()

// ❌ Evitar - seletores frágeis
cy.get('.btn-primary').click()
cy.get('#login-button').click()
```

### Gestão de Dados

```typescript
// ✅ Bom - usar fixtures e helpers
cy.fixture('test-data').then(data => {
  cy.createTestVehicle(data.vehicle)
})

// ❌ Evitar - dados hardcoded
cy.get('[data-testid="input-brand"]').type('Toyota')
```

### Tratamento de Async

```typescript
// ✅ Bom - aguardar elementos e APIs
cy.get('[data-testid="loading"]').should('not.exist')
cy.waitForAPI('/api/vehicles')

// ❌ Evitar - waits fixos
cy.wait(5000)
```

## Monitoramento e Relatórios

### Métricas Coletadas

- **Taxa de Sucesso**: Porcentagem de testes que passaram
- **Tempo de Execução**: Duração total dos testes
- **Cobertura**: Áreas da aplicação testadas
- **Performance**: Tempos de resposta e carregamento
- **Acessibilidade**: Conformidade WCAG

### Relatórios Gerados

1. **JSON Report**: Resultados detalhados em `cypress/results/test-results.json`
2. **Screenshots**: Capturas automáticas de falhas
3. **Videos**: Gravação completa dos testes
4. **HTML Report**: Relatório visual (opcional)
5. **Dashboard**: Integração com Cypress Dashboard

### Health Checks

```bash
# Verificar saúde da aplicação
node scripts/health-check.js

# Endpoints de monitoramento
curl http://localhost:5000/api/health   # Status geral
curl http://localhost:5000/api/ready    # Readiness check
curl http://localhost:5000/api/live     # Liveness check
```

## Solução de Problemas

### Problemas Comuns

1. **Testes falhando intermitentemente**
   - Verificar waits e timing
   - Aumentar timeouts se necessário
   - Verificar estabilidade dos seletores

2. **Falhas de conectividade**
   - Verificar se aplicação está rodando
   - Confirmar URL base correta
   - Verificar configuração de proxy

3. **Problemas de banco de dados**
   - Executar migrations: `npm run db:push`
   - Limpar dados de teste: `cy.clearDatabase()`
   - Verificar permissões de conexão

4. **Timeouts em CI/CD**
   - Otimizar queries de banco
   - Usar paralelização quando possível
   - Ajustar timeouts para ambiente CI

### Debug de Testes

```typescript
// Habilitar debug
cy.debug()

// Logs customizados
cy.log('Executando teste de login')

// Pausar execução
cy.pause()

// Screenshots manuais
cy.screenshot('debug-login-page')
```

## Evolução e Manutenção

### Adicionando Novos Testes

1. Criar arquivo na pasta apropriada
2. Seguir padrão de nomenclatura: `XX-feature-name.cy.ts`
3. Adicionar suíte ao `scripts/run-tests.js`
4. Documentar no README

### Atualizando Testes Existentes

1. Manter compatibilidade com dados existentes
2. Atualizar seletores se UI mudar
3. Revisar timeouts se performance melhorar
4. Documentar mudanças significativas

### Métricas de Qualidade

- **Cobertura mínima**: 85% das funcionalidades
- **Taxa de sucesso**: 95% em ambiente estável
- **Tempo máximo**: 10 minutos para suite completa
- **Manutenibilidade**: Testes devem ser atualizáveis

## Conclusão

Este sistema de testes automatizados fornece cobertura abrangente para o alugae.mobi, garantindo qualidade e confiabilidade antes de cada deployment. O processo de pré-deployment automatizado assegura que apenas código testado e funcional seja colocado em produção.

Para dúvidas ou suporte, consulte a documentação específica de cada módulo ou entre em contato com a equipe de desenvolvimento.