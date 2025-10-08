#!/usr/bin/env node

/**
 * 🔍 Script de Validação de Configuração Android
 * Verifica se todas as configurações críticas estão corretas
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

// Check if file exists
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, filePath));
}

// Read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  } catch (err) {
    return null;
  }
}

// Parse JSON file
function readJSON(filePath) {
  const content = readFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (err) {
    error(`Erro ao parsear ${filePath}: ${err.message}`);
    return null;
  }
}

let hasErrors = false;
let hasWarnings = false;

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
log('🔍 Validação de Configuração Android', colors.cyan);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Verificar package.json
info('1. Verificando package.json...');
const packageJson = readJSON('package.json');
if (!packageJson) {
  error('   package.json não encontrado!');
  hasErrors = true;
} else {
  // Verificar versão do React
  const reactVersion = packageJson.dependencies?.react;
  if (reactVersion === '18.2.0') {
    success('   React 18.2.0 (estável)');
  } else if (reactVersion === '19.0.0') {
    error('   React 19.0.0 detectado! Use React 18.2.0 para estabilidade');
    hasErrors = true;
  } else {
    warning(`   React ${reactVersion} detectado. Recomendado: 18.2.0`);
    hasWarnings = true;
  }

  // Verificar React Native
  const rnVersion = packageJson.dependencies?.['react-native'];
  if (rnVersion) {
    info(`   React Native: ${rnVersion}`);
  }

  // Verificar Expo
  const expoVersion = packageJson.dependencies?.expo;
  if (expoVersion) {
    info(`   Expo: ${expoVersion}`);
  }
}
console.log('');

// 2. Verificar gradle.properties
info('2. Verificando android/gradle.properties...');
const gradleProps = readFile('android/gradle.properties');
if (!gradleProps) {
  error('   android/gradle.properties não encontrado!');
  hasErrors = true;
} else {
  // Verificar newArchEnabled
  if (gradleProps.includes('newArchEnabled=false')) {
    success('   newArchEnabled=false (arquitetura estável)');
  } else if (gradleProps.includes('newArchEnabled=true')) {
    error('   newArchEnabled=true detectado! Defina como false');
    hasErrors = true;
  } else {
    warning('   newArchEnabled não definido');
    hasWarnings = true;
  }

  // Verificar hermesEnabled
  if (gradleProps.includes('hermesEnabled=true')) {
    success('   hermesEnabled=true (Hermes habilitado)');
  } else {
    warning('   hermesEnabled não está true');
    hasWarnings = true;
  }
}
console.log('');

// 3. Verificar app/build.gradle
info('3. Verificando android/app/build.gradle...');
const buildGradle = readFile('android/app/build.gradle');
if (!buildGradle) {
  error('   android/app/build.gradle não encontrado!');
  hasErrors = true;
} else {
  // Verificar namespace
  const namespaceMatch = buildGradle.match(/namespace\s+['"]([^'"]+)['"]/);
  const appIdMatch = buildGradle.match(/applicationId\s+['"]([^'"]+)['"]/);
  
  if (namespaceMatch && namespaceMatch[1] === 'com.alugae.mobile') {
    success('   namespace: com.alugae.mobile');
  } else {
    error(`   namespace incorreto: ${namespaceMatch ? namespaceMatch[1] : 'não encontrado'}`);
    hasErrors = true;
  }

  if (appIdMatch && appIdMatch[1] === 'com.alugae.mobile') {
    success('   applicationId: com.alugae.mobile');
  } else {
    error(`   applicationId incorreto: ${appIdMatch ? appIdMatch[1] : 'não encontrado'}`);
    hasErrors = true;
  }
}
console.log('');

// 4. Verificar MainActivity.kt
info('4. Verificando MainActivity.kt...');
const mainActivity = readFile('android/app/src/main/java/com/alugae/mobile/MainActivity.kt');
if (!mainActivity) {
  error('   MainActivity.kt não encontrado!');
  hasErrors = true;
} else {
  // Verificar package
  if (mainActivity.includes('package com.alugae.mobile')) {
    success('   package: com.alugae.mobile');
  } else {
    error('   package incorreto em MainActivity.kt');
    hasErrors = true;
  }

  // Verificar super.onCreate
  if (mainActivity.includes('super.onCreate(savedInstanceState)')) {
    success('   super.onCreate(savedInstanceState) correto');
  } else if (mainActivity.includes('super.onCreate(null)')) {
    error('   super.onCreate(null) detectado! Use savedInstanceState');
    hasErrors = true;
  } else {
    warning('   Não foi possível verificar super.onCreate');
    hasWarnings = true;
  }
}
console.log('');

// 5. Verificar app.json
info('5. Verificando app.json...');
const appJson = readJSON('../app.json');
if (!appJson) {
  warning('   app.json não encontrado (opcional)');
  hasWarnings = true;
} else {
  const androidPackage = appJson.android?.package || appJson.expo?.android?.package;
  if (androidPackage === 'com.alugae.mobile') {
    success('   android.package: com.alugae.mobile');
  } else if (androidPackage) {
    error(`   android.package incorreto: ${androidPackage}`);
    hasErrors = true;
  }
}
console.log('');

// 6. Verificar app.config.js
info('6. Verificando app.config.js...');
if (fileExists('app.config.js')) {
  success('   app.config.js encontrado');
  const appConfig = readFile('app.config.js');
  
  if (appConfig.includes('com.alugae.mobile')) {
    success('   Package name correto em app.config.js');
  } else {
    warning('   Verifique package name em app.config.js');
    hasWarnings = true;
  }

  if (appConfig.includes('enableHermes: true')) {
    success('   Hermes habilitado em app.config.js');
  }

  if (appConfig.includes('largeHeap: true')) {
    success('   Large heap habilitado');
  }
} else {
  warning('   app.config.js não encontrado (opcional)');
  hasWarnings = true;
}
console.log('');

// 7. Verificar imports críticos
info('7. Verificando imports críticos em HomeScreen.tsx...');
const homeScreen = readFile('screens/HomeScreen.tsx');
if (!homeScreen) {
  warning('   screens/HomeScreen.tsx não encontrado');
  hasWarnings = true;
} else {
  if (homeScreen.includes('import React, { useState, useEffect }')) {
    success('   useState e useEffect importados corretamente');
  } else if (homeScreen.includes('import React') && homeScreen.includes('useState') && homeScreen.includes('useEffect')) {
    success('   React hooks importados');
  } else {
    error('   useState e/ou useEffect não importados!');
    hasErrors = true;
  }
}
console.log('');

// 8. Verificar loggerService
info('8. Verificando services/loggerService.ts...');
const loggerService = readFile('services/loggerService.ts');
if (!loggerService) {
  warning('   services/loggerService.ts não encontrado');
  hasWarnings = true;
} else {
  if (loggerService.includes('declare const ErrorUtils')) {
    success('   ErrorUtils declarado corretamente');
  } else if (loggerService.includes('ErrorUtils')) {
    warning('   ErrorUtils presente mas sem declaração');
    hasWarnings = true;
  }
}
console.log('');

// 9. Verificar index.js
info('9. Verificando index.js...');
const indexJs = readFile('index.js');
if (!indexJs) {
  error('   index.js não encontrado!');
  hasErrors = true;
} else {
  if (indexJs.includes('try') && indexJs.includes('catch')) {
    success('   Error handling implementado em index.js');
  } else {
    warning('   Error handling não encontrado em index.js');
    hasWarnings = true;
  }
}
console.log('');

// 10. Verificar metro.config.js
info('10. Verificando metro.config.js...');
if (fileExists('metro.config.js')) {
  success('   metro.config.js encontrado');
  const metroConfig = readFile('metro.config.js');
  
  if (metroConfig.includes('hermesParser')) {
    success('   Hermes parser configurado');
  }

  if (metroConfig.includes('asyncRequireModulePath')) {
    success('   TurboModule fixes aplicados');
  }
} else {
  warning('   metro.config.js não encontrado');
  hasWarnings = true;
}
console.log('');

// Resumo final
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (!hasErrors && !hasWarnings) {
  success('✨ Todas as verificações passaram!');
  console.log('');
  log('📱 Você pode prosseguir com o build:', colors.cyan);
  console.log('   npx expo run:android');
} else if (hasErrors) {
  error('❌ Erros críticos encontrados!');
  console.log('');
  log('🔧 Corrija os erros acima antes de fazer o build.', colors.red);
  console.log('📖 Consulte ANDROID_BUILD_GUIDE.md para mais informações.');
  process.exit(1);
} else {
  warning('⚠️  Avisos encontrados, mas build pode funcionar');
  console.log('');
  log('📱 Você pode tentar o build, mas verifique os avisos:', colors.yellow);
  console.log('   npx expo run:android');
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
