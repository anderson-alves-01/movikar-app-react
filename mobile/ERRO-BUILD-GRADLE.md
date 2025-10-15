# 🔴 Erro: BUILD FAILED - Gradle

## ❌ Erro
```
BUILD FAILED in 6s
Error: gradlew.bat app:assembleDebug exited with non-zero code: 1
```

## 🎯 Causas Comuns

### 1. **Variáveis de Ambiente Não Configuradas** (Mais Comum)
- `ANDROID_HOME` não definido
- `JAVA_HOME` não definido
- Path do Android SDK não configurado

### 2. **Java JDK Não Instalado/Versão Errada**
- Precisa Java JDK 17 ou 11
- Java Runtime (JRE) não funciona

### 3. **Cache Gradle Corrompido**
- Build anterior falhou e corrompeu cache
- Dependências não baixadas completamente

### 4. **Permissões no Windows**
- Pasta do projeto em área protegida
- Antivírus bloqueando Gradle

---

## ✅ SOLUÇÃO PASSO A PASSO

### **Passo 1: Verificar Java JDK** ⭐

```bash
java -version
```

**Esperado**: `openjdk version "17.x.x"` ou `"11.x.x"`

Se não aparecer ou mostrar JRE:

**Instalar Java JDK 17**:
1. Acesse: https://adoptium.net/
2. Baixe JDK 17 para Windows
3. Instale
4. Configure `JAVA_HOME`:

```bash
# PowerShell (Admin)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot', 'Machine')
```

---

### **Passo 2: Verificar Android SDK**

```bash
echo %ANDROID_HOME%
```

**Esperado**: `C:\Users\SeuUsuario\AppData\Local\Android\Sdk`

Se vazio ou errado:

**Configurar ANDROID_HOME**:

```bash
# PowerShell (Admin)
# Ajuste o caminho para onde seu Android SDK está instalado
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdk, 'Machine')
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $androidSdk, 'Machine')

# Adicionar ao Path
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
$newPath = "$currentPath;$androidSdk\platform-tools;$androidSdk\tools"
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'Machine')
```

**Reinicie o PowerShell/CMD** após configurar!

---

### **Passo 3: Limpar Cache Gradle**

```bash
cd C:\projects\movikar-app-react\mobile

# Limpar cache do projeto
rmdir /s /q android\app\build
rmdir /s /q android\build
rmdir /s /q .gradle

# Limpar cache global
rmdir /s /q %USERPROFILE%\.gradle\caches
```

---

### **Passo 4: Rebuildar com Logs Detalhados**

```bash
cd C:\projects\movikar-app-react\mobile

# Ver erro específico
npx expo run:android --verbose
```

Isso vai mostrar o **erro real** que está causando a falha.

---

## 🔧 Soluções Específicas por Erro

### Erro: "SDK location not found"
```
SDK location not found. Define a valid SDK location with an ANDROID_HOME environment variable
```

**Solução**:
```bash
# PowerShell (Admin)
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $androidSdk, 'Machine')

# Reiniciar terminal e testar
echo $env:ANDROID_HOME
```

---

### Erro: "JAVA_HOME is not set"
```
ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH
```

**Solução**:
```bash
# PowerShell (Admin)
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot', 'Machine')

# Reiniciar terminal e testar
echo $env:JAVA_HOME
java -version
```

---

### Erro: "Could not resolve all files for configuration"
```
Could not resolve all files for configuration ':app:debugCompileClasspath'
```

**Solução**:
```bash
cd mobile\android
.\gradlew clean --refresh-dependencies
cd ..\..
npx expo run:android
```

---

### Erro: "Execution failed for task ':app:mergeDebugResources'"
```
Execution failed for task ':app:mergeDebugResources'
```

**Causa**: Ícones ou recursos duplicados/inválidos

**Solução**:
```bash
cd mobile

# Regenerar configuração nativa
npx expo prebuild --clean

# Rebuildar
npx expo run:android
```

---

### Erro: "Daemon will be stopped at the end of the build"
```
This build was configured to prefer settings repositories over project repositories but repository 'Google' was added by build file 'build.gradle'
```

**Solução**:
Editar `mobile\android\settings.gradle`:

```groovy
// Adicionar no topo do arquivo
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
```

---

## 🚀 Solução Rápida (Windows)

Se nada funcionar, use este script:

**Criar arquivo**: `mobile\fix-build-windows.bat`

```batch
@echo off
echo Limpando projeto Android...

cd /d "%~dp0"

echo [1/5] Parando processos...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM node.exe 2>nul

echo [2/5] Limpando build...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist .gradle rmdir /s /q .gradle

echo [3/5] Limpando cache Gradle...
if exist "%USERPROFILE%\.gradle\caches" rmdir /s /q "%USERPROFILE%\.gradle\caches"

echo [4/5] Limpando node_modules...
if exist node_modules rmdir /s /q node_modules
npm install

echo [5/5] Regenerando configuração...
call npx expo prebuild --clean

echo.
echo ✅ Limpeza concluída!
echo.
echo Execute agora:
echo   npx expo run:android --verbose
pause
```

**Executar**:
```bash
cd C:\projects\movikar-app-react\mobile
fix-build-windows.bat
```

---

## 📋 Checklist Completo

Marque cada item:

### Ambiente
- [ ] Java JDK 17 ou 11 instalado: `java -version`
- [ ] JAVA_HOME configurado: `echo %JAVA_HOME%`
- [ ] Android Studio instalado
- [ ] Android SDK instalado
- [ ] ANDROID_HOME configurado: `echo %ANDROID_HOME%`
- [ ] Platform-tools no Path: `adb version`

### Projeto
- [ ] Cache Gradle limpo
- [ ] node_modules reinstalado
- [ ] Build anterior removido
- [ ] expo prebuild executado

### Teste
- [ ] Terminal reiniciado após configurar variáveis
- [ ] Comando com --verbose para ver erro específico

---

## 🔍 Diagnóstico

Execute e envie os resultados:

```bash
# Verificar ambiente
echo "=== JAVA ==="
java -version
echo.
echo "=== JAVA_HOME ==="
echo %JAVA_HOME%
echo.
echo "=== ANDROID_HOME ==="
echo %ANDROID_HOME%
echo.
echo "=== ADB ==="
adb version
echo.
echo "=== NODE ==="
node -v
echo.
echo "=== NPM ==="
npm -v
```

---

## 🆘 Ainda com Erro?

### 1. Ver Logs Completos do Gradle

```bash
cd mobile\android
.\gradlew app:assembleDebug --stacktrace --info > build_log.txt
```

Abra `build_log.txt` e procure por `FAILURE` ou `ERROR`

### 2. Build com Expo em Modo Verbose

```bash
cd mobile
npx expo run:android --verbose 2>&1 | tee build_output.txt
```

### 3. Testar Gradle Diretamente

```bash
cd mobile\android
.\gradlew clean
.\gradlew app:assembleDebug
```

Se funcionar → Problema no Expo
Se falhar → Problema no Gradle/Android

---

## 🎯 Alternativa: EAS Build (Recomendado)

Se build local continuar falhando, use build na nuvem:

```bash
cd C:\projects\movikar-app-react\mobile

# Login (apenas primeira vez)
npx eas-cli login

# Build
npx eas-cli build --platform android --profile preview
```

**Vantagens**:
- ✅ Não precisa configurar Android SDK
- ✅ Não precisa configurar Java
- ✅ Build feito em servidor Linux
- ✅ APK pronto para instalar

**Tempo**: 5-10 minutos

---

## 💡 Dicas

### Windows Defender/Antivírus
Às vezes bloqueia o Gradle. Adicione exceção para:
- `C:\Users\SeuUsuario\.gradle`
- `C:\projects\movikar-app-react\mobile\android`

### Espaço em Disco
Gradle precisa de ~5GB livres. Verifique:
```bash
dir C:\ 
```

### Reiniciar Sempre
Após configurar JAVA_HOME ou ANDROID_HOME, **SEMPRE reinicie**:
1. Feche terminal
2. Feche Android Studio (se aberto)
3. Abra novo terminal
4. Teste novamente

---

## 📞 Comandos de Suporte

### Verificar Todas Variáveis
```bash
set | findstr "JAVA ANDROID"
```

### Limpar Tudo
```bash
cd C:\projects\movikar-app-react\mobile
rmdir /s /q android ios .expo node_modules
npm install
npx expo prebuild --clean
```

### Build Mínimo
```bash
cd mobile\android
.\gradlew clean
.\gradlew app:assembleDebug --stacktrace
```

---

**Execute o Passo 4 com --verbose e me envie o erro específico que aparecer!**

```bash
cd C:\projects\movikar-app-react\mobile
npx expo run:android --verbose
```

Isso vai mostrar **exatamente** qual é o problema.
