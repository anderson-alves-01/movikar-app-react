# Sistema de Destaques de Veículos Baseado em Assinatura

## Visão Geral

O sistema de destaques permite que proprietários de veículos com assinaturas pagas destaquem seus anúncios para receber mais visualizações. Os veículos destacados aparecem prioritariamente na home page e têm aparência visual diferenciada.

## Funcionalidades Principais

### 1. Planos de Assinatura e Limites
- **Plano Essencial (R$ 29,90/mês)**: 3 destaques disponíveis
- **Plano Plus (R$ 59,90/mês)**: 10 destaques disponíveis
- **Plano Gratuito**: Sem acesso aos destaques

### 2. Tipos de Destaque

#### Destaque Prata
- **Disponível**: Planos Essencial e Plus
- **Benefício**: 3x mais visualizações
- **Duração**: 7 dias
- **Visual**: Badge cinza com ícone de estrelas

#### Destaque Diamante
- **Disponível**: Apenas Plano Plus
- **Benefício**: 10x mais visualizações
- **Duração**: 7 dias
- **Visual**: Badge dourado com ícone de coroa

## Arquitetura Técnica

### Backend

#### Schema do Banco de Dados
```sql
-- Campos adicionados na tabela vehicles
ALTER TABLE vehicles ADD COLUMN is_highlighted BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN highlight_type VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN highlight_expires_at TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN highlight_usage_count INTEGER DEFAULT 0;

-- Campos na tabela users
ALTER TABLE users ADD COLUMN highlights_available INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN highlights_used INTEGER DEFAULT 0;
```

#### Endpoints da API

##### GET /api/vehicles/{id}/highlight-options
Retorna as opções de destaque disponíveis para um veículo específico:
```json
{
  "vehicle": {
    "id": 43,
    "isHighlighted": false,
    "highlightType": null,
    "highlightExpiresAt": null
  },
  "user": {
    "subscriptionPlan": "plus",
    "highlightsAvailable": 10,
    "highlightsUsed": 0
  },
  "availableHighlights": [
    {
      "type": "prata",
      "name": "Destaque Prata",
      "description": "Seu veículo recebe 3x mais visualizações",
      "duration": "7 dias",
      "available": true
    },
    {
      "type": "diamante", 
      "name": "Destaque Diamante",
      "description": "Seu veículo recebe 10x mais visualizações",
      "duration": "7 dias",
      "available": true
    }
  ]
}
```

##### POST /api/vehicles/{id}/highlight
Aplica um destaque ao veículo:
```json
{
  "highlightType": "diamante"
}
```

#### Lógica de Ordenação
Os veículos são ordenados na home page com a seguinte prioridade:
1. **Destaques Diamante** (destacados e não expirados)
2. **Destaques Prata** (destacados e não expirados)  
3. **Veículos normais** (ordenados por data de criação)

```sql
ORDER BY 
  CASE 
    WHEN v.is_highlighted = true AND v.highlight_expires_at > NOW() THEN
      CASE v.highlight_type
        WHEN 'diamante' THEN 1
        WHEN 'prata' THEN 2
        ELSE 3
      END
    ELSE 4
  END,
  v.created_at DESC
```

### Frontend

#### Componente VehicleHighlightManager
Localização: `client/src/components/vehicle-highlight-manager.tsx`

**Funcionalidades:**
- Exibe status atual do destaque do veículo
- Mostra opções disponíveis baseadas na assinatura do usuário
- Permite aplicar novos destaques
- Valida limites de uso
- Redireciona usuários gratuitos para planos de assinatura

**Estados do Componente:**
1. **Veículo já destacado**: Mostra informações de expiração
2. **Usuário sem assinatura**: Incentiva upgrade para plano pago
3. **Sem destaques disponíveis**: Sugere upgrade de plano
4. **Seleção de destaque**: Interface para escolher tipo de destaque

#### Integração na Página de Veículos
Localização: `client/src/pages/vehicles.tsx`

O componente é integrado como modal que abre quando o usuário clica no botão "Destacar" de cada veículo.

#### Visual dos Destaques na Home
Localização: `client/src/components/vehicle-card.tsx`

**Destaque Diamante:**
- Borda dourada (border-yellow-400)
- Badge dourado com ícone de coroa
- Sombra amarela para destaque visual

**Destaque Prata:**
- Borda cinza (border-gray-400)
- Badge cinza com ícone de estrelas
- Sombra cinza sutil

## Fluxo de Uso

### Para Proprietários de Veículos

1. **Acesso ao Sistema**
   - Navegar para "Meus Veículos"
   - Clicar no botão "Destacar" do veículo desejado

2. **Verificação de Elegibilidade**
   - Sistema verifica assinatura ativa
   - Valida destaques disponíveis no plano

3. **Seleção do Destaque**
   - Usuários Essencial: Apenas Prata
   - Usuários Plus: Prata ou Diamante

4. **Aplicação do Destaque**
   - Destaque ativado por 7 dias
   - Contador de uso atualizado
   - Veículo passa a aparecer prioritariamente

### Para Visitantes da Plataforma

1. **Visualização na Home**
   - Veículos destacados aparecem primeiro
   - Visual diferenciado chama atenção
   - Badges indicam tipo de destaque

2. **Priorização nas Buscas**
   - Filtros mantêm ordenação por destaque
   - Maior visibilidade = mais conversões

## Validações e Regras de Negócio

### Validações de Backend
1. **Autenticação**: Usuário deve estar logado
2. **Propriedade**: Apenas dono do veículo pode destacar
3. **Assinatura Ativa**: Plano pago obrigatório
4. **Limites de Uso**: Não exceder destaques disponíveis
5. **Tipo de Destaque**: Diamante apenas para plano Plus
6. **Veículo Disponível**: Apenas veículos ativos podem ser destacados

### Validações de Frontend
1. **Interface Adaptativa**: Baseada no plano do usuário
2. **Feedback Visual**: Estados de loading e erro
3. **Prevenção de Spam**: Botões desabilitados durante requests

## Configuração e Deployment

### Variáveis de Ambiente
Não há variáveis específicas para o sistema de destaques. Utiliza a infraestrutura existente de autenticação e banco de dados.

### Dependências
- **Backend**: Funcionalidades existentes do Express/Drizzle
- **Frontend**: Componentes UI do Shadcn/UI, React Query

### Migrações de Banco
```sql
-- Adicionar colunas de destaque aos veículos existentes
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_highlighted BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS highlight_type VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS highlight_expires_at TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS highlight_usage_count INTEGER DEFAULT 0;

-- Configurar destaques baseados no plano de assinatura
UPDATE users SET 
  highlights_available = CASE 
    WHEN subscription_plan = 'essencial' THEN 3
    WHEN subscription_plan = 'plus' THEN 10
    ELSE 0
  END,
  highlights_used = 0
WHERE subscription_plan IS NOT NULL;
```

## Monitoramento e Métricas

### Métricas Importantes
1. **Taxa de Uso**: Porcentagem de usuários pagos que usam destaques
2. **Conversão**: Aumento de visualizações em veículos destacados
3. **Renovação**: Impacto dos destaques na retenção de assinantes
4. **Distribuição**: Uso de Prata vs Diamante

### Logs de Sistema
- Aplicação de destaques registrada com user_id, vehicle_id, highlight_type
- Expirações automáticas processadas em job diário
- Erros de validação logados para debugging

## Próximas Evoluções

### Funcionalidades Futuras
1. **Auto-renovação**: Destaque automático ao expirar
2. **Métricas Detalhadas**: Dashboard de performance dos destaques
3. **Agendamento**: Programar destaques para datas específicas
4. **Pacotes Personalizados**: Planos com diferentes quantidades de destaques
5. **Remarketing**: Sistema de notificações para usar destaques restantes

### Melhorias Técnicas
1. **Cache**: Otimização de queries frequentes
2. **Analytics**: Integração com ferramentas de monitoramento
3. **A/B Testing**: Testes de diferentes visuais de destaque
4. **Mobile**: Otimização para aplicativo móvel

## Conclusão

O sistema de destaques baseado em assinatura oferece valor claro tanto para proprietários (mais visualizações) quanto para a plataforma (receita recorrente). A implementação é robusta, escalável e integra-se naturalmente com a arquitetura existente da alugae.mobi.