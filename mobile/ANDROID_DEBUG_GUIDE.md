# 🔍 Guia de Debug para Crashes Android - alugae.mobi

## 📱 Métodos para Visualizar Logs de Crash

### Método 1: Logs do Expo (Mais Fácil)

Quando você inicia o app com Expo, os logs aparecem automaticamente no terminal:

```bash
cd mobile
npm start
```

**O que você verá:**
- ✅ Logs do JavaScript em tempo real
- ❌ Erros de código (syntax errors, runtime errors)
- ⚠️ Avisos (warnings)
- 📱 Eventos do app (navegação, API calls, etc.)

**Observação:** Pressione `a` para abrir no Android após iniciar o Expo.

---

### Método 2: ADB Logcat (Mais Completo)

O **Android Debug Bridge (adb)** mostra TODOS os logs do sistema Android, incluindo crashes nativos.

#### Pré-requisito:
- Ter o Android SDK instalado
- Dispositivo conectado via USB com "Depuração USB" ativada
- OU emulador Android rodando

#### Verificar dispositivos conectados:
```bash
cd mobile
npm run devices
```

Você deve ver algo como:
```
List of devices attached
emulator-5554    device
# ou
1A2B3C4D         device  (seu celular físico)
```

#### Scripts Disponíveis:

**1. Ver apenas logs do React Native (Recomendado):**
```bash
npm run logs:android
```
Mostra apenas mensagens relevantes do React Native e JavaScript.

**2. Ver TODOS os logs do sistema:**
```bash
npm run logs:android-all
```
⚠️ Atenção: Muita informação! Use apenas se precisar ver logs nativos.

**3. Ver APENAS erros:**
```bash
npm run logs:android-errors
```
Filtra apenas mensagens de erro, útil para identificar crashes rapidamente.

**4. Limpar logs antigos:**
```bash
npm run logs:clear
```
Limpa o buffer de logs antes de testar novamente.

---

### Método 3: Logs Diretos no Terminal (Sem Scripts)

Se preferir usar comandos diretos:

```bash
# Apenas React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Filtrar por palavra-chave (ex: "crash", "error", "fatal")
adb logcat | grep -i "crash"
adb logcat | grep -i "error"

# Ver logs de um app específico
adb logcat | grep "com.alugae.mobile"

# Salvar logs em arquivo
adb logcat > crash-log.txt
```

---

## 🎯 Como Identificar o Problema

### 1. **Crash no JavaScript (Mais Comum)**

**Sintomas:**
- App abre mas fecha imediatamente
- Tela vermelha com erro no Expo
- Console mostra "Error" ou "Exception"

**Como identificar nos logs:**
```
ERROR  Error: Cannot read property 'X' of undefined
ERROR  TypeError: undefined is not an object
ERROR  ReferenceError: X is not defined
```

**Solução:** Verificar o código JavaScript mencionado no erro.

---

### 2. **Crash Nativo (Android)**

**Sintomas:**
- App fecha instantaneamente sem mensagem
- Sistema mostra "alugae parou"
- Nenhum erro aparece no Expo

**Como identificar nos logs:**
```
AndroidRuntime: FATAL EXCEPTION
AndroidRuntime: Process: com.alugae.mobile
java.lang.RuntimeException
```

**Causas comuns:**
- Falta de permissão (location, camera, etc.)
- Incompatibilidade de biblioteca nativa
- Problema com Hermes engine
- Memória insuficiente

**Solução:** Verificar permissões no `app.config.js` e compatibilidade de dependências.

---

### 3. **Crash de Rede/API**

**Sintomas:**
- App funciona offline mas crash ao fazer requests
- Erro ao carregar dados

**Como identificar nos logs:**
```
ERROR  Network request failed
ERROR  TypeError: Failed to fetch
ERROR  Unhandled promise rejection
```

**Solução:** Verificar URL da API, CORS, SSL, timeout.

---

## 🛠️ Workflow Recomendado de Debug

### Passo 1: Reproduzir o Crash
1. Limpe os logs: `npm run logs:clear`
2. Inicie o monitoramento: `npm run logs:android-errors`
3. Abra o app no celular/emulador
4. Execute a ação que causa o crash

### Passo 2: Analisar os Logs
Procure por:
- `FATAL EXCEPTION` (crash nativo)
- `ERROR` (erro JavaScript)
- `at ` (stack trace - mostra onde o erro ocorreu)

### Passo 3: Identificar a Causa
- **Linha do código:** O stack trace mostra qual arquivo e linha causou o erro
- **Tipo de erro:** TypeError, ReferenceError, RuntimeException, etc.
- **Contexto:** O que você estava fazendo quando crashou?

### Passo 4: Resolver
- Corrigir o código
- Atualizar dependências se necessário
- Adicionar tratamento de erro (try/catch)

---

## 📋 Checklist para Crashes Comuns

### ✅ App crasha ao abrir
- [ ] Verificar `App.tsx` e `index.js`
- [ ] Confirmar que todas as dependências estão instaladas: `npm install`
- [ ] Limpar cache: `expo start -c`
- [ ] Verificar se Hermes está ativado corretamente

### ✅ App crasha ao acessar câmera/location
- [ ] Verificar permissões no `app.config.js`
- [ ] Pedir permissões em runtime (não só no config)
- [ ] Testar se o dispositivo tem o hardware necessário

### ✅ App crasha ao navegar entre telas
- [ ] Verificar configuração do React Navigation
- [ ] Verificar se todos os screens estão importados
- [ ] Verificar tipos de parâmetros das rotas

### ✅ App crasha ao fazer login/API calls
- [ ] Verificar URL da API
- [ ] Verificar token de autenticação
- [ ] Verificar tratamento de erro nas promises
- [ ] Verificar timeout de rede

---

## 🔧 Ferramentas Adicionais

### Expo DevTools
```bash
npm start
```
Pressione `Shift + M` para abrir o menu e visualizar:
- Performance monitor
- Network inspector
- React DevTools

### React Native Debugger
Conectar ao Metro Bundler para:
- Inspecionar estado da aplicação
- Ver console.log() detalhados
- Debugar Redux/Context

---

## 💡 Dicas Extras

1. **Adicione console.log() estratégicos:**
```javascript
console.log('🔵 Iniciando função X');
console.log('📦 Dados recebidos:', data);
console.log('❌ Erro capturado:', error);
```

2. **Use try/catch em código assíncrono:**
```javascript
try {
  const response = await apiService.getVehicles();
  console.log('✅ Veículos carregados:', response);
} catch (error) {
  console.error('❌ Erro ao carregar veículos:', error);
}
```

3. **Ative o modo de desenvolvimento no Android:**
- Abra o app
- Agite o celular (ou Ctrl+M no emulador)
- Ative "Debug JS Remotely" ou "Show Perf Monitor"

---

## 📞 Problemas Comuns e Soluções

### "adb: command not found"
**Solução:** Instalar Android SDK Platform Tools:
- Download: https://developer.android.com/studio/releases/platform-tools
- Adicionar ao PATH do sistema

### "No devices/emulators found"
**Solução:**
- Ativar "Depuração USB" no celular
- Verificar se o cabo USB funciona para transferência de dados
- Reiniciar o servidor adb: `adb kill-server && adb start-server`

### "Cannot connect to Metro Bundler"
**Solução:**
- Verificar se `npm start` está rodando
- Usar túnel: `expo start --tunnel`
- Verificar firewall/antivírus

---

## 📚 Recursos Úteis

- [Expo Debugging Guide](https://docs.expo.dev/debugging/runtime-issues/)
- [React Native Debugging](https://reactnative.dev/docs/debugging)
- [ADB Documentation](https://developer.android.com/studio/command-line/adb)

---

**Precisa de ajuda?** Copie o log completo do erro e compartilhe para análise detalhada!
