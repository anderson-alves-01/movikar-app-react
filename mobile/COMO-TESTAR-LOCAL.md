# 🚀 Como Testar o App Mobile Localmente

## ⚠️ Importante
**Não é possível testar apps mobile diretamente no Replit** porque não há emuladores Android/iOS disponíveis.

## 📋 Pré-requisitos

### 1. Instale o Node.js
```bash
# Baixe e instale do site oficial
https://nodejs.org/ (versão LTS recomendada)
```

### 2. Instale o Expo CLI
```bash
npm install -g @expo/cli
```

### 3. Escolha como vai testar:

#### **Opção A: No seu celular (MAIS FÁCIL)**
- Instale o **Expo Go** no seu celular:
  - iOS: https://apps.apple.com/app/expo-go/id982107779
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

#### **Opção B: Emulador Android**
- Instale o Android Studio: https://developer.android.com/studio
- Configure um emulador Android

#### **Opção C: Simulador iOS (só Mac)**
- Instale o Xcode da App Store
- Configure um simulador iOS

## 🔧 Passo a Passo

### 1. Clone o projeto (ou baixe do Replit)
```bash
# Se estiver usando git
git clone [URL_DO_SEU_REPO]

# Ou baixe os arquivos do Replit
```

### 2. Entre na pasta mobile
```bash
cd mobile
```

### 3. Instale as dependências
```bash
npm install
```

### 4. Configure a URL da API
Crie um arquivo `.env` na pasta `mobile`:
```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://alugae.mobi/api
```

### 5. Inicie o servidor de desenvolvimento
```bash
npm start
```

### 6. Teste no dispositivo

#### **Para testar no celular (Expo Go):**
1. Abra o app Expo Go no seu celular
2. Escaneie o QR code que aparece no terminal
3. O app vai carregar no seu celular

#### **Para testar no emulador Android:**
```bash
# Pressione 'a' no terminal do Expo
# Ou execute:
npm run android
```

#### **Para testar no simulador iOS (Mac):**
```bash
# Pressione 'i' no terminal do Expo
# Ou execute:
npm run ios
```

## 🌐 Testar na Web (Alternativa)

Se você quer apenas visualizar a interface (sem funcionalidades nativas):

```bash
npm run web
```

Isso abrirá o app no navegador em http://localhost:8081

## 🐛 Problemas Comuns

### Erro: "Metro Bundler failed to start"
```bash
# Limpe o cache
npx expo start --clear
```

### Erro: "Unable to resolve module"
```bash
# Reinstale dependências
rm -rf node_modules
npm install
```

### QR Code não funciona no Expo Go
- Certifique-se que celular e computador estão na mesma rede Wi-Fi
- Tente usar a opção "Tunnel" no Expo:
```bash
npx expo start --tunnel
```

### Android Emulator não inicia
- Verifique se o Android Studio está instalado corretamente
- Execute `adb devices` para ver se o emulador está conectado

## 📱 Build para Teste (APK/IPA)

Se quiser gerar um app instalável:

### Android (APK)
```bash
npm run preview:android
```

### iOS (requer Mac)
```bash
npm run preview:ios
```

Após o build, você receberá um link para baixar o APK/IPA

## 🔗 URLs Importantes

- **Expo Docs**: https://docs.expo.dev/
- **React Native**: https://reactnative.dev/
- **Expo Go**: https://expo.dev/go

## 💡 Dica de Desenvolvimento

Use o **Expo Go** no celular para desenvolvimento rápido. É a forma mais fácil de ver as mudanças em tempo real sem precisar de emuladores.

## 🆘 Precisa de Ajuda?

1. Verifique os logs no terminal
2. Consulte a documentação do Expo
3. Certifique-se que a API está rodando: https://alugae.mobi/api

---

**Próximo passo**: Siga o passo a passo acima para testar o app na sua máquina local!
