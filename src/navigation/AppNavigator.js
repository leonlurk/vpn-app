import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { auth } from '../services/FirebaseAuth';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MainScreen from '../screens/MainScreen';
import ServerSelectionScreen from '../screens/ServerSelectionScreen';
import { colors } from '../styles/colors';

const Stack = createNativeStackNavigator();

// Pantalla de carga mientras verifica sesión
function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{
        color: colors.text,
        marginTop: 16,
        fontSize: 16,
      }}>
        Verificando sesión...
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    // Listener para cambios en el estado de autenticación
    const unsubscribe = auth().onAuthStateChanged((user) => {
      console.log('🔑 Estado de autenticación cambiado:', user ? '✅ Logueado' : '❌ No logueado');
      
      if (user) {
        console.log('✅ Usuario persistente encontrado:', user.email);
        setInitialRoute('Main');
      } else {
        console.log('❌ No hay sesión persistente, redirigiendo a Login');
        setInitialRoute('Login');
      }
      
      setIsLoading(false);
    });

    // Cleanup del listener
    return unsubscribe;
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="ServerSelection" component={ServerSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}