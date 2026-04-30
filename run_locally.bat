@echo off
title Resolume to Unreal CSV Exporter
echo Iniciando entorno...

:: Comprobar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ===================================================================
    echo ERROR CRITICO: Node.js no esta instalado o no se encuentra en el PATH.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/
    echo ===================================================================
    echo.
    pause
    exit /b
)

:: Comprobar e instalar dependencias si no existen
if not exist "node_modules\" (
    echo.
    echo ===================================================================
    echo Primera ejecucion detectada. Instalando dependencias...
    echo Esto puede tardar un par de minutos, por favor espera.
    echo ===================================================================
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ===================================================================
        echo ERROR: Hubo un problema al instalar las dependencias.
        echo Revisa tu conexion a internet o los permisos de escritura.
        echo ===================================================================
        echo.
        pause
        exit /b
    )
)

echo.
echo ===================================================================
echo Iniciando servidor local con soporte Spout...
echo ===================================================================
echo.

:: Iniciar el navegador y luego el servidor
start http://localhost:8080/
node spout_server.js

:: Si el servidor se cae o hay un error de ejecucion, pausar para ver el error
echo.
echo ===================================================================
echo El servidor se ha detenido o ha ocurrido un error (revisa arriba).
echo ===================================================================
pause
