import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const { width } = Dimensions.get('window');

const servers = [
  { 
    id: 'sa-brazil',
    name: 'Nodex VPN (Brasil)', 
    flag: '🇧🇷', 
    address: '92.113.32.217',
    port: 51820,
    ping: 25,
    available: true,
    location: 'São Paulo'
  },
  { name: 'Estados Unidos (NY)', flag: '🇺🇸', ping: '--', available: false, location: 'Nueva York' },
  { name: 'Reino Unido', flag: '🇬🇧', ping: '--', available: false, location: 'Londres' },
  { name: 'Alemania', flag: '🇩🇪', ping: '--', available: false, location: 'Fráncfort' },
  { name: 'Francia', flag: '🇫🇷', ping: '--', available: false, location: 'París' },
  { name: 'Canadá', flag: '🇨🇦', ping: '--', available: false, location: 'Toronto' },
  { name: 'España', flag: '🇪🇸', ping: '--', available: false, location: 'Madrid' },
  { name: 'México', flag: '🇲🇽', ping: '--', available: false, location: 'Ciudad de México' },
  { name: 'Argentina', flag: '🇦🇷', ping: '--', available: false, location: 'Buenos Aires' },
  { name: 'Chile', flag: '🇨🇱', ping: '--', available: false, location: 'Santiago' },
  { name: 'Colombia', flag: '🇨🇴', ping: '--', available: false, location: 'Bogotá' },
  { name: 'Japón', flag: '🇯🇵', ping: '--', available: false, location: 'Tokio' },
];

export default function ServerSelectionScreen({ navigation }) {
  const sortedServers = useMemo(() => servers.sort((a, b) => a.ping - b.ping), []);

  const getPingColor = (ping) => {
    if (ping < 50) return '#00FF87';
    if (ping < 150) return '#FFB800';
    return '#FF6B6B';
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.serverItem, 
        !item.available && styles.serverItemDisabled,
        { animationDelay: index * 100 }
      ]}
      onPress={() => {
        if (item.available) {
          navigation.navigate('Main', { selectedServer: item });
        }
      }}
      disabled={!item.available}
      activeOpacity={item.available ? 0.8 : 1}
    >
      <LinearGradient
        colors={
          item.available 
            ? ['rgba(0, 212, 255, 0.15)', 'rgba(0, 255, 135, 0.05)']
            : ['rgba(255, 255, 255, 0.03)', 'rgba(255, 255, 255, 0.01)']
        }
        style={styles.serverGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.serverContent}>
          <View style={styles.serverMainInfo}>
            <View style={styles.flagContainer}>
              <Text style={styles.flag}>{item.flag}</Text>
              {item.available && (
                <View style={styles.onlineDot} />
              )}
            </View>
            
            <View style={styles.serverDetails}>
              <Text style={[
                styles.serverName, 
                !item.available && styles.serverNameDisabled
              ]}>
                {item.name}
              </Text>
              <Text style={[
                styles.serverLocation,
                !item.available && styles.serverLocationDisabled
              ]}>
                {item.location}
                {!item.available && ' • Próximamente'}
              </Text>
            </View>
          </View>

          <View style={styles.serverStats}>
            {item.available ? (
              <View style={styles.pingContainer}>
                <MaterialIcons 
                  name="signal-cellular-alt" 
                  size={16} 
                  color={getPingColor(item.ping)} 
                />
                <Text style={[styles.pingText, { color: getPingColor(item.ping) }]}>
                  {item.ping}ms
                </Text>
                <View style={[styles.pingIndicator, { backgroundColor: getPingColor(item.ping) }]} />
              </View>
            ) : (
              <View style={styles.comingSoonContainer}>
                <MaterialIcons name="schedule" size={16} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.comingSoonText}>Próximamente</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Seleccionar Servidor</Text>
            <Text style={styles.headerSubtitle}>
              {servers.filter(s => s.available).length} de {servers.length} disponibles
            </Text>
          </View>
          
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#00D4FF" />
          </TouchableOpacity>
        </View>

        {/* Lista de servidores */}
        <FlatList
          data={sortedServers}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  serverItem: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  serverGradient: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  serverContent: {
    padding: 20,
  },
  serverMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flagContainer: {
    position: 'relative',
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  flag: {
    fontSize: 20,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#00FF87',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  serverDetails: {
    flex: 1,
  },
  serverName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  serverLocation: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  serverStats: {
    alignItems: 'flex-end',
  },
  pingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  pingText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '700',
  },
  pingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    shadowColor: '#00FF87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 2,
  },
  comingSoonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  comingSoonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 6,
    fontWeight: '500',
  },
  serverItemDisabled: {
    opacity: 0.6,
  },
  serverNameDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  serverLocationDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  separator: {
    height: 8,
  },
}); 