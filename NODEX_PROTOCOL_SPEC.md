# NODEX PROTOCOL - Especificación VPN Propia

## 🎯 VISIÓN GENERAL
Protocolo VPN propietario diseñado específicamente para la aplicación Nodex VPN, optimizado para velocidad, seguridad y control total.

## 🔧 ARQUITECTURA TÉCNICA

### Capas del Protocolo
1. **Capa de Transporte**: TCP/UDP sobre TLS 1.3
2. **Capa de Autenticación**: JWT + RSA 2048
3. **Capa de Cifrado**: AES-256-GCM + ChaCha20-Poly1305
4. **Capa de Túnel**: Custom packet tunneling

### Especificaciones de Seguridad
- **Cifrado**: AES-256-GCM (primario) + ChaCha20-Poly1305 (fallback)
- **Autenticación**: JWT con RSA-2048 + HMAC-SHA256
- **Intercambio de Claves**: ECDH P-256
- **Integridad**: SHA-256
- **Forward Secrecy**: Sí (rotación de claves cada 24h)

## 📡 PROTOCOLO DE COMUNICACIÓN

### Handshake Inicial
```
Client → Server: NODEX_HELLO + Auth Token
Server → Client: NODEX_WELCOME + Server Config
Client → Server: NODEX_READY + Client Config
Server → Client: NODEX_START + Tunnel Params
```

### Estructura de Paquetes
```
| Header (16 bytes) | Payload (variable) | Signature (32 bytes) |
| Version | Type | Length | Timestamp | Data | HMAC |
```

### Tipos de Paquetes
- `0x01` - AUTH_REQUEST
- `0x02` - AUTH_RESPONSE  
- `0x03` - TUNNEL_DATA
- `0x04` - KEEP_ALIVE
- `0x05` - DISCONNECT
- `0x06` - ERROR

## 🔄 FLUJO DE CONEXIÓN

1. **Autenticación**
   - Cliente envía credenciales JWT
   - Servidor valida y responde con configuración

2. **Establecimiento de Túnel**
   - Intercambio de claves ECDH
   - Configuración de parámetros de cifrado
   - Activación del túnel VPN

3. **Transmisión de Datos**
   - Encriptación AES-256-GCM
   - Compresión LZ4 (opcional)
   - Verificación de integridad

4. **Mantenimiento**
   - Keep-alive cada 30 segundos
   - Rotación de claves cada 24 horas
   - Reconexión automática

## ⚡ OPTIMIZACIONES NODEX

### Velocidad
- **Algoritmo de Compresión**: LZ4 ultra-fast
- **Buffer Management**: Zero-copy cuando sea posible
- **Multiplexing**: Múltiples streams por conexión

### Seguridad
- **Kill Switch**: Integrado en protocolo
- **DNS Leak Protection**: DNS sobre HTTPS forzado
- **Traffic Obfuscation**: Camuflaje de tráfico VPN

### Confiabilidad
- **Auto-Reconnect**: Reconexión transparente
- **Network Change Detection**: Adaptación automática
- **Fallback Servers**: Múltiples endpoints

## 🛠️ IMPLEMENTACIÓN

### Cliente Android
- **VpnService** nativo con tunelización IP
- **Cifrado**: Usando BouncyCastle + Android Keystore
- **Threading**: AsyncTask para operaciones de red

### Cliente iOS  
- **Network Extension** con PacketTunnelProvider
- **Cifrado**: Usando CommonCrypto + Keychain
- **Threading**: DispatchQueue para operaciones async

### Servidor Backend
- **Runtime**: Node.js con clustering
- **Base de Datos**: PostgreSQL para usuarios
- **Cache**: Redis para sesiones activas
- **Load Balancer**: HAProxy con health checks

## 📊 MÉTRICAS Y MONITOREO

### Métricas de Rendimiento
- Latencia de conexión: < 500ms
- Throughput: > 100 Mbps
- Overhead de cifrado: < 5%
- Tiempo de reconexión: < 2 segundos

### Logs de Seguridad
- Intentos de autenticación
- Errores de cifrado
- Desconexiones anómalas
- Cambios de configuración

## 🔄 VERSIONADO

### v1.0 (MVP)
- Autenticación básica JWT
- Cifrado AES-256
- Túnel UDP simple

### v1.1 (Optimizaciones)
- Compresión LZ4
- Múltiples algoritmos de cifrado
- Reconexión automática

### v2.0 (Avanzado)
- Obfuscación de tráfico
- Split tunneling
- Protocol switching dinámico

---

**Este protocolo es 100% propiedad de Nodex VPN y no utiliza implementaciones de terceros.** 