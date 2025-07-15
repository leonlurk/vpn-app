# Nodex VPN - White Label VPN App

Una aplicación VPN elegante y moderna construida con React Native y Expo, diseñada para ser personalizable como white label.

## Características

- 🎨 Diseño moderno con animaciones fluidas
- 🎯 Interfaz intuitiva y fácil de usar
- 🔒 Formularios de login y registro con validación
- 📱 Interfaz principal con efectos dinámicos
- 🎬 Animaciones suaves usando React Native Reanimated
- 🌈 Esquema de colores personalizable
- 🏷️ Preparado para white label

## Tecnologías Utilizadas

- React Native
- Expo
- React Navigation
- React Native Reanimated
- Expo Linear Gradient
- React Native Gesture Handler

## Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

## Ejecutar la aplicación

```bash
# Iniciar el servidor de desarrollo
npm start

# Ejecutar en iOS
npm run ios

# Ejecutar en Android
npm run android

# Ejecutar en Web
npm run web
```

## Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
├── screens/           # Pantallas de la aplicación
│   ├── LoginScreen.js
│   ├── RegisterScreen.js
│   └── MainScreen.js
├── navigation/        # Configuración de navegación
├── styles/           # Estilos globales y colores
│   ├── colors.js
│   └── globalStyles.js
```

## Personalización White Label

### Colores
Modifica `src/styles/colors.js` para cambiar el esquema de colores:

```javascript
export const colors = {
  primary: 'rgba(189, 176, 228, 0.9)', // Color principal
  // ... otros colores
};
```

### Assets
Reemplaza los archivos en la carpeta `assets/` con tus propios logos e íconos manteniendo las mismas dimensiones.

### Branding
- Cambia el nombre de la app en `app.json`
- Modifica los textos y títulos en las pantallas
- Personaliza los colores y estilos según tu marca

## Funcionalidades Implementadas

### 📱 Pantalla de Login
- Formulario de autenticación con validación
- Animaciones de entrada suaves
- Efectos visuales dinámicos
- Navegación a registro

### 📝 Pantalla de Registro
- Formulario completo con validación
- Barra de progreso animada
- Efectos de partículas
- Confirmación de contraseña

### 🏠 Pantalla Principal
- Botón de conexión VPN animado
- Selección de servidor
- Estadísticas en tiempo real
- Efectos de pulso y partículas
- Navegación inferior

## Próximas Funcionalidades

- [ ] Integración con backend VPN real
- [ ] Configuraciones avanzadas
- [ ] Múltiples protocolos VPN
- [ ] Análisis de velocidad
- [ ] Modo oscuro
- [ ] Localización en múltiples idiomas

## Licencia

Este proyecto está diseñado para uso comercial como white label. Contacta para más información sobre licencias.