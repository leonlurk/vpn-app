# 🔥 CONFIGURACIÓN FIREBASE CONSOLE - NODEX VPN

## 📱 **QUÉ NECESITAS CONFIGURAR EN FIREBASE CONSOLE**

Según tu captura de pantalla, te falta configurar las **apps móviles** en tu proyecto Firebase. Aquí tienes la guía completa:

---

## 🚀 **PASO 1: CONFIGURAR AUTENTICACIÓN**

### 1. En Firebase Console:
1. Ve a **Authentication** → **Sign-in method**
2. Habilita los siguientes métodos:
   - ✅ **Email/Password** (Activar)
   - ✅ **Google** (Opcional, recomendado)
3. Click **Save**

### 2. Configurar dominio autorizado:
1. En **Settings** → **Authorized domains**
2. Agregar tu dominio: `tu-dominio.com` (si tienes)

---

## 📱 **PASO 2: AGREGAR APP ANDROID**

### 1. En Firebase Console:
1. Click el ícono **Android** (📱)
2. Completa el formulario:
   ```
   Android package name: com.nodexvpn.app
   App nickname: NodeX VPN Android
   Debug signing certificate SHA-1: (opcional por ahora)
   ```
3. Click **Register app**

### 2. Descargar google-services.json:
1. Descarga el archivo `google-services.json`
2. **IMPORTANTE:** Colócalo en:
   ```
   android/app/google-services.json
   ```

### 3. Configurar build.gradle:
El archivo ya debería estar configurado, pero verifica:
```gradle
// android/build.gradle (project level)
classpath 'com.google.gms:google-services:4.3.15'

// android/app/build.gradle
apply plugin: 'com.google.gms.google-services'
```

---

## 🍎 **PASO 3: AGREGAR APP iOS**

### 1. En Firebase Console:
1. Click el ícono **iOS** (🍎)
2. Completa el formulario:
   ```
   iOS bundle ID: com.nodexvpn.app
   App nickname: NodeX VPN iOS
   App Store ID: (opcional)
   ```
3. Click **Register app**

### 2. Descargar GoogleService-Info.plist:
1. Descarga el archivo `GoogleService-Info.plist`
2. **IMPORTANTE:** Colócalo en:
   ```
   ios/nodexvpn/GoogleService-Info.plist
   ```

---

## 🌐 **PASO 4: CONFIGURAR APP WEB**

### 1. En Firebase Console:
1. Click el ícono **Web** (🌐)
2. Completa:
   ```
   App nickname: NodeX VPN Web
   ✅ Also set up Firebase Hosting (opcional)
   ```
3. Click **Register app**

### 2. Copiar configuración web:
Cuando te muestre la configuración, copia el `appId`:
```javascript
const firebaseConfig = {
  // ... otros valores ...
  appId: "1:686658659923:web:ESTE_ES_EL_QUE_NECESITAS"
};
```

### 3. Actualizar en el código:
Reemplaza en `src/services/FirebaseAuth.ts` línea 43:
```javascript
appId: "1:686658659923:web:TU_APP_ID_AQUÍ"
```

---

## 🗃️ **PASO 5: CONFIGURAR FIRESTORE DATABASE**

### 1. Crear Firestore:
1. Ve a **Firestore Database**
2. Click **Create database**
3. Selecciona **Start in test mode** (para desarrollo)
4. Elige una ubicación: **us-central** (recomendado)

### 2. Configurar reglas (Firestore):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lecturas/escritas autenticadas
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🔐 **PASO 6: CONFIGURAR REALTIME DATABASE (OPCIONAL)**

### 1. Crear Realtime Database:
1. Ve a **Realtime Database**
2. Click **Create Database**
3. Selecciona **Start in test mode**
4. URL será: `https://nodexvpn-default-rtdb.firebaseio.com`

### 2. Configurar reglas (Realtime Database):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

---

## ⚙️ **PASO 7: VERIFICAR CONFIGURACIÓN**

### Tu Firebase Console debería mostrar:
- ✅ Authentication configurado
- ✅ 3 apps registradas (Android, iOS, Web)  
- ✅ Firestore Database creado
- ✅ Service Account funcionando

### Estructura final:
```
📱 Android: com.nodexvpn.app
🍎 iOS: com.nodexvpn.app  
🌐 Web: NodeX VPN Web
🔥 Auth: Email/Password habilitado
🗃️ Firestore: Configurado
🔑 Service Account: ✅ Ya tienes
```

---

## 🚨 **ERRORES COMUNES Y SOLUCIONES**

### Error: "default app not initialized"
**Solución:** Verifica que `google-services.json` esté en la carpeta correcta

### Error: "API key not valid"
**Solución:** Regenera la API key en Firebase Console → Project Settings

### Error: "Package name mismatch"
**Solución:** Verifica que el package name sea exactamente `com.nodexvpn.app`

### Error: "Auth domain not authorized"
**Solución:** Agrega tu dominio en Authentication → Settings → Authorized domains

---

## 📦 **DEPENDENCIAS REQUERIDAS**

### En el backend ya tienes:
```json
"firebase-admin": "^12.0.0"
```

### En el frontend necesitas instalar:
```bash
npm install firebase@^10.8.0
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

---

## ✅ **CHECKLIST DE CONFIGURACIÓN**

Marca cuando completes cada paso:

### Firebase Console:
- [ ] ✅ Authentication habilitado (Email/Password)
- [ ] 📱 App Android agregada (`google-services.json` descargado)
- [ ] 🍎 App iOS agregada (`GoogleService-Info.plist` descargado)  
- [ ] 🌐 App Web agregada (appId obtenido)
- [ ] 🗃️ Firestore Database creado
- [ ] 🔐 Reglas de seguridad configuradas

### Archivos:
- [ ] `android/app/google-services.json` colocado
- [ ] `ios/nodexvpn/GoogleService-Info.plist` colocado
- [ ] `src/services/FirebaseAuth.ts` actualizado con appId
- [ ] `nodex-vpn-server/serviceAccountKey.json` ya está ✅

### Comandos:
- [ ] `npm install` en frontend (dependencias Firebase)
- [ ] `npm run build` en backend
- [ ] Test de autenticación

---

## 🎯 **RESULTADO ESPERADO**

Después de completar estos pasos:

1. **En tu app móvil:** Login/registro funcionando con Firebase
2. **En tu backend:** API usando Firebase Admin SDK
3. **En Firestore:** Usuarios y sesiones VPN registrados
4. **En Authentication:** Lista de usuarios registrados

**¡Tu VPN tendrá autenticación Firebase completa!** 🔥🚀

---

## 📞 **SOPORTE**

Si tienes problemas:
1. Verifica la consola del navegador/logs
2. Comprueba que todos los archivos estén en su lugar
3. Ejecuta `npx expo run:android` para rebuild
4. Verifica las reglas de Firestore/Authentication 