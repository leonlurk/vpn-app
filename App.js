import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

// ✅ Importar Firebase para asegurar inicialización temprana
import './src/services/FirebaseAuth';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="rgba(189, 176, 228, 0.9)" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}