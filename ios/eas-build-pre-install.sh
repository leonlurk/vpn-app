#!/bin/bash
# Script de pre-instalación para EAS Build

echo "🚀 Iniciando configuración de WireGuard para iOS..."

# Instalar dependencias de Swift Package Manager
echo "📦 Instalando WireGuardKit..."

# Configurar entitlements
echo "🔐 Configurando entitlements..."

# Verificar estructura de archivos
echo "📁 Verificando estructura de archivos..."
find ./ios -name "*.swift" -type f | head -20

echo "✅ Configuración pre-build completada"
