# 🔧 Troubleshooting - App Mobile alugae

## Problema Resolvido: App não inicializa (trava na splash)

### ✅ Solução Implementada

O problema foi causado pela falta de configurações obrigatórias do sistema de notificações Expo.

#### **Correções Aplicadas:**

1. **AndroidManifest.xml** ✅
   - Adicionado meta-data para ícone de notificação
   - Adicionado meta-data para cor de notificação

2. **Ícone de Notificação** ✅
   - Criado `ic_notification.xml` (ícone de sino branco)
   - Localização: `android/app/src/main/res/drawable/`

3. **Colors.xml** ✅
   - Adicionada cor `colorAccent` (#20B2AA)

4. **NotificationService** ✅
   - Melhorado tratamento de erros
   - Logs detalhados de inicialização
   - Não trava mais o app se permissões falharem

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

## 🚀 Como Rodar Após Correções

### 1. **Instalar dependências**
```bash
cd mobile
npm install
```

### 2. **Iniciar o servidor**
```bash
npm start
```

### 3. **Testar no dispositivo**

**Opção A - Expo Go (mais fácil):**
- Escanear QR code com app Expo Go

**Opção B - Emulador Android:**
```bash
npm run android
```

**Opção C - Build standalone:**
```bash
eas build --platform android --profile preview
```

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
