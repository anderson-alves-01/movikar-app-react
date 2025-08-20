# Assets para o App Mobile alugae

Esta pasta contém todos os assets necessários para o aplicativo móvel alugae.

## Ícones Necessários

Para publicar o app nas lojas, você precisará criar estes ícones com o logo alugae:

### iOS (App Store)
- `icon.png` - 1024x1024px (ícone principal)
- `adaptive-icon.png` - 1024x1024px (Android)

### Android (Play Store)
- Mesmo arquivo `icon.png` é usado para ambas as plataformas

### Splash Screen
- `splash.png` - 1242x2436px (tela de abertura)

## Como Criar os Ícones

1. Use o logo oficial alugae (`ALUGAE - ICONE_1755178300499.png`)
2. Redimensione para os tamanhos necessários
3. Mantenha a cor de fundo `#20B2AA` (verde-azulado da marca)
4. Garanta que o logo seja visível em fundos claros e escuros

## Ferramentas Recomendadas

- **Expo Icon Generator**: Gera automaticamente todos os tamanhos
- **Figma**: Para design personalizado
- **Adobe Illustrator**: Para logos vetoriais

## Estrutura de Pastas

```
assets/
├── icon.png              # Ícone principal (1024x1024)
├── adaptive-icon.png      # Ícone Android adaptativo
├── splash.png            # Tela de abertura
├── favicon.png           # Ícone web (32x32)
└── screenshots/          # Screenshots para as lojas
    ├── iphone/
    └── android/
```

## Screenshots para as Lojas

Você precisará capturar screenshots do app em diferentes dispositivos:

### iPhone
- 6.7" (iPhone 14 Pro Max): 1290x2796
- 6.5" (iPhone 14 Plus): 1284x2778
- 5.5" (iPhone 8 Plus): 1242x2208

### Android
- Tablets: 1920x1200
- Phones: 1080x1920

## Status Atual

⚠️ **Assets em falta**: Esta pasta está vazia e precisa ser populada com:
- Ícones do app
- Splash screen
- Screenshots do aplicativo
- Favicon

Para começar, copie o logo alugae da pasta `attached_assets` e crie os ícones nos tamanhos necessários.