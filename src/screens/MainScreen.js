import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import VpnIntegration from '../services/VpnIntegration';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

export default function MainScreen() {
  // Estado de VPN
  const [vpnStatus, setVpnStatus] = useState({
    isConnected: false,
    server: null,
    connectionTime: null
  });

  const [vpnStats, setVpnStats] = useState({
    downloadSpeed: '0 KB/s',
    uploadSpeed: '0 KB/s',
    dataUsed: '0 MB'
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [servers, setServers] = useState([]);

  useEffect(() => {
    // Inicializar estado VPN
    const initializeVpn = async () => {
      try {
        // Obtener servidores disponibles
        const availableServers = VpnIntegration.getServers();
        setServers(availableServers);
        
        // Obtener estado actual
        const status = VpnIntegration.getStatus();
        setVpnStatus({
          isConnected: status.isConnected,
          server: status.currentServer,
          connectionTime: status.connectionTime
        });
        
        if (status.isConnected) {
          const stats = VpnIntegration.getStats();
          setVpnStats({
            downloadSpeed: stats.speed,
            uploadSpeed: '0 KB/s', // Placeholder
            dataUsed: `${(stats.bytesReceived / 1024 / 1024).toFixed(1)} MB`
          });
        }
      } catch (error) {
        console.error('Error inicializando VPN:', error);
      }
    };

    initializeVpn();

    // Agregar listeners
    const unsubscribeStatus = VpnIntegration.addStatusListener((status) => {
      setVpnStatus({
        isConnected: status.isConnected,
        server: status.currentServer,
        connectionTime: status.connectionTime
      });
      setIsConnecting(status.isConnecting);
      setErrorText(status.error || '');
    });

    const unsubscribeStats = VpnIntegration.addStatsListener((stats) => {
      setVpnStats({
        downloadSpeed: stats.speed,
        uploadSpeed: '0 KB/s', // Placeholder
        dataUsed: `${(stats.bytesReceived / 1024 / 1024).toFixed(1)} MB`
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeStats();
    };
  }, []);

  const handleConnect = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);
      setErrorText('');
      
      if (!vpnStatus.isConnected) {
        console.log('🚀 Iniciando conexión VPN...');
        
        // Usar el primer servidor disponible
        const serverToConnect = servers[0];
        if (!serverToConnect) {
          throw new Error('No hay servidores disponibles');
        }
        
        await VpnIntegration.connect(serverToConnect);
        
      } else {
        console.log('🔌 Desconectando VPN...');
        await VpnIntegration.disconnect();
      }

    } catch (error) {
      console.error('Error en conexión VPN:', error);
      Alert.alert('Error', error.message || 'Error conectando al VPN');
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#0F0C29', '#24243e', '#302B63']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header moderno */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="security" size={32} color="#00D4FF" />
            <Text style={styles.headerTitle}>Nodex VPN</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: vpnStatus.isConnected ? '#00FF87' : '#FF6B6B' }
            ]} />
            <Text style={styles.headerSubtitle}>
              {vpnStatus.isConnected ? 'Protegido' : 'Desprotegido'}
            </Text>
          </View>
        </View>

        {/* Sección central del botón de conexión */}
        <View style={styles.connectSection}>
          {/* Anillos decorativos */}
          <View style={styles.ringContainer}>
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
            <View style={[styles.ring, styles.ring3]} />
            
            {/* Botón principal */}
            <TouchableOpacity 
              style={[
                styles.connectButton,
                { 
                  backgroundColor: vpnStatus.isConnected ? '#00FF87' : '#00D4FF',
                  transform: [{ scale: isConnecting ? 0.95 : 1 }]
                }
              ]}
              onPress={handleConnect}
              disabled={isConnecting}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={vpnStatus.isConnected ? ['#00FF87', '#00C470'] : ['#00D4FF', '#0099CC']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialIcons 
                  name={isConnecting ? "hourglass-empty" : vpnStatus.isConnected ? "shield" : "security"} 
                  size={64} 
                  color="#FFFFFF" 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.statusTextContainer}>
            <Text style={styles.connectStatus}>
              {isConnecting ? 'Conectando...' : vpnStatus.isConnected ? 'CONECTADO' : 'TOCA PARA CONECTAR'}
            </Text>
            
            {errorText ? (
              <Text style={styles.errorText}>{errorText}</Text>
            ) : null}
          </View>
        </View>

        {/* Información del servidor */}
        {vpnStatus.server && (
          <View style={styles.serverInfo}>
            <View style={styles.serverCard}>
              <View style={styles.serverHeader}>
                <Text style={styles.serverFlag}>{vpnStatus.server.flag}</Text>
                <View style={styles.serverDetails}>
                  <Text style={styles.serverName}>{vpnStatus.server.name}</Text>
                  <Text style={styles.serverLocation}>São Paulo, Brasil</Text>
                </View>
                <View style={styles.pingContainer}>
                  <Text style={styles.pingValue}>25ms</Text>
                  <Text style={styles.pingLabel}>ping</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Estadísticas mejoradas */}
        {vpnStatus.isConnected && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="download" size={28} color="#00D4FF" />
              <Text style={styles.statValue}>{vpnStats.downloadSpeed}</Text>
              <Text style={styles.statLabel}>Descarga</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="upload" size={28} color="#00FF87" />
              <Text style={styles.statValue}>{vpnStats.uploadSpeed}</Text>
              <Text style={styles.statLabel}>Subida</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="data-usage" size={28} color="#FFB800" />
              <Text style={styles.statValue}>{vpnStats.dataUsed}</Text>
              <Text style={styles.statLabel}>Transferido</Text>
            </View>
          </View>
        )}

        {/* Acciones rápidas mejoradas */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.2)', 'rgba(0, 212, 255, 0.1)']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="public" size={24} color="#00D4FF" />
              <Text style={styles.actionText}>Cambiar Ubicación</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialIcons name="tune" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Configuración</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    letterSpacing: -0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  connectSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 24,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
    opacity: 0.1,
  },
  ring1: {
    width: 200,
    height: 200,
    borderColor: '#00D4FF',
  },
  ring2: {
    width: 250,
    height: 250,
    borderColor: '#00FF87',
  },
  ring3: {
    width: 300,
    height: 300,
    borderColor: '#FFFFFF',
  },
  connectButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTextContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  connectStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.9,
  },
  serverInfo: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  serverCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  serverFlag: {
    fontSize: 32,
  },
  serverDetails: {
    flex: 1,
    marginLeft: 16,
  },
  serverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  serverLocation: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    fontWeight: '400',
  },
  pingContainer: {
    alignItems: 'flex-end',
  },
  pingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00FF87',
  },
  pingLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 90,
    justifyContent: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
});