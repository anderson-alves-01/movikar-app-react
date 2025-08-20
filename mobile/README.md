# alugae Mobile App

Aplicativo móvel React Native para a plataforma alugae de aluguel de carros.

## 🚀 Versão: 1.0.0

### Plataformas Suportadas
- **iOS**: 14.0+
- **Android**: API Level 21+ (Android 5.0)

## 📱 Funcionalidades

### Core Features
- ✅ **Busca de Veículos**: Filtros avançados por localização, categoria, preço
- ✅ **Navegação Tab**: Home, Busca, Reservas, Perfil
- ✅ **Detalhes do Veículo**: Galeria, especificações, recursos, contato com proprietário
- ✅ **Sistema de Reservas**: Gestão completa de bookings (ativas e históricas)
- ✅ **Perfil do Usuário**: Configurações, documentos, assinatura, histórico
- ✅ **Autenticação**: Login/registro com validação
- ✅ **Design Responsivo**: Interface otimizada para mobile

### Recursos Técnicos
- **React Native 0.73.6** com Expo SDK 50
- **TypeScript** para type safety
- **React Navigation 6** para navegação
- **Expo Vector Icons** para ícones
- **Safe Area Context** para iPhone X+
- **Metro bundler** configurado

## 🛠️ Configuração para Desenvolvimento

### Pré-requisitos
```bash
# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Instalar EAS CLI para builds
npm install -g eas-cli
```

### Instalação
```bash
# Navegar para pasta mobile
cd mobile

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm start
```

### Executar no Dispositivo
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Expo Go (dispositivo físico)
npm start
# Scanear QR code com Expo Go
```

## 🏗️ Build e Deploy

### Configuração Inicial
```bash
# Login no EAS
eas login

# Configurar projeto
eas build:configure
```

### Builds de Desenvolvimento
```bash
# Preview Android (APK)
npm run preview:android

# Preview iOS
npm run preview:ios

# Build todas as plataformas
npm run build:all
```

### Builds de Produção
```bash
# Android (AAB para Play Store)
npm run build:android

# iOS (para App Store)
npm run build:ios
```

### Submissão para Lojas
```bash
# Google Play Store
npm run submit:android

# Apple App Store
npm run submit:ios
```

## 📁 Estrutura do Projeto

```
mobile/
├── App.tsx                 # Componente raiz da aplicação
├── screens/                # Telas do aplicativo
│   ├── HomeScreen.tsx      # Tela inicial com veículos destacados
│   ├── SearchScreen.tsx    # Busca e filtros avançados
│   ├── BookingsScreen.tsx  # Gestão de reservas
│   ├── ProfileScreen.tsx   # Perfil e configurações
│   ├── VehicleDetailScreen.tsx # Detalhes do veículo
│   └── LoginScreen.tsx     # Autenticação
├── assets/                 # Ícones e imagens
├── package.json           # Dependências do projeto
├── app.json               # Configuração Expo
├── eas.json              # Configuração EAS Build
├── babel.config.js       # Configuração Babel
├── tsconfig.json         # Configuração TypeScript
└── metro.config.js       # Configuração Metro bundler
```

## 🔧 Configurações Importantes

### Bundle Identifiers
- **iOS**: `com.alugae.mobile`
- **Android**: `com.alugae.mobile`

### Permissões
- **iOS**: Localização, Câmera
- **Android**: Localização, Câmera, Storage

### Variáveis de Ambiente
```bash
# API Base URL
EXPO_PUBLIC_API_URL=https://alugae.mobi/api

# Stripe Public Key
EXPO_PUBLIC_STRIPE_KEY=pk_live_...
```

## 📊 Status de Desenvolvimento

### ✅ Implementado
- [x] Navegação e estrutura base
- [x] Telas principais (Home, Search, Bookings, Profile)
- [x] Sistema de autenticação
- [x] Interface responsiva
- [x] Configuração de build

### 🔄 Em Desenvolvimento
- [ ] Integração com API real
- [ ] Push notifications
- [ ] Cache offline
- [ ] Geolocalização
- [ ] Upload de fotos
- [ ] Sistema de pagamento

### 📋 TODO
- [ ] Testes unitários
- [ ] Screenshots para lojas
- [ ] Documentação de API
- [ ] Configurar CI/CD
- [ ] Analytics

## 🚨 Notas Importantes

### Assets Necessários
Para publicar nas lojas, você precisa criar:
- Ícones do app (1024x1024)
- Splash screen (1242x2436)
- Screenshots para iPhone e Android
- Descrições para App Store e Play Store

### API Integration
O app está configurado para usar a API alugae.mobi:
- Base URL: `https://alugae.mobi/api`
- Endpoints: `/auth/login`, `/vehicles`, `/bookings`, etc.
- Autenticação: JWT tokens

### Deployment
1. **Configurar EAS Project ID** em `app.json`
2. **Adicionar certificates** iOS/Android
3. **Configurar store credentials** em `eas.json`
4. **Upload assets** necessários
5. **Build e submit** para as lojas

## 📞 Suporte

Para dúvidas sobre o app móvel:
- Documentação Expo: https://docs.expo.dev/
- React Native: https://reactnative.dev/
- EAS Build: https://docs.expo.dev/build/introduction/

---

**Status**: ✅ Pronto para build e teste
**Próximo passo**: Configurar EAS Project ID e fazer primeiro build