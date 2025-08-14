# DocuSign Integration Setup Guide

## Status Atual
✅ Credenciais configuradas  
✅ Chave privada validada  
✅ JWT funcionando  
❌ **Pendente:** Individual Consent (passo único)

## Solução: Individual Consent

Seguindo a [documentação oficial DocuSign](https://developers.docusign.com/platform/auth/oauth/jwt/consent/), nossa aplicação precisa de **Individual Consent** para autorizar o JWT Grant flow.

### Passo 1: Verificar Integration Key Settings

1. Acesse [DocuSign Apps (Demo)](https://apps-d.docusign.com/)
2. Encontre sua aplicação: `b34da473-b2ba-483b-ba14-d81066c46bb1`
3. Configure:
   - **Authentication**: Authorization Code Grant (não Implicit)
   - **Redirect URI**: `https://www.docusign.com`

### Passo 2: Autorizar Individual Consent

Abra esta URL no navegador:

```
https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=b34da473-b2ba-483b-ba14-d81066c46bb1&redirect_uri=https%3A%2F%2Fwww.docusign.com
```

**O que acontecerá:**
1. Login na sua conta DocuSign
2. Formulário de consent para scopes: `signature` e `impersonation`
3. Redirecionamento para docusign.com (normal)

### Passo 3: Testar Integração

Após autorização, teste:
```bash
node test-docusign-direct.js
```

**Resultado esperado:**
- ✅ Access token obtido
- ✅ API call bem-sucedida
- ✅ DocuSign integração funcional

## Por que Individual Consent?

1. **Não temos Administrative Consent** - requer Access Management with SSO feature
2. **Individual Consent funciona sempre** - sem pré-requisitos
3. **É um passo único** - consent é armazenado no DocuSign

## Após Setup

Uma vez autorizado, a integração funcionará automaticamente:
- Contratos serão criados via DocuSign API
- Envelopes com URLs de assinatura serão gerados
- Sistema de assinatura digital estará completo

## Troubleshooting

**Se a URL de consent der erro:**
1. Verifique se Authorization Code Grant está habilitado
2. Confirme se Redirect URI está configurado exatamente como: `https://www.docusign.com`
3. Use o Integration Key exato: `b34da473-b2ba-483b-ba14-d81066c46bb1`

**Referencias:**
- [OAuth JWT: Granting Consent](https://developers.docusign.com/platform/auth/oauth/jwt/consent/)
- [Connected Apps Documentation](https://support.docusign.com/guides/ndse-admin-guide-connected-apps)