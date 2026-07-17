@echo off
REM Script para hacer push a GitHub y desplegar en Cloudflare automáticamente
REM Ejecuta este script cuando tengas internet

echo.
echo ========================================
echo PUSH A GITHUB Y DEPLOY A CLOUDFLARE
echo ========================================
echo.

REM Ir a la carpeta del proyecto
cd /d "%~dp0"

echo [1/3] Verificando estado de git...
git status
echo.

echo [2/3] Haciendo push a GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo hacer push
    echo Verifica tu conexión a internet
    pause
    exit /b 1
)

echo.
echo [3/3] Push completado exitosamente!
echo.
echo Tu app se actualizará en Cloudflare en 2-3 minutos
echo URL: https://gestionactivos-aa.pages.dev
echo.
echo Cloudflare automáticamente:
echo - Clonará el código de GitHub
echo - Ejecutará: npm run build
echo - Publicará la carpeta dist/
echo.
echo Abre tu navegador en 3 minutos y recarga la página.
echo.
pause
