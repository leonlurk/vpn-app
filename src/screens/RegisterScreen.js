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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors } from '../styles/colors';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const isMounted = useRef(true);
  
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(100);
  const buttonScale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
  const sparkleRotate = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    try {
      fadeIn.value = withTiming(1, { duration: 1200 });
      slideUp.value = withTiming(0, { duration: 1000 });
      
      // Sparkle animation con manejo de errores
      const animateSparkle = () => {
        if (isMounted.current) {
          sparkleRotate.value = withTiming(360, { duration: 4000 }, (finished) => {
            if (finished && isMounted.current) {
              sparkleRotate.value = 0;
              animateSparkle();
            }
          });
        }
      };
      animateSparkle();
      
      // Pulse animation
      pulseScale.value = withDelay(
        500,
        withTiming(1.1, { duration: 1000 }, (finished) => {
          if (finished && isMounted.current) {
            pulseScale.value = withTiming(1, { duration: 1000 });
          }
        })
      );
    } catch (error) {
      console.warn('Error al inicializar animaciones:', error);
    }

    return () => {
      isMounted.current = false;
      try {
        cancelAnimation(fadeIn);
        cancelAnimation(slideUp);
        cancelAnimation(buttonScale);
        cancelAnimation(progressWidth);
        cancelAnimation(sparkleRotate);
        cancelAnimation(pulseScale);
      } catch (error) {
        console.warn('Error al limpiar animaciones:', error);
      }
    };
  }, []);

  const updateProgress = () => {
    try {
      const { name, email, password, confirmPassword } = formData;
      const fields = [name, email, password, confirmPassword];
      const filledFields = fields.filter(field => field.length > 0).length;
      const progress = (filledFields / fields.length) * 100;
      if (isMounted.current) {
        progressWidth.value = withSpring(progress);
      }
    } catch (error) {
      console.warn('Error al actualizar progreso:', error);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTimeout(updateProgress, 0);
  };

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

  const progressStyle = useAnimatedStyle(() => {
    try {
      return {
        width: `${progressWidth.value}%`,
      };
    } catch (error) {
      return { width: '0%' };
    }
  });

  const sparkleStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ rotate: `${sparkleRotate.value}deg` }],
      };
    } catch (error) {
      return { transform: [{ rotate: '0deg' }] };
    }
  });

  const pulseStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ scale: pulseScale.value }],
      };
    } catch (error) {
      return { transform: [{ scale: 1 }] };
    }
  });

  const handleRegister = () => {
    try {
      buttonScale.value = withSpring(0.95, {}, (finished) => {
        if (finished && isMounted.current) {
          buttonScale.value = withSpring(1);
        }
      });
    } catch (error) {
      console.warn('Error en animación del botón:', error);
    }
    
    const { name, email, password, confirmPassword } = formData;
    
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    Alert.alert('Éxito', 'Cuenta creada exitosamente', [
      { text: 'OK', onPress: () => {
        if (isMounted.current) {
          navigation.navigate('Login');
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
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, fadeInStyle]}>
            <Animated.View style={[styles.headerContainer, pulseStyle]}>
              <Animated.Text style={[styles.sparkle, sparkleStyle]}>✨</Animated.Text>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete a Nodex VPN</Text>
            </Animated.View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View style={[styles.progressFill, progressStyle]} />
              </View>
              <Text style={styles.progressText}>Progreso del registro</Text>
            </View>
            
            <Animated.View style={[styles.formContainer, fadeInStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor={colors.gray}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                autoCapitalize="words"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.gray}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={colors.gray}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
              />
              
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={colors.gray}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
              />
              
              <AnimatedTouchableOpacity
                style={[styles.button, buttonStyle]}
                onPress={handleRegister}
              >
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              </AnimatedTouchableOpacity>
              
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>
                  ¿Ya tienes cuenta? Inicia sesión aquí
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sparkle: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
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
    opacity: 0.9,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  progressText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.8,
  },
  formContainer: {
    backgroundColor: colors.white,
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
    marginVertical: 8,
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
    marginVertical: 20,
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
    color: colors.primarySolid,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});