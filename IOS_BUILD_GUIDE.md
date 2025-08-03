# 📱 Guía Completa: Compilar y Probar NodeX VPN en iOS (iPhone 15)

## 🎯 Resumen

Esta guía te ayudará a compilar e instalar NodeX VPN en tu iPhone 15 desde Windows usando EAS Build.

## ✅ Requisitos Previos

1. **Cuenta de Apple Developer** ($99/año)
2. **iPhone 15** con iOS 17+
3. **Node.js 18+** instalado
4. **EAS CLI** instalado (`npm install -g eas-cli`)
5. **Expo CLI** instalado (`npm install -g expo`)

## 🚀 Pasos de Configuración

### 1. Preparar el Proyecto

```bash
# Desde el directorio del proyecto
cd nodex-vpn-app

# Instalar dependencias
npm install

# Ejecutar script de pre-build iOS
node scripts/ios-prebuild.js

# Login en Expo/EAS
eas login
```

### 2. Configurar Apple Developer

1. Ve a [Apple Developer](https://developer.apple.com)
2. Crea un nuevo **App ID**:
   - Bundle ID: `com.nodexvpn.app`
   - Capabilities:
     - ✅ Network Extensions
     - ✅ App Groups (group.com.nodexvpn.app.shared)
     - ✅ Keychain Sharing

3. Crea un **App ID para la Extension**:
   - Bundle ID: `com.nodexvpn.app.WireGuardExtension`
   - Capabilities:
     - ✅ Network Extensions (Packet Tunnel Provider)
     - ✅ App Groups (group.com.nodexvpn.app.shared)

4. Crea **Provisioning Profiles** para ambos App IDs

### 3. Configurar EAS Build

```bash
# Configurar proyecto con EAS (solo la primera vez)
eas build:configure

# Cuando pregunte por el bundle identifier, usa:
# com.nodexvpn.app
```

### 4. Compilar para iOS

```bash
# Build de desarrollo para testing
eas build --platform ios --profile development

# O build de preview para TestFlight
eas build --platform ios --profile preview
```

## 📲 Instalación en iPhone 15

### Opción A: Instalación Directa (Development Build)

1. Espera que termine la compilación en EAS (~20-30 min)
2. Descarga el archivo `.ipa` desde el dashboard de EAS
3. Instala usando **Apple Configurator 2** (desde una Mac) o **Sideloadly** (desde Windows)

### Opción B: TestFlight (Recomendado)

1. Sube el build a App Store Connect:
   ```bash
   eas submit --platform ios
   ```

2. En App Store Connect:
   - Ve a TestFlight
   - Agrega tu Apple ID como tester
   - Acepta la invitación en tu iPhone

3. Instala desde TestFlight en tu iPhone

## 🔧 Configuración en el iPhone

### 1. Permisos Iniciales

Al abrir la app por primera vez:
1. **Permitir notificaciones** cuando se solicite
2. **Permitir configuración VPN** cuando aparezca el diálogo del sistema

### 2. Configurar VPN

1. Ve a **Ajustes > General > VPN y gestión de dispositivos**
2. Deberías ver "NodeX VPN" en la lista
3. Actívalo si no está activo

### 3. Probar Conexión

1. Abre la app NodeX VPN
2. Toca el botón de conexión
3. Si es la primera vez, iOS pedirá permiso para agregar configuración VPN
4. Acepta y autentica con Face ID/Touch ID
5. La conexión debería establecerse

## 🐛 Solución de Problemas

### Error: "No VPN configurations installed"

1. Asegúrate de haber aceptado los permisos de VPN
2. Ve a Ajustes > VPN y verifica que NodeX VPN esté listado
3. Si no aparece, reinstala la app

### Error: "Network Extension not running"

1. Reinicia el iPhone
2. Reinstala la app
3. Verifica que los App IDs tengan las capabilities correctas

### Error al compilar con EAS

Si encuentras errores de WireGuardKit:

```bash
# Limpia cache
rm -rf node_modules
npm install

# Reconstruye
eas build --clear-cache --platform ios
```

## 📋 Verificación de la Implementación

### Archivos iOS Creados:

- ✅ `ios/NodexVpnApp/RealWireGuardModule.swift` - Módulo bridge principal
- ✅ `ios/NodexVpnApp/RealWireGuardModule.m` - Bridge Objective-C
- ✅ `ios/WireGuardExtension/WireGuardTunnelProvider.swift` - Provider del túnel
- ✅ `ios/WireGuardExtension/WireGuardAdapter.swift` - Adaptador WireGuard
- ✅ `ios/WireGuardExtension/TunnelConfiguration.swift` - Configuración
- ✅ `ios/WireGuardExtension/Info.plist` - Info de la extension
- ✅ `ios/WireGuardExtension/WireGuardExtension.entitlements` - Permisos
- ✅ `ios/Shared/AppGroupManager.swift` - Comunicación entre app y extension
- ✅ `ios/Package.swift` - Dependencias Swift

### Funcionalidades Implementadas:

- ✅ **WireGuard Nativo** - Mismo protocolo que Android
- ✅ **Network Extension** - Túnel VPN real de iOS
- ✅ **App Groups** - Compartir datos entre app y extension
- ✅ **Notificaciones** - Estado de conexión persistente
- ✅ **Logging** - Sistema de logs unificado
- ✅ **Configuración dinámica** - Recibe config del servidor

## 🎯 Testing Checklist

- [ ] La app se instala correctamente
- [ ] Solicita permisos de VPN
- [ ] El botón de conexión responde
- [ ] Se establece conexión con el servidor
- [ ] El icono VPN aparece en la barra de estado
- [ ] El tráfico pasa por el túnel VPN
- [ ] La desconexión funciona correctamente
- [ ] La app se reconecta después de cambios de red

## 🚀 Comandos Útiles

```bash
# Ver logs de EAS Build
eas build:list --platform ios

# Verificar estado del build
eas build:view [build-id]

# Subir a TestFlight
eas submit --platform ios --latest

# Limpiar cache y reconstruir
eas build --clear-cache --platform ios
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en EAS Build
2. Verifica la consola de Xcode (si tienes acceso a Mac)
3. Revisa los logs del dispositivo en Ajustes > Privacidad > Análisis

---

**¡Felicitaciones!** 🎉 Has implementado exitosamente WireGuard VPN nativo para iOS, manteniendo paridad completa con la versión Android.