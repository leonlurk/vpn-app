/**
 * FIREBASE AUTH - Servicio de autenticación REACT NATIVE
 * Configuración para React Native Firebase v22.4.0+
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import firebase from '@react-native-firebase/app';

console.log('🔥 React Native Firebase v22.4.0+ iniciado...');

// Verificar inicialización
try {
  const app = firebase.app();
  console.log('✅ Firebase App inicializada:', app.name);
  console.log('✅ Auth disponible:', !!auth());
  console.log('✅ Firestore disponible:', !!firestore());
  console.log('✅ Firebase configurado correctamente');
} catch (error) {
  console.error('❌ Error verificando Firebase:', error);
}

/**
 * Exportar servicios de Firebase (sintaxis v22.4.0+)
 */
export { auth, firestore };

export default {
  auth,
  firestore
}; 