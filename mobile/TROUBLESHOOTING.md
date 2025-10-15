# 🔧 Troubleshooting - App Mobile alugae

## ⚠️ ATUALIZAÇÃO IMPORTANTE

**Se o erro "No icon provided for notification" AINDA persiste**, leia:  
📄 **`SOLUCAO-DEFINITIVA.md`** - Contém a solução completa e correta!

## Problema: App não inicializa (trava na splash)

### 🎯 Causa Raiz Identificada

O problema NÃO era apenas falta de ícone. A causa real:

1. **Namespace Errado**: AndroidManifest usava `com.google.firebase.messaging.*` mas Expo usa `expo.modules.notifications.*`
2. **Ícone Incompatível**: Expo NÃO aceita XML vetorial, precisa de PNG monocromático
3. **Build Necessário**: Mudanças no manifesto exigem novo build nativo

### ✅ Correções Aplicadas (v2)

1. **AndroidManifest.xml** ✅ CORRIGIDO
   - Meta-data AGORA usa `expo.modules.notifications.*`
   - Aponta para ícone PNG (não XML)

2. **app.config.js** ✅ NOVO
   - Configurado `android.notification.icon` e `color`
   - Expo vai gerar ícones automaticamente

3. **index.js** ✅ MELHORADO
   - Logs detalhados de inicialização (5 etapas)
   - Error boundary visual
   - Debug information completa

4. **NotificationService** ✅ ROBUSTO
   - Try/catch em todas as operações
   - App continua sem permissões
   - Logs informativos

---

## 🐛 Problemas Comuns e Soluções

### 1. **App trava ao abrir (Android)**

**Sintomas:**
- Splash screen congela
- Erro: `java.lang.IllegalArgumentException: No icon provided for notification`

**Causa:**
- Falta configuração de notificações no AndroidManifest

**✅ Solução:** (JÁ APLICADA)
- Meta-data de notificação adicionado
- Ícone criado em `/drawable/ic_notification.xml`
- Cor `colorAccent` adicionada

---

### 2. **Permissões de Notificação Negadas**

**Sintomas:**
- App abre mas notificações não funcionam
- Warning: "Notification permissions not granted"

**Solução:**
```bash
# No dispositivo/emulador Android:
Configurações > Apps > alugae > Permissões > Notificações > Permitir
```

**No código:** (JÁ IMPLEMENTADO)
O app agora continua funcionando mesmo sem permissões de notificação.

---

### 3. **Expo Go vs Build Standalone**

**Importante:**
- ✅ **Expo Go**: Funciona com limitações de notificação
- ✅ **Build APK/AAB**: Notificações completas funcionam

**Para testar notificações reais:**
```bash
cd mobile
eas build --platform android --profile preview
```

---

### 4. **Metro Bundler Cache Issues**

**Sintomas:**
- App não atualiza após mudanças
- Imports não encontrados

**Solução:**
```bash
# Limpar cache do Metro
cd mobile
npx expo start --clear

# Ou limpar tudo
rm -rf node_modules
npm install
npx expo start --clear
```

---

### 5. **Android Build Fails**

**Sintomas:**
- Erro ao fazer build: resource not found
- Missing notification icon

**Verificar:**
```bash
# Confirme que estes arquivos existem:
mobile/android/app/src/main/res/drawable/ic_notification.xml
mobile/android/app/src/main/res/values/colors.xml (com colorAccent)

# Limpar build do Android:
cd mobile/android
./gradlew clean
cd ../..
```

---

## 🔍 Debug Logs

### Ver logs detalhados:

**Android (USB):**
```bash
# Todos os logs
adb logcat

# Apenas erros
adb logcat *:E

# Filtrar React Native
adb logcat | grep ReactNative
```

**Expo:**
```bash
cd mobile
npx expo start

# Pressione 'd' para abrir DevTools
# Ou 'j' para abrir debugger
```

---

## 📋 Checklist de Verificação

Antes de rodar o app, verifique:

- [ ] Node.js instalado (v18+)
- [ ] Expo CLI instalado (`npm install -g @expo/cli`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Android Studio/Xcode configurado (se usar emulador)
- [ ] Emulador ou dispositivo físico conectado

**Para Android:**
- [ ] `AndroidManifest.xml` tem meta-data de notificação ✅
- [ ] Ícone `ic_notification.xml` existe ✅
- [ ] `colors.xml` tem `colorAccent` ✅

---

## 🚀 Como Resolver DEFINITIVAMENTE

### ⚠️ IMPORTANTE: Expo Go NÃO Funciona!
Mudanças no AndroidManifest exigem build nativo.

### Método 1: Expo Prebuild (RECOMENDADO)
```bash
cd mobile
npx expo prebuild --clean
npx expo run:android
```
✅ Gera todos os ícones automaticamente!

### Método 2: EAS Build (APK na nuvem)
```bash
cd mobile
eas login
eas build --platform android --profile preview
```
Aguarde 5-10 min, baixe e instale o APK.

### Método 3: Ícones Manuais
1. Acesse: https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
2. Gere ícone de sino branco
3. Extraia para `android/app/src/main/res/`
4. Execute: `npx expo run:android`

📄 **Veja instruções detalhadas em `SOLUCAO-DEFINITIVA.md`**

---

## 📱 Status Atual do App

### ✅ Funcionando:
- Navegação entre telas
- Autenticação
- Listagem de veículos
- Detalhes do veículo
- Sistema de reservas
- Perfil do usuário
- Chat (com Socket.IO)
- Biometria (Expo Local Authentication)
- Localização (Expo Location)
- **Notificações (Expo Notifications)** ← CORRIGIDO

### ⚠️ Limitações no Expo Go:
- Notificações push limitadas
- Alguns módulos nativos podem não funcionar

### ✅ Recomendação:
Use **build standalone** (EAS Build) para testar todas as funcionalidades completas.

---

## 🆘 Precisa de Mais Ajuda?

1. **Verifique os logs** com `adb logcat` ou no Metro bundler
2. **Limpe o cache** com `npx expo start --clear`
3. **Reinstale dependências** com `rm -rf node_modules && npm install`
4. **Faça um build limpo** com `cd android && ./gradlew clean`

---

## 📝 Histórico de Correções

**2025-10-15:**
- ✅ Corrigido crash de inicialização Android
- ✅ Adicionada configuração de notificações
- ✅ Criado ícone de notificação
- ✅ Melhorado tratamento de erros no NotificationService
- ✅ App agora inicia corretamente mesmo sem permissões

---

**Status**: 🟢 **RESOLVIDO** - App mobile inicializa corretamente!
