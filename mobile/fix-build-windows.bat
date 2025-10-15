@echo off
echo 🧹 Limpando projeto Android...
echo.

cd /d "%~dp0"

echo [1/5] Parando processos...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM node.exe 2>nul
echo ✅ Processos parados

echo.
echo [2/5] Limpando build...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist .gradle rmdir /s /q .gradle
echo ✅ Build limpo

echo.
echo [3/5] Limpando cache Gradle...
if exist "%USERPROFILE%\.gradle\caches" rmdir /s /q "%USERPROFILE%\.gradle\caches"
echo ✅ Cache limpo

echo.
echo [4/5] Reinstalando node_modules...
if exist node_modules rmdir /s /q node_modules
call npm install
echo ✅ Dependências instaladas

echo.
echo [5/5] Regenerando configuração nativa...
call npx expo prebuild --clean
echo ✅ Configuração gerada

echo.
echo ✅ Limpeza concluída com sucesso!
echo.
echo 📋 Próximos passos:
echo   1. Verifique JAVA_HOME: echo %%JAVA_HOME%%
echo   2. Verifique ANDROID_HOME: echo %%ANDROID_HOME%%
echo   3. Execute: npx expo run:android --verbose
echo.
pause
