#!/bin/bash

echo "🌐 Iniciando app mobile no navegador..."
echo ""
echo "⚠️  ATENÇÃO: Funcionalidades nativas (câmera, GPS, biometria) não funcionarão na web"
echo "    Isso é apenas para visualizar a interface do app"
echo ""

cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

echo "🚀 Abrindo app em http://localhost:8081"
echo ""
echo "Pressione Ctrl+C para parar"
echo ""

npm run web
