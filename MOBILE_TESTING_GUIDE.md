# 🧪 Guia de Testes - alugae Mobile App

## Estratégias de Teste Antes da Publicação

### 1. 📱 Testes em Desenvolvimento

#### Expo Go (Teste Rápido)
```bash
# Na pasta mobile
cd mobile
npm start

# Escanear QR code com Expo Go app no celular
# Disponível na App Store (iOS) e Play Store (Android)
```

**Vantagens:**
- Teste instantâneo sem build
- Hot reload para mudanças rápidas
- Funciona em qualquer dispositivo com Expo Go

**Limitações:**
- Não testa funcionalidades nativas completas
- Performance pode diferir do app final

#### Simuladores Locais
```bash
# iOS Simulator (macOS apenas)
npm run ios

# Android Emulator
npm run android
```

### 2. 🔨 Builds de Preview (Recomendado)

#### Android Preview (APK)
```bash
# Build APK para teste
eas build --platform android --profile preview

# Download e instale no dispositivo Android
# Testa funcionalidades nativas completas
```

#### iOS Preview (TestFlight)
```bash
# Build para TestFlight
eas build --platform ios --profile preview

# Upload automático para TestFlight
eas submit --platform ios --latest
```

### 3. 🧑‍💻 Testes Manuais Essenciais

#### Funcionalidades Core
- [ ] **Login/Registro**: Teste com dados reais
- [ ] **Busca de Veículos**: Filtros e resultados
- [ ] **Detalhes do Veículo**: Navegação e imagens
- [ ] **Processo de Reserva**: Fluxo completo
- [ ] **Perfil**: Edição e configurações
- [ ] **Navegação**: Transições entre telas

#### Testes de UX
- [ ] **Velocidade**: Carregamento de telas
- [ ] **Responsividade**: Diferentes tamanhos de tela
- [ ] **Orientação**: Portrait e landscape
- [ ] **Acessibilidade**: VoiceOver/TalkBack
- [ ] **Estados de Loading**: Indicadores visuais

#### Testes de Integração
- [ ] **API**: Conexão com servidor alugae.mobi
- [ ] **Autenticação**: JWT tokens
- [ ] **Imagens**: Upload e visualização
- [ ] **Push Notifications**: Quando implementadas
- [ ] **Geolocalização**: Permissões e precisão

### 4. 📊 Ferramentas de Teste

#### Expo Development Build
```bash
# Criar development build
eas build --platform android --profile development
eas build --platform ios --profile development

# Instalar e testar com dev tools
```

#### React Native Debugger
```bash
# Instalar debugger
npm install -g react-native-debugger

# Usar com Expo
# Conectar via http://localhost:19000/debugger-ui/
```

#### Reactotron (Debug)
```bash
# Instalar Reactotron
npm install --save-dev reactotron-react-native

# Configurar no app para monitoramento
```

### 5. 🤖 Testes Automatizados

#### Detox E2E Tests
```bash
# Instalar Detox
npm install -g detox-cli
npm install --save-dev detox

# Configurar testes end-to-end
```

#### Jest Unit Tests
```bash
# Executar testes unitários
npm test

# Coverage report
npm run test:coverage
```

### 6. 📱 Dispositivos de Teste Recomendados

#### Android
- **Samsung Galaxy S21** (Android 12+)
- **Pixel 6** (Android 13+)
- **Xiaomi Redmi Note 11** (Android 11+)
- **Tablet Samsung Tab A8** (Teste tablet)

#### iOS
- **iPhone 14 Pro** (iOS 16+)
- **iPhone SE 3rd Gen** (iOS 15+)
- **iPhone 12 Mini** (Tela pequena)
- **iPad Air** (Teste tablet)

### 7. 🔍 Checklist de Teste Completo

#### Instalação e Primeira Execução
- [ ] App instala corretamente
- [ ] Splash screen aparece
- [ ] Primeira tela carrega
- [ ] Permissões solicitadas adequadamente
- [ ] Onboarding funciona (se implementado)

#### Funcionalidades Principais
- [ ] **Cadastro**: Campos validam corretamente
- [ ] **Login**: Autenticação funciona
- [ ] **Busca**: Resultados aparecem
- [ ] **Filtros**: Aplicam corretamente
- [ ] **Detalhes**: Todas as informações carregam
- [ ] **Reserva**: Processo completo funciona

#### Performance e Estabilidade
- [ ] App não trava durante uso normal
- [ ] Transições são suaves
- [ ] Imagens carregam rapidamente
- [ ] Memory leaks não ocorrem
- [ ] Bateria não drena excessivamente

#### Conectividade
- [ ] Funciona com WiFi
- [ ] Funciona com dados móveis
- [ ] Comportamento offline adequado
- [ ] Reconexão automática
- [ ] Estados de erro são claros

#### Casos Edge
- [ ] Tela rotaciona corretamente
- [ ] App funciona com pouco espaço
- [ ] Funciona com conectividade fraca
- [ ] Handle de interrupções (chamadas, notificações)
- [ ] Múltiplas instâncias do app

### 8. 🎯 Testes Beta com Usuários

#### TestFlight (iOS)
```bash
# Submeter para TestFlight
eas submit --platform ios --latest

# Convidar beta testers
# Máximo 100 testadores internos
# Máximo 1000 testadores externos
```

#### Play Console Internal Testing (Android)
```bash
# Upload para Play Console
eas submit --platform android --latest

# Configurar internal testing
# Convidar até 100 testadores
```

#### Feedback Collection
- **Formulários**: Google Forms para feedback
- **Analytics**: Expo Analytics para métricas
- **Crash Reports**: Sentry para erros
- **User Testing**: Sessions gravadas com usuários

### 9. 🏆 Critérios de Aprovação

#### Performance Targets
- **Cold Start**: < 3 segundos
- **Navigation**: < 300ms entre telas
- **API Calls**: < 2 segundos resposta média
- **Image Load**: < 1 segundo por imagem
- **Memory Usage**: < 150MB em uso normal

#### Quality Gates
- ✅ Zero crashes durante teste de 30 minutos
- ✅ Todas as funcionalidades core funcionam
- ✅ Interface responsiva em 3+ dispositivos
- ✅ APIs integram corretamente
- ✅ Autenticação segura funciona

#### User Experience
- ✅ Navegação intuitiva (usuário encontra funcionalidades)
- ✅ Loading states claros
- ✅ Mensagens de erro úteis
- ✅ Design consistente
- ✅ Acessibilidade básica

### 10. 🚨 Problemas Comuns e Soluções

#### Build Failures
```bash
# Limpar cache
expo r -c

# Limpar node modules
rm -rf node_modules && npm install

# Verificar dependências
npm audit fix
```

#### Performance Issues
```bash
# Otimizar imagens
expo optimize

# Analisar bundle
npx react-native-bundle-visualizer

# Profile performance
npx react-devtools
```

#### API Integration Problems
```bash
# Testar endpoints
curl -X GET https://alugae.mobi/api/vehicles

# Verificar CORS
# Verificar SSL certificates
# Testar com diferentes networks
```

### 11. 📋 Cronograma de Teste Sugerido

#### Semana 1: Desenvolvimento
- [ ] Testes diários com Expo Go
- [ ] Correções de bugs básicos
- [ ] Validação de UX/UI

#### Semana 2: Preview Builds
- [ ] Build Android preview
- [ ] Build iOS preview
- [ ] Teste em 3+ dispositivos
- [ ] Correções de funcionalidades

#### Semana 3: Beta Testing
- [ ] TestFlight para iOS
- [ ] Internal testing Android
- [ ] Coleta de feedback
- [ ] Iterações baseadas em feedback

#### Semana 4: Produção
- [ ] Builds de produção
- [ ] Teste final completo
- [ ] Submissão para lojas
- [ ] Monitoramento pós-lançamento

---

## 🎯 Próximo Passo Imediato

1. **Fazer primeiro build preview**:
```bash
cd mobile
eas build --platform android --profile preview
```

2. **Testar no seu dispositivo Android**
3. **Documentar bugs encontrados**
4. **Iterar correções necessárias**

**Status**: ✅ Pronto para começar testes
**Prioridade**: Build preview para validação inicial