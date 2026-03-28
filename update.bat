@echo off
:: Script de instalación/actualización para Cantus V1 (Windows)
title Actualizador Cantus V1
echo ------------------------------------------
echo 🚀 Iniciando instalacion/actualizacion de Cantus V1...
echo ------------------------------------------

:: 1. Traer últimos cambios
echo 📥 Descargando actualizaciones de GitHub...
git pull origin main

:: 2. Instalar dependencias
echo 📦 Verificando dependencias (npm install)...
call npm install

:: 3. Compilar
echo 🛠️ Generando build de producción...
call npm run build

echo ------------------------------------------
echo ✅ ¡Cantus V1 listo para trabajar en este PC!
echo ------------------------------------------
pause
