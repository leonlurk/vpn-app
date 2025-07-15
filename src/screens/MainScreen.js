import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
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
  withDelay,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import NodexLogo from '../components/NodexLogo';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const { width } = Dimensions.get('window');

export default function MainScreen({ navigation, route }) {
  const [isConnected, setIsConnected] = useState(false);
  const [server, setServer] = useState({ name: 'Estados Unidos', flag: '🇺🇸', ping: 25 });
  const isMounted = useRef(true);
  
  const connectAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const glowAnimation = useSharedValue(0);

  useEffect(() => {
    if (route.params?.selectedServer) {
      setServer(route.params.selectedServer);
      if (isConnected) {
        // Re-conectar al nuevo servidor
        setIsConnected(false);
        setTimeout(() => handleConnect(), 500);
      }
    }
  }, [route.params?.selectedServer]);

  useEffect(() => {
    try {
      pulseAnimation.value = withRepeat(withTiming(1, { duration: 2000 }), -1, true);
      glowAnimation.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
    } catch (error) {
      console.warn('Error al inicializar animaciones:', error);
    }

    return () => {
      isMounted.current = false;
      try {
        cancelAnimation(connectAnimation);
        cancelAnimation(pulseAnimation);
        cancelAnimation(buttonScale);
        cancelAnimation(glowAnimation);
      } catch (error) {
        console.warn('Error al limpiar animaciones:', error);
      }
    };
  }, []);

  const handleConnect = () => {
    try {
      buttonScale.value = withSpring(0.95, {}, (finished) => {
        if (finished && isMounted.current) {
          buttonScale.value = withSpring(1);
        }
      });
      
      const nextState = !isConnected;
      const duration = nextState ? 1500 : 800;

      connectAnimation.value = withTiming(nextState ? 1 : 0, { duration }, (finished) => {
        if (finished && isMounted.current) {
          runOnJS(setIsConnected)(nextState);
        }
      });
    } catch (error) {
      console.warn('Error en animación de conexión:', error);
      setIsConnected(!isConnected);
    }
  };

  const connectButtonStyle = useAnimatedStyle(() => {
    const backgroundColor = connectAnimation.value === 1 ? colors.success : colors.primarySolid;
    return {
      transform: [{ scale: buttonScale.value }],
      backgroundColor: withTiming(backgroundColor, { duration: 500 }),
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 0.5, 1], [1, 1.1, 1]);
    const opacity = interpolate(pulseAnimation.value, [0, 0.5, 1], [0.6, 1, 0.6]);
    return {
      transform: [{ scale }],
      opacity: isConnected ? opacity : 0,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(glowAnimation.value, [0, 0.5, 1], [0.3, 0.7, 0.3]);
    return {
      shadowOpacity: isConnected ? opacity : 0,
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#2A2A3A', '#1E1E2A']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <NodexLogo width={120} height={45} />
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => Alert.alert('Configuración', 'Próximamente...')}
          >
            <Ionicons name="settings-outline" size={26} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Main Connection Area */}
        <View style={styles.connectionArea}>
          {/* Connection Status */}
          <Text style={styles.statusText}>
            {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
          </Text>

          {/* Pulse Effect */}
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
          
          {/* Main Connection Button */}
          <Animated.View style={[styles.connectionButtonContainer, glowStyle]}>
            <AnimatedTouchableOpacity
              style={[styles.connectionButton, connectButtonStyle]}
              onPress={handleConnect}
            >
              <MaterialCommunityIcons 
                name={isConnected ? 'shield-lock' : 'shield-off'} 
                size={width * 0.2} 
                color={colors.white} 
              />
            </AnimatedTouchableOpacity>
          </Animated.View>

          {/* Server Selection */}
          <View style={styles.serverSection}>
            <Text style={styles.serverLabel}>Servidor Actual:</Text>
            <TouchableOpacity 
              style={styles.serverButton}
              onPress={() => navigation.navigate('ServerSelection')}
            >
              <Text style={styles.serverText}>{server.flag} {server.name}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="speedometer" size={24} color={colors.white} />
            <Text style={styles.statValue}>{isConnected ? '15.2 MB/s' : '--'}</Text>
            <Text style={styles.statLabel}>Velocidad</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="signal-variant" size={24} color={colors.white} />
            <Text style={styles.statValue}>{isConnected ? `${server.ping} ms` : '--'}</Text>
            <Text style={styles.statLabel}>Ping</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="earth" size={24} color={colors.white} />
            <Text style={styles.statValue}>{server.name.split(' ')[0]}</Text>
            <Text style={styles.statLabel}>Región</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  settingsButton: {
    padding: 10,
  },
  connectionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 30,
    letterSpacing: 3,
    opacity: 0.8,
  },
  pulseRing: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  connectionButtonContainer: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    elevation: 20,
  },
  connectionButton: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  serverSection: {
    alignItems: 'center',
    marginTop: 30,
  },
  serverLabel: {
    color: colors.white,
    fontSize: 16,
    marginBottom: 10,
    opacity: 0.7,
  },
  serverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  serverText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
    marginRight: 10,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    width: width / 3.8,
    minHeight: 100,
    justifyContent: 'center',
  },
  statValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: colors.white,
    fontSize: 12,
    marginTop: 5,
    opacity: 0.7,
  },
});