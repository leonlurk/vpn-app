import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const servers = [
  { name: 'Estados Unidos (NY)', flag: '🇺🇸', ping: 25 },
  { name: 'Estados Unidos (LA)', flag: '🇺🇸', ping: 40 },
  { name: 'Reino Unido', flag: '🇬🇧', ping: 45 },
  { name: 'Alemania', flag: '🇩🇪', ping: 50 },
  { name: 'España', flag: '🇪🇸', ping: 52 },
  { name: 'Francia', flag: '🇫🇷', ping: 55 },
  { name: 'Canadá', flag: '🇨🇦', ping: 35 },
  { name: 'Brasil', flag: '🇧🇷', ping: 80 },
  { name: 'México', flag: '🇲🇽', ping: 75 },
  { name: 'Argentina', flag: '🇦🇷', ping: 95 },
  { name: 'Chile', flag: '🇨🇱', ping: 90 },
  { name: 'Colombia', flag: '🇨🇴', ping: 85 },
  { name: 'Japón', flag: '🇯🇵', ping: 120 },
  { name: 'Singapur', flag: '🇸🇬', ping: 130 },
  { name: 'Australia', flag: '🇦🇺', ping: 150 },
  { name: 'Sudáfrica', flag: '🇿🇦', ping: 180 },
];

export default function ServerSelectionScreen({ navigation }) {
  const sortedServers = useMemo(() => servers.sort((a, b) => a.ping - b.ping), []);

  const getPingColor = (ping) => {
    if (ping < 50) return colors.success;
    if (ping < 150) return colors.warning;
    return colors.error;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.serverItem}
      onPress={() => {
        navigation.navigate('Main', { selectedServer: item });
      }}
    >
      <View style={styles.serverInfo}>
        <Text style={styles.flag}>{item.flag}</Text>
        <Text style={styles.serverName}>{item.name}</Text>
      </View>
      <View style={styles.pingInfo}>
        <Text style={[styles.pingText, { color: getPingColor(item.ping) }]}>
          {item.ping} ms
        </Text>
        <Ionicons name="cellular" size={20} color={getPingColor(item.ping)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={colors.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Servidor</Text>
          <View style={{ width: 28 }} />
        </View>
        <FlatList
          data={sortedServers}
          renderItem={renderItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContent}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkGray,
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
  headerTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  serverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
    marginRight: 15,
  },
  serverName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '500',
  },
  pingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pingText: {
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
  },
}); 