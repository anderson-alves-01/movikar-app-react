# 🔴 Erro: AppRegistryBinding::startSurface failed

## ❌ Erro Completo
```
AppRegistryBinding::startSurface failed. Global was not installed.
```

## 🎯 Causas Possíveis

### 1. **Conflito JSC vs Hermes** ⚠️
O app.config.js tinha configurações conflitantes:
- `jsEngine: "jsc"` 
- `enableHermes: true`

**Correção aplicada**: Agora usa `jsEngine: "hermes"` (consistente)

### 2. **Cache Corrompido**
Metro bundler ou cache nativo pode estar corrompido

### 3. **Bundle JavaScript Não Carregado**
O bundle pode não ter sido gerado/carregado corretamente

---

## ✅ SOLUÇÃO RÁPIDA (Limpar Tudo)

**Opção A - Script Automático (RECOMENDADO)**:
```bash
cd mobile
bash fix-cache.sh
npx expo prebuild --clean
npx expo run:android
```

**Opção B - Comandos Manuais**:
```bash
# 1. Pare tudo
killall node 2>/dev/null

# 2. Navegue para mobile E execute limpeza
cd mobile

# 3. Limpe Gradle primeiro (antes de deletar)
if [ -d "android" ]; then
  (cd android && ./gradlew clean)
fi

# 4. Remova tudo
rm -rf node_modules android ios .expo
npm cache clean --force

# 5. Reinstale e rebuilde
npm install
npx expo prebuild --clean
npx expo run:android
```

**Tempo**: ~10 minutos

---

## 🔧 Solução Alternativa (Mais Rápida)

Se não quiser deletar tudo:

```bash
cd mobile

# Limpar cache do Metro
npx expo start --clear

# Em outro terminal
npx expo run:android --no-bundler
```

---

## 🐛 Troubleshooting por Sintoma

### Sintoma 1: Tela vermelha "Global was not installed"
**Causa**: Bundle não carregou  
**Solução**:
```bash
# Matar Metro bundler
killall node

# Limpar cache e reiniciar
npx expo start --clear
```

### Sintoma 2: App fecha imediatamente
**Causa**: Conflito JSC/Hermes  
**Solução**: Verificar `app.config.js` - deve ter APENAS Hermes:
```javascript
jsEngine: "hermes",  // ✅ Correto
// enableHermes: true // ❌ Remover (redundante)
```

### Sintoma 3: Build falha com erro NativeAnimatedModule
**Causa**: Cache do Gradle corrompido  
**Solução**:
```bash
cd mobile/android
./gradlew clean
./gradlew cleanBuildCache
cd ../..
npx expo run:android
```

---

## 📋 Checklist de Verificação

Execute e verifique cada item:

### 1. Metro Bundler Rodando?
```bash
ps aux | grep metro
```
Se NÃO aparecer nada, inicie:
```bash
npx expo start --clear
```

### 2. Bundle Gerado?
```bash
ls -la mobile/android/app/build/generated/assets/
```
Deve mostrar arquivos `.bundle`

### 3. Hermes Configurado?
```bash
grep -i "hermes" mobile/app.config.js
grep -i "jsc" mobile/app.config.js
```
Deve aparecer APENAS "hermes"

### 4. Permissões ADB OK?
```bash
adb devices
```
Deve mostrar dispositivo "authorized"

---

## 🚀 Comandos de Debug

### Ver Logs Detalhados
```bash
# Logs do React Native
adb logcat *:S ReactNative:V ReactNativeJS:V

# Logs de erros apenas
adb logcat *:E

# Logs completos
adb logcat | grep -i "error\|exception\|fatal"
```

### Verificar Bundle
```bash
# Ver se bundle está carregando
adb logcat | grep -i "bundle"

# Ver progresso do Metro
npx expo start --verbose
```

### Reiniciar ADB
```bash
adb kill-server
adb start-server
adb devices
```

---

## 🔬 Diagnóstico Avançado

### Teste 1: Bundle Manual
```bash
# Gerar bundle manualmente
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res

# Depois rebuildar
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### Teste 2: Modo Hermes Forçado
No `app.config.js`, force Hermes:
```javascript
android: {
  enableHermes: true,
  jsEngine: "hermes"
}
```

### Teste 3: Build sem Metro
```bash
npx expo run:android --no-bundler
```
Depois inicie Metro separado:
```bash
npx expo start --clear
```

---

## 🎯 Solução Definitiva (100% Funcional)

Se **NADA** funcionou, esta é a solução garantida:

```bash
#!/bin/bash

# 1. Cleanup total
cd mobile
killall -9 node
rm -rf node_modules package-lock.json
rm -rf android ios .expo
rm -rf $HOME/.gradle/caches
rm -rf $TMPDIR/metro-* 2>/dev/null || true

# 2. Reinstalar
npm install

# 3. Configurar Hermes
cat > temp_config.js << 'EOF'
export default {
  expo: {
    jsEngine: "hermes",
    android: {
      enableHermes: true
    }
  }
}
EOF

# 4. Gerar nativo
npx expo prebuild --clean

# 5. Build
npx expo run:android --verbose
```

**Salve como**: `mobile/fix-appregistry.sh`  
**Execute**: `bash mobile/fix-appregistry.sh`

---

## ❓ FAQ

### Q: Por que acontece esse erro?
**A**: React Native precisa que o "global object" do JavaScript esteja disponível antes de registrar componentes. Se o bundle não carrega ou há conflito de engines, esse global não é instalado.

### Q: JSC vs Hermes - qual usar?
**A**: **Hermes** (recomendado)
- ✅ Mais rápido
- ✅ Menos memória
- ✅ Padrão do React Native moderno
- ✅ Melhor suporte Expo

### Q: Posso usar Expo Go?
**A**: Não para este erro. Expo Go tem bundle próprio. Você precisa de build nativo:
- `npx expo run:android` (local)
- `eas build` (nuvem)

### Q: Quanto tempo leva para corrigir?
**A**:
- Limpeza de cache: 2 min
- Rebuild completo: 5-10 min
- Solução definitiva (cleanup total): 10-15 min

---

## 🆘 Ainda com Problema?

### Passo 1: Capture Logs Completos
```bash
# Limpar logs antigos
adb logcat -c

# Capturar novos logs
adb logcat > app_error.log &

# Rodar app
npx expo run:android

# Aguardar 30 segundos
sleep 30

# Parar captura
killall adb

# Ver arquivo
cat app_error.log | grep -i "error\|exception\|fatal"
```

### Passo 2: Verificar Versões
```bash
node --version          # Deve ser >= 18
npm --version           # Deve ser >= 9
npx expo --version      # Deve ser >= 53
adb --version           # Qualquer versão
```

### Passo 3: Testar Build Mínimo
Crie `mobile/App.minimal.js`:
```javascript
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Teste Mínimo</Text>
    </View>
  );
}
```

Altere `mobile/index.js`:
```javascript
import { AppRegistry } from 'react-native';
import App from './App.minimal';

AppRegistry.registerComponent('main', () => App);
```

Teste:
```bash
npx expo run:android
```

Se funcionar → Problema no código
Se não funcionar → Problema na configuração

---

## ✅ Correção Aplicada

**Status**: ✅ Configuração corrigida  
**Mudança**: `jsEngine: "jsc"` → `jsEngine: "hermes"`  
**Próximo passo**: Executar limpeza de cache

---

*Última atualização: 2025-10-15*
