#!/bin/bash
# Script de actualización automática para Cantus V1 (Linux/Mac)
# Uso: chmod +x update.sh && ./update.sh

echo "------------------------------------------"
echo "🚀 Iniciando actualización de Cantus V1..."
echo "------------------------------------------"

# 1. Traer últimos cambios
echo "📥 Descargando actualizaciones de GitHub..."
git pull origin main

# 2. Instalar dependencias si hay nuevas
echo "📦 Verificando dependencias (npm install)..."
npm install

# 3. Compilar para producción
echo "🛠️ Generando build de producción..."
npm run build

echo "------------------------------------------"
echo "✅ ¡Cantus V1 actualizado y listo!"
echo "------------------------------------------"
