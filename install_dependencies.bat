@echo off
title Instalador de Dependencias - Resolume Pixelmap 3D
echo ===================================================================
echo Verificando entorno para instalacion...
echo ===================================================================
echo.

:: 1. Comprobar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor, descarga e instala la version LTS desde: https://nodejs.org/
    echo.
    echo Una vez instalado, cierra esta ventana y vuelve a ejecutar este archivo.
    pause
    exit /b
)

echo [OK] Node.js detectado.

:: 2. Comprobar package.json
if not exist "package.json" (
    echo [ERROR] No se encuentra el archivo 'package.json'.
    echo Asegurate de haber extraido todos los archivos del ZIP/RAR antes de ejecutar este script.
    echo No ejecutes este archivo directamente desde el interior del compresor (WinRAR/7-Zip).
    pause
    exit /b
)

echo [OK] package.json detectado.

:: 3. Limpiar instalaciones previas si existen (opcional pero recomendado para evitar conflictos de versiones nativas)
if exist "node_modules\" (
    echo Se ha detectado una carpeta 'node_modules' previa. 
    echo Para asegurar una instalacion limpia, se recomienda borrarla primero.
    set /p DEL_NODE="¿Deseas borrar 'node_modules' y reinstalar todo? (S/N): "
    if /i "%DEL_NODE%"=="S" (
        echo Borrando carpeta node_modules...
        rd /s /q node_modules
    )
)

:: 4. Instalar dependencias
echo.
echo ===================================================================
echo Instalando dependencias de Node.js...
echo Esto puede tardar unos minutos (especialmente 'sharp' y 'texture-bridge').
echo ===================================================================
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ===================================================================
    echo [ERROR] Hubo un problema durante la instalacion.
    echo Posibles causas:
    echo 1. No hay conexion a internet.
    echo 2. El archivo se esta ejecutando desde una carpeta sin permisos de escritura.
    echo 3. Faltan herramientas de compilacion (aunque no deberian ser necesarias).
    echo ===================================================================
) else (
    echo.
    echo ===================================================================
    echo [EXITO] Dependencias instaladas correctamente.
    echo Ahora puedes cerrar este instalador y usar 'run_locally.bat'.
    echo ===================================================================
)

echo.
pause
