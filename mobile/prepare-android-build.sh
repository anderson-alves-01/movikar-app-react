#!/bin/bash

# 🚀 Script de Preparação para Build Android
# Este script prepara o ambiente para um build limpo do Android

set -e  # Exit on error

echo "🔧 Preparando ambiente para build Android..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    print_error "Este script deve ser executado no diretório 'mobile'"
    exit 1
fi

echo "📋 Checklist de Verificação:"
echo ""

# 1. Verificar versão do React
echo "1. Verificando versão do React..."
REACT_VERSION=$(node -p "require('./package.json').dependencies.react")
if [[ "$REACT_VERSION" == "18.2.0" ]]; then
    print_success "React 18.2.0 (estável) ✓"
elif [[ "$REACT_VERSION" == "19.0.0" ]]; then
    print_error "React 19.0.0 detectado! Execute: npm install react@18.2.0 react-dom@18.2.0"
    exit 1
else
    print_warning "React $REACT_VERSION detectado. Versão recomendada: 18.2.0"
fi
echo ""

# 2. Verificar newArchEnabled
echo "2. Verificando configuração newArchEnabled..."
if grep -q "newArchEnabled=false" android/gradle.properties; then
    print_success "newArchEnabled=false (arquitetura estável) ✓"
else
    print_error "newArchEnabled não está definido como false!"
    print_warning "Edite android/gradle.properties e defina: newArchEnabled=false"
    exit 1
fi
echo ""

# 3. Verificar package name
echo "3. Verificando consistência do package name..."
PACKAGE_GRADLE=$(grep "applicationId" android/app/build.gradle | awk -F"'" '{print $2}')
if [[ "$PACKAGE_GRADLE" == "com.alugae.mobile" ]]; then
    print_success "Package name unificado: com.alugae.mobile ✓"
else
    print_warning "Package name em build.gradle: $PACKAGE_GRADLE"
fi
echo ""

# 4. Limpar cache do npm
echo "4. Limpando cache do npm..."
npm cache clean --force > /dev/null 2>&1
print_success "Cache do npm limpo ✓"
echo ""

# 5. Verificar/Instalar dependências
echo "5. Verificando dependências..."
if [ -d "node_modules" ]; then
    print_warning "node_modules existe. Deseja reinstalar? (s/N)"
    read -r response
    if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
        echo "   Removendo node_modules..."
        rm -rf node_modules package-lock.json
        echo "   Instalando dependências..."
        npm install
        print_success "Dependências reinstaladas ✓"
    else
        print_success "Usando node_modules existente ✓"
    fi
else
    echo "   Instalando dependências..."
    npm install
    print_success "Dependências instaladas ✓"
fi
echo ""

# 6. Limpar cache do Metro
echo "6. Deseja limpar cache do Metro Bundler? (s/N)"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    if [ -d ".expo" ]; then
        rm -rf .expo
        print_success "Cache do Expo/.expo removido ✓"
    fi
    print_success "Use 'npx expo start -c' para iniciar com cache limpo"
fi
echo ""

# 7. Limpar build do Android (se existir)
echo "7. Verificando builds anteriores do Android..."
if [ -d "android/app/build" ]; then
    print_warning "Diretório android/app/build existe"
    echo "   Deseja limpar? (s/N)"
    read -r response
    if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
        rm -rf android/app/build
        rm -rf android/build
        print_success "Builds anteriores removidos ✓"
    fi
else
    print_success "Nenhum build anterior encontrado ✓"
fi
echo ""

# 8. Verificar se ADB está disponível
echo "8. Verificando Android Debug Bridge (adb)..."
if command -v adb &> /dev/null; then
    print_success "ADB disponível ✓"
    echo "   Dispositivos conectados:"
    adb devices
else
    print_warning "ADB não encontrado. Certifique-se de ter o Android SDK instalado"
fi
echo ""

# 9. Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo da Configuração:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "React: $REACT_VERSION"
echo "Package: com.alugae.mobile"
echo "newArchEnabled: false"
echo "Hermes: habilitado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

print_success "✨ Ambiente preparado para build!"
echo ""
echo "📱 Próximos passos:"
echo "   1. Build de desenvolvimento: npx expo run:android"
echo "   2. Build de produção: npx eas build --platform android"
echo "   3. Verificar logs: npm run logs:android"
echo ""
echo "📖 Consulte ANDROID_BUILD_GUIDE.md para mais informações"
echo ""
