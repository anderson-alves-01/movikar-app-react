# 📱 Guia Completo de Build - alugae Mobile App

## 🎯 Visão Geral

Este guia fornece instruções passo-a-passo para compilar, testar e publicar o aplicativo móvel alugae nas lojas oficiais (App Store e Play Store).

## ✅ Pré-requisitos Completados

- [x] **Estrutura do App**: React Native com Expo SDK 50
- [x] **Navegação**: React Navigation configurada
- [x] **Telas Principais**: Home, Busca, Reservas, Perfil, Login, Detalhes
- [x] **Configurações**: EAS Build, TypeScript, Metro
- [x] **Assets Base**: Estrutura preparada para ícones e screenshots

## 🛠️ Passos para Build

### 1. Configuração Inicial

```bash
# Instalar Expo CLI e EAS CLI globalmente
npm install -g @expo/cli @expo/eas-cli

# Navegar para pasta mobile
cd mobile

# Instalar dependências
npm install

# Login no Expo/EAS
eas login
```

### 2. Configurar Project ID

Edite `mobile/app.json` e `mobile/eas.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "SEU-PROJECT-ID-AQUI"
      }
    }
  }
}
```

### 3. Criar Ícones e Assets

**Ícones Necessários:**
- `mobile/assets/icon.png` (1024x1024px)
- `mobile/assets/adaptive-icon.png` (1024x1024px)
- `mobile/assets/splash.png` (1242x2436px)
- `mobile/assets/favicon.png` (32x32px)

**Use o logo oficial**: Copie `attached_assets/ALUGAE - ICONE_1755178300499.png` e redimensione.

### 4. Builds de Desenvolvimento

```bash
# Preview build Android (APK para teste)
eas build --platform android --profile preview

# Preview build iOS (TestFlight)
eas build --platform ios --profile preview

# Build ambas as plataformas
eas build --platform all --profile preview
```

### 5. Builds de Produção

```bash
# Android para Play Store (AAB)
eas build --platform android --profile production

# iOS para App Store
eas build --platform ios --profile production
```

### 6. Configurar Store Credentials

**Para Android:**
```bash
# Gerar keystore (primeira vez)
eas credentials

# Ou usar keystore existente
# Adicione google-service-account.json na raiz
```

**Para iOS:**
```bash
# Configurar Apple Developer certificates
eas credentials

# Adicionar AuthKey_XXXXXXXXX.p8
# Configurar App Store Connect API Key
```

## 📱 Testando o App

### Expo Go (Desenvolvimento)
```bash
# Iniciar servidor
npm start

# Escanear QR code com Expo Go app
```

### Builds Locais
```bash
# Instalar build Android (.apk)
adb install app-release.apk

# iOS via Xcode ou TestFlight
```

### TestFlight (iOS Beta)
```bash
# Submeter para TestFlight
eas submit --platform ios --latest
```

### Internal Testing (Android)
```bash
# Upload para Play Console
eas submit --platform android --latest
```

## 🚀 Publicação nas Lojas

### App Store (iOS)

1. **App Store Connect**:
   - Criar app no App Store Connect
   - Configurar App Store information
   - Adicionar screenshots (6.7" e 5.5")
   - Definir pricing e availability

2. **Submissão**:
   ```bash
   # Build de produção
   eas build --platform ios --profile production
   
   # Submeter para App Store
   eas submit --platform ios
   ```

3. **Review Process**:
   - Apple review: 1-7 dias
   - Responder a feedback se necessário
   - Release após aprovação

### Play Store (Android)

1. **Google Play Console**:
   - Criar app no Play Console
   - Configurar store listing
   - Adicionar screenshots
   - Definir content rating

2. **Submissão**:
   ```bash
   # Build de produção
   eas build --platform android --profile production
   
   # Submeter para Play Store
   eas submit --platform android
   ```

3. **Review Process**:
   - Google review: algumas horas a 3 dias
   - Release após aprovação

## 🔧 Configurações Importantes

### API Endpoints
Configurar URLs da API em `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://alugae.mobi/api",
      "stripePublishableKey": "pk_live_..."
    }
  }
}
```

### Permissions

**iOS (`mobile/app.json`)**:
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "Este app precisa acessar sua localização para mostrar veículos próximos.",
      "NSCameraUsageDescription": "Este app precisa acessar a câmera para capturar fotos dos veículos."
    }
  }
}
```

**Android (`mobile/app.json`)**:
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "CAMERA"
    ]
  }
}
```

## 📊 Monitoramento e Analytics

### Expo Analytics
```bash
# Instalar analytics
npx expo install expo-analytics-amplitude

# Configurar no app
```

### Crash Reporting
```bash
# Instalar Sentry
npx expo install @sentry/react-native

# Configurar no app
```

### Performance Monitoring
- React Native Performance
- Expo Performance monitoring
- Custom metrics via analytics

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: EAS Build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm install
      - run: eas build --platform all --non-interactive
```

## 📋 Checklist de Publicação

### Antes da Submissão
- [ ] Todos os assets criados (ícones, splash, screenshots)
- [ ] Configurações de produção aplicadas
- [ ] Testes em dispositivos reais concluídos
- [ ] Política de privacidade e termos de uso online
- [ ] Store credentials configurados
- [ ] Build de produção testado

### Informações da Loja
- [ ] Nome do app: "alugae - Aluguel de Carros"
- [ ] Descrição completa escrita
- [ ] Palavras-chave otimizadas
- [ ] Screenshots de qualidade
- [ ] Classificação etária definida
- [ ] Preços configurados

### Pós-Lançamento
- [ ] Monitorar reviews e ratings
- [ ] Responder comentários dos usuários
- [ ] Acompanhar crashes e bugs
- [ ] Planejar atualizações futuras

## 🆘 Troubleshooting

### Erros Comuns

**Build falha - Assets não encontrados**:
```bash
# Verificar se assets existem
ls mobile/assets/

# Criar assets em falta
```

**Certificados iOS expirados**:
```bash
# Renovar certificados
eas credentials --platform ios
```

**Keystore Android perdido**:
```bash
# Gerar novo keystore (requer novo package name)
eas credentials --platform android
```

### Logs e Debugging
```bash
# Ver logs do build
eas build:view [BUILD-ID]

# Logs locais
npx expo start --tunnel
```

## 📞 Suporte

- **Expo Documentation**: https://docs.expo.dev/
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **React Navigation**: https://reactnavigation.org/docs/getting-started
- **Apple Developer**: https://developer.apple.com/support/
- **Google Play**: https://support.google.com/googleplay/android-developer/

---

## 🎯 Próximos Passos

1. **Criar assets necessários** (ícones, screenshots)
2. **Configurar EAS Project ID**
3. **Fazer primeiro build de preview**
4. **Testar em dispositivos reais**
5. **Submeter para lojas**

**Status**: ✅ Estrutura completa - Pronta para build
**Estimativa**: 1-2 semanas para publicação completa