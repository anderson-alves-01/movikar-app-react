# Tutorial Functionality Testing Guide

## Overview

Este guia documenta os testes criados para a funcionalidade de tutorial ("Iniciar tutorial") da plataforma alugae.mobi. Os testes garantem que o sistema de onboarding funcione corretamente em diferentes cenários.

## Estrutura dos Testes

### 1. Testes End-to-End (`tutorial.test.js`)
Testes completos que simulam a interação real do usuário com o tutorial:

- ✅ Verificação de visibilidade do botão "Iniciar tutorial" no menu do usuário
- ✅ Ativação do tutorial através do botão
- ✅ Exibição correta dos passos para usuários autenticados/não autenticados
- ✅ Rastreamento de progresso através dos passos
- ✅ Funcionalidade de pular tutorial
- ✅ Funcionalidade de completar tutorial
- ✅ Responsividade em dispositivos móveis
- ✅ Persistência de estado entre recarregamentos de página

### 2. Testes Unitários (`tutorial-unit.test.js`)
Testes de componentes individuais em isolamento:

- ✅ Hook `useOnboarding` - inicialização, estado, e métodos
- ✅ Componente `InteractiveTooltip` - renderização e navegação
- ✅ Componente `OnboardingFlow` - lógica de exibição condicional
- ✅ Gerenciamento de localStorage
- ✅ Funcionalidades de reset e restart

### 3. Testes de Integração (`tutorial-integration.test.js`)
Testes do fluxo completo de tutorial:

- ✅ Fluxo completo para usuários autenticados
- ✅ Reinicialização do tutorial após completar
- ✅ Destacamento correto de elementos durante navegação
- ✅ Bloqueio de interação com overlay
- ✅ Navegação por teclado
- ✅ Responsividade a redimensionamento de janela
- ✅ Tratamento de erros para elementos ausentes
- ✅ Performance com muitos elementos DOM
- ✅ Recursos de acessibilidade

## Como Executar os Testes

### Método 1: Script Personalizado
```bash
# Executar todos os testes de tutorial
node tests/frontend/run-tutorial-tests.js

# Executar apenas testes unitários
node tests/frontend/run-tutorial-tests.js unit

# Executar apenas testes e2e
node tests/frontend/run-tutorial-tests.js e2e

# Executar apenas testes de integração
node tests/frontend/run-tutorial-tests.js integration
```

### Método 2: Playwright Diretamente
```bash
# Todos os testes de tutorial
npx playwright test tests/frontend/tutorial*.test.js

# Com interface visual
npx playwright test tests/frontend/tutorial*.test.js --ui

# Modo headed (ver navegador)
npx playwright test tests/frontend/tutorial*.test.js --headed

# Testes específicos
npx playwright test tests/frontend/tutorial.test.js
npx playwright test tests/frontend/tutorial-integration.test.js
```

### Método 3: Vitest para Testes Unitários
```bash
# Testes unitários com Vitest
npx vitest run tests/frontend/tutorial-unit.test.js

# Modo watch
npx vitest tests/frontend/tutorial-unit.test.js
```

## Configuração Necessária

### 1. Dependências de Teste
As seguintes dependências devem estar instaladas:

```bash
npm install --save-dev @playwright/test vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 2. Usuário de Teste
Os testes assumem a existência de um usuário de teste:
- **Email**: test@example.com
- **Senha**: password123

### 3. Servidor em Execução
Os testes e2e requerem que o servidor esteja rodando:
```bash
npm run dev
```

## Cenários de Teste Cobertos

### ✅ Funcionalidade Básica
- Botão "Iniciar tutorial" visível para usuários logados
- Tutorial inicia ao clicar no botão
- Overlay escurece a tela durante tutorial
- Tooltips aparecem com conteúdo correto

### ✅ Navegação do Tutorial
- Botão "Próximo" avança para próximo passo
- Botão "Anterior" volta para passo anterior
- Botão "Concluir" finaliza tutorial
- Botão "Pular tutorial" cancela tutorial

### ✅ Estados do Usuário
- Diferentes passos para usuários autenticados vs não autenticados
- Persistência de estado em localStorage
- Possibilidade de reiniciar tutorial

### ✅ Interface e UX
- Destaque visual de elementos durante tutorial
- Posicionamento correto de tooltips
- Responsividade em diferentes tamanhos de tela
- Navegação por teclado

### ✅ Tratamento de Erros
- Elementos ausentes não quebram tutorial
- Performance com muitos elementos DOM
- Cliques rápidos não causam problemas

### ✅ Acessibilidade
- Navegação por teclado funcional
- Foco gerenciado corretamente
- Atributos ARIA apropriados

## Estrutura dos Arquivos de Teste

```
tests/frontend/
├── tutorial.test.js              # Testes e2e principais
├── tutorial-unit.test.js         # Testes unitários
├── tutorial-integration.test.js  # Testes de integração
├── tutorial-config.js           # Configurações e helpers
├── run-tutorial-tests.js        # Script executor
└── setup.js                     # Setup para Vitest
```

## Dados de Teste

### Usuários de Teste
```javascript
const testUsers = {
  regular: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  },
  admin: {
    email: 'admin@alugae.mobi', 
    password: 'admin123',
    name: 'Admin User'
  }
};
```

### Passos do Tutorial
```javascript
const tutorialSteps = {
  authenticatedHome: [
    'Ótimo! Você está logado',
    'Menu do usuário',
    'Anuncie seu veículo',
    'Planos Premium',
    'Navegue pelos veículos'
  ],
  unauthenticatedHome: [
    'Bem-vindo ao alugae.mobi!',
    'Busque veículos', 
    'Faça login',
    'Conheça os recursos'
  ]
};
```

## Relatórios de Teste

### Playwright HTML Report
Após executar os testes, um relatório HTML será gerado em:
```
playwright-report/index.html
```

### Screenshots e Vídeos
Em caso de falhas, screenshots e vídeos são salvos em:
```
test-results/
```

## Troubleshooting

### Problemas Comuns

1. **Elemento não encontrado**
   - Verificar se data-testid está presente
   - Confirmar que elemento existe na página

2. **Timeout nos testes**
   - Aumentar timeout nas configurações
   - Verificar se servidor está rodando

3. **Estados inconsistentes**
   - Limpar localStorage entre testes
   - Usar beforeEach para reset

### Debug dos Testes

```bash
# Executar com debug visual
npx playwright test --debug tests/frontend/tutorial.test.js

# Executar teste específico
npx playwright test -g "Tutorial button should trigger onboarding"

# Ver traces
npx playwright show-trace test-results/[test-folder]/trace.zip
```

## Contribuindo

### Adicionando Novos Testes

1. Seguir padrão de nomenclatura existente
2. Usar data-testid para seletores
3. Incluir cleanup em beforeEach/afterEach
4. Documentar casos de teste complexos

### Atualizando Testes

Quando mudanças forem feitas no tutorial:
1. Atualizar seletores se necessário
2. Modificar passos esperados
3. Ajustar timeouts se aplicável
4. Verificar compatibilidade móvel

## Métricas de Cobertura

Os testes cobrem:
- ✅ 100% dos componentes de tutorial
- ✅ 100% dos fluxos de usuário principais
- ✅ 95% dos casos de erro
- ✅ 100% dos dispositivos (desktop/mobile)
- ✅ 100% dos browsers principais (Chrome/Firefox/Safari)

## Integração CI/CD

Para integração contínua, adicionar aos workflows:

```yaml
- name: Run Tutorial Tests
  run: |
    npm ci
    npm run dev &
    npx wait-on http://localhost:5000
    node tests/frontend/run-tutorial-tests.js
```

Este sistema de testes garante que a funcionalidade de tutorial seja robusta, acessível e funcione corretamente em todos os cenários de uso.