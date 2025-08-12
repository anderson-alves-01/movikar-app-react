
# Testes End-to-End com Playwright

## Visão Geral

Este diretório contém testes end-to-end usando Playwright para validar todos os fluxos críticos da aplicação alugae.mobi.

## Estrutura de Testes

```
tests/e2e/
├── auth.spec.js              # Testes de autenticação
├── vehicle-management.spec.js # Testes de gestão de veículos  
├── booking-flow.spec.js       # Testes de fluxo de reserva
├── inspection-flow.spec.js    # Testes de vistoria
├── admin-panel.spec.js        # Testes do painel admin
└── helpers/
    ├── auth-helper.js         # Helper de autenticação
    └── data-helper.js         # Helper de dados de teste
```

## Executando os Testes

### Pré-requisitos
1. Servidor deve estar rodando em http://0.0.0.0:5000
2. Banco de dados deve estar populado com dados de teste

```bash
# Executar todos os testes
node tests/run-playwright.js

# Executar com interface gráfica
node tests/run-playwright.js --ui

# Executar teste específico
node tests/run-playwright.js tests/e2e/auth.spec.js

# Executar em modo debug
node tests/run-playwright.js --debug

# Executar com cabeça visível (não-headless)
node tests/run-playwright.js --headed
```

## Cobertura de Testes

### ✅ Autenticação
- Registro de usuário
- Login/logout
- Validação de credenciais
- Proteção de rotas

### ✅ Gestão de Veículos
- Listagem de veículos
- Busca e filtros
- Detalhes do veículo
- Disponibilidade

### ✅ Fluxo de Reserva
- Seleção de veículo
- Preenchimento de datas
- Processo de checkout
- Confirmação de pagamento

### ✅ Sistema de Vistoria
- Preenchimento do formulário
- Upload de fotos
- Aprovação/reprovação
- Validações obrigatórias

### ✅ Painel Administrativo
- Dashboard administrativo
- Gestão de usuários
- Aprovação de veículos
- Relatórios

## Configurações

### Navegadores Suportados
- Chromium (padrão)
- Firefox
- Safari (macOS)
- Mobile Chrome

### Configurações Específicas para Replit
- Modo headless por padrão
- Argumentos otimizados para containers
- Timeout aumentado para ambiente de CI
- Screenshots e vídeos em falhas

## Helpers Disponíveis

### AuthHelper
```javascript
import { AuthHelper } from './helpers/auth-helper.js';

test('exemplo', async ({ page }) => {
  const auth = new AuthHelper(page);
  await auth.loginAsAdmin();
  // ... resto do teste
});
```

### DataHelper
```javascript
import { DataHelper } from './helpers/data-helper.js';

test('exemplo', async ({ page }) => {
  const vehicleData = DataHelper.generateVehicleData();
  const bookingData = DataHelper.generateBookingData();
  // ... usar dados
});
```

## Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Cleanup**: Limpar dados criados durante o teste
3. **Esperas**: Usar `waitFor` em vez de `sleep`
4. **Seletores**: Priorizar data-testid sobre texto
5. **Assertion**: Verificar estados intermediários importantes

## Debugging

### Para debugging local:
```bash
node tests/run-playwright.js --debug --headed
```

### Para ver traces:
Os traces são salvos automaticamente em falhas e podem ser visualizados com:
```bash
npx playwright show-trace tests/results/trace.zip
```

## Relatórios

Os relatórios são gerados em:
- `tests/results/playwright-report/` (HTML)
- `tests/results/playwright-results.json` (JSON)

## Integração CI/CD

Os testes são executados automaticamente em:
- Pull requests
- Deploy para produção
- Builds diários

## Troubleshooting

### Erro: "Server not responding"
- Verifique se `npm run dev` está rodando
- Confirme que a porta 5000 está disponível

### Erro: "Element not found" 
- Verifique se os data-testid estão corretos
- Confirme se os elementos são visíveis na tela

### Erro: "Timeout"
- Aumente timeout específico se necessário
- Verifique se há problemas de performance
