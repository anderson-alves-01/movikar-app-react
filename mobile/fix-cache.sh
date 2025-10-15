#!/bin/bash

echo "🧹 Limpando cache do app mobile alugae..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está na pasta mobile
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Execute este script da pasta mobile${NC}"
    echo "   cd mobile && bash fix-cache.sh"
    exit 1
fi

echo -e "${YELLOW}[1/7] Parando processos Node...${NC}"
killall node 2>/dev/null || true
killall -9 node 2>/dev/null || true
echo "✅ Processos parados"

echo ""
echo -e "${YELLOW}[2/7] Limpando node_modules...${NC}"
rm -rf node_modules
rm -f package-lock.json
echo "✅ node_modules removido"

echo ""
echo -e "${YELLOW}[3/7] Limpando diretórios nativos...${NC}"
rm -rf android/app/build 2>/dev/null || true
rm -rf ios/build 2>/dev/null || true
rm -rf .expo
echo "✅ Builds nativos limpos"

echo ""
echo -e "${YELLOW}[4/7] Limpando cache do npm...${NC}"
npm cache clean --force
echo "✅ Cache npm limpo"

echo ""
echo -e "${YELLOW}[5/7] Limpando cache do Gradle...${NC}"
if [ -d "android" ]; then
    cd android
    ./gradlew clean 2>/dev/null || true
    ./gradlew cleanBuildCache 2>/dev/null || true
    cd ..
fi
rm -rf $HOME/.gradle/caches 2>/dev/null || true
echo "✅ Cache Gradle limpo"

echo ""
echo -e "${YELLOW}[6/7] Limpando cache do Metro...${NC}"
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
echo "✅ Cache Metro limpo"

echo ""
echo -e "${YELLOW}[7/7] Reinstalando dependências...${NC}"
npm install
echo "✅ Dependências instaladas"

echo ""
echo -e "${GREEN}✅ Limpeza concluída com sucesso!${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "1. npx expo prebuild --clean"
echo "2. npx expo run:android"
echo ""
echo "Ou use EAS Build:"
echo "   eas build --platform android --profile preview"
