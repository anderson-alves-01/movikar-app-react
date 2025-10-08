# 🚀 Guia de Build do Android - alugae Mobile

## 📋 Pré-requisitos

Antes de iniciar o build do Android, certifique-se de ter:

- Node.js 18.x ou superior
- npm 9.x ou superior
- Android Studio instalado
- Android SDK configurado
- Java JDK 17
- Variável de ambiente `ANDROID_HOME` configurada

## 🔧 Correções Implementadas

### 1. **React Estável (18.2.0)**
✅ Downgrade do React 19.0.0 (experimental) para 18.2.0 (estável e testado com React Native 0.79.5)

### 2. **Arquitetura Estável**
✅ `newArchEnabled=false` em `android/gradle.properties` para usar arquitetura estável

### 3. **Configurações Unificadas**
✅ Package name: `com.alugae.mobile` em todos os arquivos
- `app.json`
- `app.config.js`
- `android/app/build.gradle`

### 4. **Otimizações de Performance**
✅ Metro config otimizado para TurboModule
✅ Hermes habilitado com otimizações
✅ Large heap habilitado para Android

### 5. **Error Handling**
✅ Error boundaries implementadas
✅ Try/catch em index.js
✅ Logger service com tratamento global de erros

## 🛠️ Processo de Build

### Passo 1: Limpeza Completa

```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e package-lock.json
rm -rf node_modules package-lock.json

# Instalar dependências
npm install

# Limpar cache do Metro
npx expo start -c
```

### Passo 2: Limpeza do Android

```bash
# Navegar para o diretório mobile
cd mobile

# Limpar build do Android
cd android
./gradlew clean
cd ..

# Remover cache do Gradle (opcional)
rm -rf ~/.gradle/caches/
```

### Passo 3: Build de Desenvolvimento

```bash
# Opção 1: Usando Expo (Recomendado)
npx expo run:android

# Opção 2: Diretamente com Gradle
cd android
./gradlew assembleDebug
cd ..
```

### Passo 4: Build de Produção (Release)

```bash
# Usando EAS Build (Recomendado para produção)
npx eas build --platform android

# Ou build local de release
cd android
./gradlew assembleRelease
cd ..
```

## 🔍 Verificação e Debug

### Verificar Logs do Android

```bash
# Logs do React Native
npm run logs:android

# Todos os logs
npm run logs:android-all

# Apenas erros
npm run logs:android-errors

# Limpar logs
npm run logs:clear
```

### Verificar Dispositivos Conectados

```bash
npm run devices
# ou
adb devices
```

### Metro Bundler

```bash
# Iniciar Metro com cache limpo
npm start -- --reset-cache

# Ou usando Expo
npx expo start -c
```

## ⚠️ Problemas Comuns e Soluções

### Problema 1: "Unable to load script"
**Solução:**
```bash
npx expo start -c
adb reverse tcp:8081 tcp:8081
```

### Problema 2: "Execution failed for task ':app:installDebug'"
**Solução:**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

### Problema 3: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
**Solução:**
```bash
# Desinstalar app do dispositivo
adb uninstall com.alugae.mobile
# Reinstalar
npx expo run:android
```

### Problema 4: Crash após splash screen
**Causas comuns:**
- ❌ React 19.x sendo usado (experimental)
- ❌ newArchEnabled=true (nova arquitetura instável)
- ❌ Package names inconsistentes
- ❌ Cache corrompido

**Solução:**
1. Verificar se React 18.2.0 está sendo usado
2. Confirmar newArchEnabled=false
3. Limpar todos os caches (npm, Metro, Gradle)
4. Rebuild completo

### Problema 5: Hermes errors
**Solução:**
```bash
# Verificar se Hermes está habilitado
grep hermesEnabled android/gradle.properties

# Deve retornar: hermesEnabled=true

# Limpar cache do Hermes
rm -rf android/app/build/generated/assets/
```

## 📱 Testando o Build

### 1. Emulador Android

```bash
# Listar emuladores disponíveis
emulator -list-avds

# Iniciar emulador
emulator -avd <nome_do_avd> &

# Executar app
npx expo run:android
```

### 2. Dispositivo Físico

```bash
# Habilitar modo desenvolvedor no dispositivo
# Habilitar depuração USB
# Conectar via USB

# Verificar conexão
adb devices

# Executar app
npx expo run:android
```

## 🎯 Checklist de Build

Antes de fazer o build de produção, verifique:

- [ ] React 18.2.0 instalado (verificar package.json)
- [ ] newArchEnabled=false (verificar android/gradle.properties)
- [ ] Package name unificado: com.alugae.mobile
- [ ] Dependencies atualizadas (npm install executado)
- [ ] Cache limpo (npm, Metro, Gradle)
- [ ] Build de debug funcionando
- [ ] Testes básicos executados
- [ ] Logs verificados (sem erros críticos)
- [ ] Keystore configurado (para release)
- [ ] Versão incrementada (versionCode e versionName)

## 📊 Configurações Atuais

### Package.json
- **React**: 18.2.0
- **React Native**: 0.79.5
- **Expo**: 53.0.22

### Gradle Properties
- **newArchEnabled**: false
- **hermesEnabled**: true
- **Package**: com.alugae.mobile

### App Config
- **Bundle ID**: com.alugae.mobile
- **Hermes**: Habilitado
- **Large Heap**: Habilitado
- **Proguard**: Desabilitado em debug

## 🚨 Avisos Importantes

1. **Não use React 19.x** - É experimental e incompatível com React Native 0.79.5
2. **Não habilite newArchEnabled** - A nova arquitetura ainda é instável
3. **Sempre limpe o cache** após mudanças de configuração
4. **Teste em dispositivo real** antes de fazer deploy
5. **Mantenha backup do keystore** de produção

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs: `npm run logs:android-errors`
2. Consulte este guia
3. Verifique a documentação do Expo: https://docs.expo.dev
4. Verifique o arquivo ANDROID_INITIALIZATION_FIXES.md

## 🔄 Última Atualização

- **Data**: 2025-01-05
- **Versão**: 1.0.10
- **Status**: ✅ Build estável com React 18.2.0
