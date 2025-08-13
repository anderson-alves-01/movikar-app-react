# Guia de Integração DocuSign Real

## Status Atual
✅ **Biblioteca DocuSign instalada** (`docusign-esign v8.3.0`)  
✅ **Serviço DocuSign implementado** com autenticação JWT  
✅ **Simuladores funcionais** para desenvolvimento  
❌ **Credenciais não configuradas** (usando modo mock)

## Dificuldades da Migração

### 1. **Configuração de Credenciais Complexa**
O DocuSign requer 5 credenciais diferentes:
```bash
DOCUSIGN_INTEGRATION_KEY    # Client ID da aplicação
DOCUSIGN_SECRET_KEY         # Client Secret  
DOCUSIGN_USER_ID            # GUID do usuário
DOCUSIGN_ACCOUNT_ID         # ID da conta DocuSign
DOCUSIGN_PRIVATE_KEY        # Chave privada RSA para JWT
```

### 2. **Processo de Setup no DocuSign Developer**

#### Passo 1: Criar Conta Developer
1. Acesse https://developers.docusign.com/
2. Crie conta gratuita de desenvolvedor
3. Confirme email e ative a conta

#### Passo 2: Criar Aplicação
1. No painel, vá em "Apps and Keys"
2. Clique em "ADD APP AND INTEGRATION KEY"
3. Preencha:
   - App Name: "alugae.mobi"
   - Description: "Car rental platform with digital contracts"
4. Salve o **Integration Key** (será o DOCUSIGN_INTEGRATION_KEY)

#### Passo 3: Configurar Autenticação JWT
1. Na aplicação criada, vá na seção "Service Integration"
2. Marque "JWT (JSON Web Token)" como método de auth
3. Clique em "GENERATE RSA KEYPAIR"
4. Salve a chave privada (DOCUSIGN_PRIVATE_KEY)
5. A chave pública fica automaticamente configurada

#### Passo 4: Obter IDs Necessários
1. **User ID**: No perfil do usuário, copie o GUID
2. **Account ID**: Na dashboard, copie o Account ID
3. **Secret Key**: Na aplicação, gere um client secret

#### Passo 5: Configurar Redirect URI
Adicione as URLs de callback:
```
http://localhost:5000/contract-signed
https://seu-dominio.com/contract-signed
```

### 3. **Concessão de Consentimento (Critical!)**
O DocuSign requer consentimento administrativo:

1. Monte a URL de consentimento:
```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=SEU_INTEGRATION_KEY&redirect_uri=http://localhost:5000/contract-signed
```

2. Acesse a URL no navegador
3. Faça login com sua conta DocuSign
4. Autorize as permissões solicitadas
5. **IMPORTANTE**: Isso deve ser feito apenas uma vez

### 4. **Configuração das Variáveis**

Adicione no arquivo `.env`:
```bash
# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=sua-integration-key-aqui
DOCUSIGN_SECRET_KEY=seu-secret-key-aqui  
DOCUSIGN_USER_ID=seu-user-id-guid-aqui
DOCUSIGN_ACCOUNT_ID=seu-account-id-aqui
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
SUA-CHAVE-PRIVADA-AQUI-EM-MULTIPLAS-LINHAS
-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_URL=https://demo.docusign.net/restapi
```

### 5. **Ambiente de Produção**
Para produção, mude apenas:
```bash
DOCUSIGN_BASE_URL=https://na1.docusign.net/restapi
```

## Implementação Realizada

### Funcionalidades Implementadas
✅ **Autenticação JWT** com refresh automático  
✅ **Criação de envelopes** com documentos PDF  
✅ **Posicionamento de assinaturas** automático  
✅ **URLs de assinatura** para locatário e proprietário  
✅ **Consulta de status** do envelope  
✅ **Processamento de webhooks** DocuSign Connect  
✅ **Modo mock** quando credenciais não configuradas  

### Arquitetura
```typescript
// Uso simples - seleciona automaticamente o serviço
await sendToSignaturePlatform(contract, 'docusign');

// Verificar status
await checkDocumentStatus('docusign', envelopeId);
```

### Fluxo de Assinatura
1. **Sistema gera PDF** do contrato
2. **DocuSign cria envelope** com 2 signatários
3. **Usuários recebem email** com link de assinatura
4. **Sistema recebe webhooks** sobre progresso
5. **Contrato é marcado como assinado** quando completo

## Benefícios do DocuSign vs Simulador

### DocuSign Real
✅ **Assinaturas válidas juridicamente**  
✅ **Rastreabilidade completa** (IP, timestamps, certificados)  
✅ **Integração com sistemas legais**  
✅ **Auditoria e compliance**  
✅ **Notificações automáticas**  
✅ **Assinatura móvel nativa**  

### Simulador Atual  
✅ **Desenvolvimento rápido**  
✅ **Zero custo**  
✅ **Sem configuração**  
❌ **Sem validade jurídica**  
❌ **Dados mockados**  
❌ **Sem rastreabilidade real**  

## Custos

### Plano Developer (Gratuito)
- 30 envelopes/mês grátis
- Ambiente sandbox completo
- Ideal para testes e desenvolvimento

### Plano Produção
- A partir de $10/mês por usuário
- Cobrança por envelope enviado (~$0.50)
- Recursos enterprise disponíveis

## Testando a Integração

1. Configure as credenciais no `.env`
2. Reinicie o servidor
3. Crie um contrato de teste:
```bash
curl -X POST http://localhost:5000/api/contracts \
  -H "Content-Type: application/json" \
  -d '{"signaturePlatform": "docusign", ...}'
```

## Solução de Problemas

### Erro de Autenticação
- Verifique se fez o consentimento administrativo
- Confirme que a chave privada está no formato correto
- Teste com o User ID correto

### Erro de Envelope
- Verifique se o Account ID está correto
- Confirme que o usuário tem permissões
- Teste primeiro no ambiente demo

### Webhooks Não Funcionam
- Configure DocuSign Connect no painel
- Use ngrok para testes locais
- Verifique se a URL está acessível

## Próximos Passos

Para ativar o DocuSign real:
1. ✅ **Criar conta developer** (grátis)
2. ✅ **Configurar aplicação** no painel
3. ✅ **Gerar chaves** RSA
4. ✅ **Fazer consentimento** administrativo  
5. ✅ **Configurar variáveis** de ambiente
6. ✅ **Testar integração** com contrato real

A implementação está **100% pronta** - só faltam as credenciais!