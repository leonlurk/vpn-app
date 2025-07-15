import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import NodexLogo from '../components/NodexLogo';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isMounted = useRef(true);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);
  const buttonScale = useSharedValue(1);
  const floatingAnimation = useSharedValue(0);

  useEffect(() => {
    // Inicializar animaciones de manera segura
    try {
      fadeIn.value = withTiming(1, { duration: 1000 });
      slideUp.value = withTiming(0, { duration: 800 });
      
      floatingAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        true
      );
    } catch (error) {
      console.warn('Error al inicializar animaciones:', error);
    }

    // Cleanup function
    return () => {
      isMounted.current = false;
      try {
        cancelAnimation(fadeIn);
        cancelAnimation(slideUp);
        cancelAnimation(buttonScale);
        cancelAnimation(floatingAnimation);
      } catch (error) {
        console.warn('Error al limpiar animaciones:', error);
      }
    };
  }, []);

  const fadeInStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: fadeIn.value,
        transform: [{ translateY: slideUp.value }],
      };
    } catch (error) {
      return { opacity: 1, transform: [{ translateY: 0 }] };
    }
  });

  const buttonStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: buttonScale.value }],
      };
    } catch (error) {
      return { transform: [{ scale: 1 }] };
    }
  });

  const floatingStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [
          {
            translateY: interpolate(
              floatingAnimation.value,
              [0, 1],
              [0, -10]
            ),
          },
        ],
      };
    } catch (error) {
      return { transform: [{ translateY: 0 }] };
    }
  });

  const backgroundStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: interpolate(
          floatingAnimation.value,
          [0, 1],
          [0.9, 0.7]
        ),
      };
    } catch (error) {
      return { opacity: 0.9 };
    }
  });

  const handleLogin = () => {
    try {
      buttonScale.value = withSpring(0.95, {}, () => {
        if (isMounted.current) {
          buttonScale.value = withSpring(1);
        }
      });
    } catch (error) {
      console.warn('Error en animación del botón:', error);
    }
    
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    
    // Simulate login logic
    Alert.alert('Éxito', 'Iniciando sesión...', [
      { text: 'OK', onPress: () => {
        if (isMounted.current) {
          navigation.navigate('Main');
        }
      }}
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AnimatedLinearGradient
        colors={colors.gradient}
        style={[styles.gradient, backgroundStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View style={[styles.content, fadeInStyle]}>
          <Animated.View style={styles.logoContainer}>
            <NodexLogo width={200} height={75} />
          </Animated.View>
          
          <Text style={styles.subtitle}>Conexión Segura y Privada</Text>
          
          <Animated.View style={[styles.formContainer, fadeInStyle]}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.gray}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.gray}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <AnimatedTouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </AnimatedTouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.linkText}>
                ¿No tienes cuenta? Regístrate aquí
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </AnimatedLinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
    fontSize: 16,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: colors.primarySolid,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginVertical: 15,
    shadowColor: colors.primarySolid,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: colors.primary,
    textAlign: 'center',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 15,
  },
});