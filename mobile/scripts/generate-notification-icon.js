#!/usr/bin/env node

/**
 * Script para gerar ícones de notificação PNG monocromáticos
 * para todas as densidades do Android
 */

const fs = require('fs');
const path = require('path');

// Definir tamanhos para cada densidade
const sizes = {
  'drawable-mdpi': 24,
  'drawable-hdpi': 36,
  'drawable-xhdpi': 48,
  'drawable-xxhdpi': 72,
  'drawable-xxxhdpi': 96
};

// Criar SVG simples de sino de notificação
const createNotificationSVG = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path fill="#FFFFFF" d="M12 22c1.1 0 2-0.9 2-2h-4c0 1.1 0.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-0.83-0.67-1.5-1.5-1.5s-1.5 0.67-1.5 1.5v0.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
</svg>`;
};

console.log('🔔 Gerando ícones de notificação...\n');

// Diretório base
const androidResDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Verificar se o diretório existe
if (!fs.existsSync(androidResDir)) {
  console.error('❌ Erro: Diretório android/app/src/main/res não encontrado!');
  console.error('   Execute este script na pasta mobile do projeto.');
  process.exit(1);
}

// Criar SVG para cada densidade
Object.entries(sizes).forEach(([density, size]) => {
  const dir = path.join(androidResDir, density);
  
  // Criar diretório se não existir
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Diretório criado: ${density}/`);
  }
  
  // Salvar SVG (pode ser convertido para PNG externamente)
  const svgPath = path.join(dir, 'ic_notification.svg');
  fs.writeFileSync(svgPath, createNotificationSVG(size));
  console.log(`✅ SVG criado: ${density}/ic_notification.svg (${size}x${size})`);
});

console.log('\n📝 PRÓXIMOS PASSOS:');
console.log('');
console.log('Os arquivos SVG foram criados, mas o Android precisa de PNG.');
console.log('');
console.log('OPÇÃO 1 - Usar ferramenta online:');
console.log('  1. Acesse: https://cloudconvert.com/svg-to-png');
console.log('  2. Converta cada SVG para PNG');
console.log('  3. Coloque os PNGs nos diretórios correspondentes');
console.log('');
console.log('OPÇÃO 2 - Usar Expo (RECOMENDADO):');
console.log('  Execute: npx expo prebuild --clean');
console.log('  Isso vai gerar automaticamente todos os assets necessários!');
console.log('');
console.log('OPÇÃO 3 - Download de ícones prontos:');
console.log('  1. Acesse: https://romannurik.github.io/AndroidAssetStudio/icons-notification.html');
console.log('  2. Crie um ícone de sino branco');
console.log('  3. Baixe o pacote ZIP');
console.log('  4. Extraia para android/app/src/main/res/');
console.log('');
console.log('Após obter os PNGs, execute:');
console.log('  cd mobile');
console.log('  expo run:android');
console.log('');
