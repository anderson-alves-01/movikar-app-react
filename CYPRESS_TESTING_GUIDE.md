# Guia de Testes Automatizados com Cypress - alugae.mobi

## Visão Geral

Esta suíte de testes automatizados cobre todas as funcionalidades principais da plataforma alugae.mobi, incluindo autenticação, gestão de veículos, sistema de reservas, recompensas, assinaturas e painel administrativo.

## Estrutura dos Testes

### 1. Testes de Autenticação (`01-authentication.cy.ts`)
- ✅ Login e logout de usuários
- ✅ Registro de novos usuários
- ✅ Validação de formulários
- ✅ Sistema de indicação/referral
- ✅ Persistência de sessão

### 2. Gestão de Veículos (`02-vehicle-management.cy.ts`)
- ✅ Listagem e busca de veículos
- ✅ Detalhes do veículo
- ✅ Criação de veículos (admin)
- ✅ Filtros e pesquisa
- ✅ Controle de acesso

### 3. Sistema de Reservas (`03-booking-system.cy.ts`)
- ✅ Fluxo completo de reserva
- ✅ Cálculo dinâmico de preços
- ✅ Processo de checkout
- ✅ Integração com Stripe
- ✅ Gestão de reservas
- ✅ Uso de pontos de recompensa

### 4. Sistema de Recompensas (`04-rewards-system.cy.ts`)
- ✅ Saldo de pontos
- ✅ Sistema de indicação
- ✅ Uso de pontos para desconto
- ✅ Ganho de pontos por ações
- ✅ Histórico de transações

### 5. Sistema de Assinaturas (`05-subscription-system.cy.ts`)
- ✅ Planos de assinatura
- ✅ Checkout de assinatura
- ✅ Gestão de assinatura
- ✅ Recursos por plano
- ✅ Desconto anual

### 6. Painel Administrativo (`06-admin-panel.cy.ts`)
- ✅ Controle de acesso admin
- ✅ Dashboard administrativo
- ✅ Gestão de usuários
- ✅ Gestão de veículos
- ✅ Gestão de reservas
- ✅ Configurações do sistema

### 7. Sistema de Mensagens (`07-messaging-system.cy.ts`)
- ✅ Centro de mensagens
- ✅ Threads de conversa
- ✅ Mensagens específicas por veículo
- ✅ Composição de mensagens
- ✅ Histórico e busca

### 8. Testes de Integração (`08-integration-tests.cy.ts`)
- ✅ Jornada completa do locatário
- ✅ Jornada completa do proprietário
- ✅ Fluxo de pagamento com descontos
- ✅ Fluxo administrativo completo
- ✅ Tratamento de erros
- ✅ Responsividade mobile

### 9. Testes de Performance (`09-performance-tests.cy.ts`)
- ✅ Tempo de carregamento de páginas
- ✅ Tempo de resposta das APIs
- ✅ Performance de consultas ao banco
- ✅ Uso de memória
- ✅ Simulação de usuários concorrentes
- ✅ Performance de rede

### 10. Testes de Acessibilidade (`10-accessibility-tests.cy.ts`)
- ✅ Navegação por teclado
- ✅ Suporte a leitores de tela
- ✅ Contraste de cores
- ✅ Gestão de foco
- ✅ Atributos ARIA
- ✅ Acessibilidade mobile

## Como Executar os Testes

### Pré-requisitos
1. Aplicação rodando em `http://localhost:5000`
2. Banco de dados configurado com dados de teste
3. Cypress instalado

### Comandos Disponíveis

```bash
# Executar todos os testes (headless)
npm run test

# Abrir interface do Cypress
npm run test:open

# Executar testes em modo CI
npm run test:ci

# Executar específico arquivo de teste
npx cypress run --spec "cypress/e2e/01-authentication.cy.ts"
```

### Configuração de Ambiente

1. **Variáveis de Ambiente**: Configure no arquivo `cypress.env.json`
2. **Dados de Teste**: Modifique `cypress/fixtures/test-data.json`
3. **Base URL**: Altere em `cypress.config.ts` se necessário

## Dados de Teste

### Usuários Padrão
- **Admin**: admin@alugae.mobi / admin123
- **Usuário Teste**: user@test.com / user123

### Cartões de Teste (Stripe)
- **Aprovado**: 4242424242424242
- **Recusado**: 4000000000000002
- **Expiração**: 12/25
- **CVC**: 123

### Configurações Padrão
- **Taxa de Serviço**: 10%
- **Taxa de Seguro**: 20%
- **Veículo de Teste**: ID 29 (Honda)

## Comandos Customizados

### Autenticação
```javascript
cy.login('email@test.com', 'password')
cy.loginAsAdmin()
cy.loginAsUser()
```

### Navegação
```javascript
cy.goToVehicle(vehicleId)
cy.makeBooking(vehicleId, startDate, endDate)
```

### Pagamentos
```javascript
cy.fillStripePayment(cardNumber)
cy.addPointsToUser(userId, points)
```

### API
```javascript
cy.apiRequest('POST', '/api/endpoint', data)
cy.apiCreateBooking(vehicleId, startDate, endDate)
```

## Melhores Práticas

### 1. Isolamento de Testes
- Cada teste deve ser independente
- Limpar dados entre testes
- Usar `beforeEach()` para setup

### 2. Data-testid
- Use atributos `data-testid` para seletores
- Evite seletores por classe CSS
- Mantenha IDs descritivos

### 3. Esperas Inteligentes
- Use `cy.wait()` para APIs específicas
- Aguarde elementos aparecerem
- Evite esperas fixas (`cy.wait(1000)`)

### 4. Tratamento de Erros
- Teste cenários de erro
- Verifique mensagens de feedback
- Teste recuperação de falhas

### 5. Performance
- Monitore tempos de resposta
- Teste com dados realistas
- Verifique carregamento de recursos

## Relatórios

### Geração Automática
- Screenshots em caso de falha
- Vídeos dos testes
- Relatórios HTML
- Métricas de performance

### Análise de Resultados
1. **Taxa de Sucesso**: Meta >95%
2. **Tempo de Execução**: <30 min para suíte completa
3. **Cobertura**: Todas as funcionalidades principais
4. **Estabilidade**: Falhas <5%

## Integração CI/CD

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: npm run test:ci
  env:
    CYPRESS_baseUrl: ${{ secrets.BASE_URL }}
```

### Configuração de Ambiente
- Configure secrets no CI
- Use ambiente de staging
- Execute em múltiplos browsers

## Manutenção

### Atualizações Regulares
1. **Seletores**: Verificar após mudanças UI
2. **APIs**: Atualizar após mudanças backend
3. **Dados**: Manter dados de teste atualizados
4. **Versões**: Atualizar Cypress regularmente

### Debugging
1. **Cypress Debug**: Use `.debug()` nos testes
2. **Console Logs**: Monitore logs do browser
3. **Network**: Verifique requisições
4. **Screenshots**: Analise capturas de tela

## Contato

Para dúvidas sobre os testes:
- Documentação: Este arquivo
- Configuração: `cypress.config.ts`
- Comandos: `cypress/support/commands.ts`

---

**Nota**: Esta suíte de testes foi desenvolvida para garantir a qualidade e confiabilidade da plataforma alugae.mobi. Execute regularmente para detectar regressões e manter a estabilidade do sistema.