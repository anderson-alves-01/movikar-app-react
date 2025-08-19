# Configuração de Email para Produção - alugae.mobi

## Passos para Configurar Email em Produção

### 1. Configurar Domínio no Resend

1. **Acesse o Resend Dashboard**: https://resend.com/domains
2. **Adicione seu domínio**: `alugae.mobi`
3. **Configure os registros DNS** no seu provedor de domínio:
   - Adicione os registros MX, TXT e CNAME fornecidos pelo Resend
   - Aguarde a verificação do domínio (pode levar até 24 horas)

### 2. Registros DNS Necessários (Exemplo)

```
Tipo: MX
Nome: @
Valor: 10 feedback-smtp.us-east-1.amazonses.com

Tipo: TXT  
Nome: @
Valor: v=spf1 include:amazonses.com ~all

Tipo: TXT
Nome: _dmarc
Valor: v=DMARC1; p=quarantine; rua=mailto:dmarc@alugae.mobi

Tipo: CNAME
Nome: rs._domainkey
Valor: rs.alugae.mobi._domainkey.resend.com
```

### 3. Configurar Variáveis de Ambiente

No seu arquivo `.env` em produção, adicione:

```bash
# Email Configuration para Produção
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
FROM_EMAIL=suporte@alugae.mobi
NODE_ENV=production
```

### 4. Teste de Funcionamento

Após a configuração, teste enviando um email:

```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "suporte@alugae.mobi",
    "to": ["seu-email@exemplo.com"],
    "subject": "Teste de Produção",
    "text": "Email funcionando em produção!"
  }'
```

### 5. Configuração Atual do Sistema

O sistema está agora configurado para:

- ✅ **Usar seu próprio domínio** (`suporte@alugae.mobi`)
- ✅ **Enviar para destinatários reais** (não mais modo teste)
- ✅ **Logs de produção** com informações essenciais
- ✅ **Fallback configurável** via variável FROM_EMAIL

### 6. Próximos Passos

1. **Configure o domínio no Resend**
2. **Adicione os registros DNS**
3. **Aguarde verificação**
4. **Defina FROM_EMAIL=suporte@alugae.mobi no .env**
5. **Teste uma reserva real**

### 7. Troubleshooting

Se emails não enviarem, verifique:
- Domínio verificado no Resend
- RESEND_API_KEY correta
- FROM_EMAIL usando domínio verificado
- Logs do servidor para erros específicos

---

**Importante**: Em produção, todos os emails serão enviados para os destinatários reais (locatários e proprietários).