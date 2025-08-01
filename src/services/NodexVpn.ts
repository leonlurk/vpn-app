/**
 * WIREGUARD VPN - Reemplaza el protocolo Nodex para compatibilidad móvil
 * 
 * Integra WireGuard nativo en iOS/Android manteniendo la misma API
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// Importar módulo nativo de WireGuard REAL (GoBackend)
const WireGuardNative = NativeModules.RealWireGuardModule || {};
const eventEmitter = new NativeEventEmitter(WireGuardNative);

// Configuración WireGuard
export interface WireGuardConfig {
  name: string;
  privateKey: string;
  addresses: string[];
  dns?: string[];
  peers: WireGuardPeer[];
}

export interface WireGuardPeer {
  publicKey: string;
  endpoint: string;
  allowedIPs: string[];
  persistentKeepalive?: number;
}

// Configuración legacy (compatible)
export interface VpnConfig {
  serverAddress: string;
  serverPort: number;
  authToken: string;
}

// Estados de conexión
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'disconnecting' | 'error';

// Eventos
export interface VpnConnectionEvent {
  status: ConnectionState;
  error?: string;
}

export interface VpnStatsEvent {
  bytesReceived: number;
  bytesSent: number;
  ping: number;
}

export interface VpnErrorEvent {
  message: string;
  code?: number;
}

/**
 * CLASE PRINCIPAL - WireGuard VPN
 */
class WireGuardVPN {
  private currentConfig: WireGuardConfig | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private listeners: { [key: string]: Function[] } = {
    connection: [],
    stats: [],
    error: []
  };

  constructor() {
    this.setupNativeListeners();
  }

  /**
   * Configurar listeners nativos
   */
  private setupNativeListeners() {
    // Listener para cambios de estado
    eventEmitter.addListener('WireGuardStateChanged', (event: VpnConnectionEvent) => {
      this.connectionState = event.status;
      this.notifyListeners('connection', event);
    });

    // Listener para estadísticas
    eventEmitter.addListener('WireGuardStats', (stats: VpnStatsEvent) => {
      this.notifyListeners('stats', stats);
    });

    // Listener para errores
    eventEmitter.addListener('WireGuardError', (error: VpnErrorEvent) => {
      this.connectionState = 'error';
      this.notifyListeners('error', error);
      this.notifyListeners('connection', { status: 'error', error: error.message });
    });
  }

  /**
   * Solicitar permisos VPN
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await WireGuardNative.requestVPNPermission();
      } else if (Platform.OS === 'android') {
        return await WireGuardNative.requestVpnPermission();
      }
      return false;
    } catch (error) {
      console.error('Error solicitando permisos VPN:', error);
      return false;
    }
  }

  /**
   * Conectar usando configuración legacy (adaptador)
   */
  async connect(legacyConfig: VpnConfig): Promise<void> {
    try {
      // Obtener configuración WireGuard del servidor
      const wireGuardConfig = await this.fetchWireGuardConfig(legacyConfig);
      return this.connectWithWireGuard(wireGuardConfig);
    } catch (error) {
      throw new Error(`Error conectando VPN: ${error}`);
    }
  }

  /**
   * Obtener configuración WireGuard del servidor
   */
  private async fetchWireGuardConfig(legacyConfig: VpnConfig): Promise<WireGuardConfig> {
    const response = await fetch(`http://${legacyConfig.serverAddress}:3000/api/vpn/wireguard-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'mobile-user-' + Date.now()
      })
    });

    if (!response.ok) {
      throw new Error('Error obteniendo configuración del servidor');
    }

    const data = await response.json();
    
    console.log('🔍 RESPUESTA COMPLETA DEL SERVIDOR:', JSON.stringify(data, null, 2));
    
    if (!data.success) {
      throw new Error(data.error || 'Error en la respuesta del servidor');
    }

    // ✅ MEJORAR: Verificar múltiples ubicaciones posibles de la configuración
    let configString = null;
    
    if (data.data && data.data.config) {
      configString = data.data.config;
      console.log('📋 Configuración encontrada en data.data.config');
    } else if (data.config) {
      configString = data.config;
      console.log('📋 Configuración encontrada en data.config');
    } else if (data.data) {
      configString = data.data;
      console.log('📋 Configuración encontrada en data.data (directo)');
    }

    console.log('📋 Configuración del servidor recibida:', configString);
    console.log('📋 Tipo de configuración:', typeof configString);

    if (!configString || typeof configString !== 'string') {
      console.error('❌ ESTRUCTURA DE RESPUESTA INESPERADA:', data);
      throw new Error('Configuración del servidor no válida: ' + (configString ? typeof configString : 'undefined'));
    }

    // Tu backend ya devuelve la configuración WireGuard como texto
    // Parsear la configuración del servidor a formato WireGuard
    return this.parseServerConfig(configString, legacyConfig.serverAddress);
  }

  /**
   * Parsear configuración del servidor
   */
  private parseServerConfig(configString: string, serverAddress: string): WireGuardConfig {
    try {
      console.log('🔍 Parseando configuración del servidor...');
      console.log('🔍 Config string recibido:', configString);
      console.log('🔍 Tipo de config string:', typeof configString);
      console.log('🔍 Longitud del config string:', configString ? configString.length : 'N/A');
      
      // ✅ VALIDACIÓN ADICIONAL
      if (!configString) {
        throw new Error('Config string es null o undefined');
      }
      
      if (typeof configString !== 'string') {
        throw new Error(`Config string debe ser string, recibido: ${typeof configString}`);
      }
      
      if (configString.trim().length === 0) {
        throw new Error('Config string está vacío');
      }
      
    const lines = configString.split('\n');
    const config: Partial<WireGuardConfig> = {
      name: 'NodexVPN',
      addresses: [],
      dns: [],
      peers: []
    };

    let currentSection = '';
    let currentPeer: Partial<WireGuardPeer> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[Interface]')) {
        currentSection = 'interface';
      } else if (trimmed.startsWith('[Peer]')) {
        if (currentPeer.publicKey) {
          config.peers!.push(currentPeer as WireGuardPeer);
        }
        currentSection = 'peer';
        currentPeer = {};
      } else if (trimmed.includes('=')) {
        const equalIndex = trimmed.indexOf('=');
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        
        if (currentSection === 'interface') {
          switch (key) {
            case 'PrivateKey':
              config.privateKey = value;
              break;
            case 'Address':
              config.addresses = [value];
              break;
            case 'DNS':
              config.dns = value.split(',').map(s => s.trim());
              break;
          }
        } else if (currentSection === 'peer') {
          switch (key) {
            case 'PublicKey':
              currentPeer.publicKey = value;
              break;
            case 'Endpoint':
              currentPeer.endpoint = value;
              break;
            case 'AllowedIPs':
              currentPeer.allowedIPs = value.split(',').map(s => s.trim());
              break;
            case 'PersistentKeepalive':
              currentPeer.persistentKeepalive = parseInt(value);
              break;
          }
        }
      }
    }

    // Agregar último peer
    if (currentPeer.publicKey) {
      config.peers!.push(currentPeer as WireGuardPeer);
    }

    console.log('🔍 Configuración parseada exitosamente:', config);
    return config as WireGuardConfig;
    
    } catch (error) {
      console.error('❌ Error parseando configuración del servidor:', error);
      throw new Error(`Error parseando configuración: ${error}`);
    }
  }

  /**
   * Conectar con configuración WireGuard
   */
  async connectWithWireGuard(config: WireGuardConfig): Promise<void> {
    try {
      console.log('🔌 Iniciando conexión WireGuard...');
      this.currentConfig = config;
      this.connectionState = 'connecting';
      
      this.notifyListeners('connection', { status: 'connecting' });

      // Convertir configuración WireGuard al formato esperado por RealWireGuardModule
      console.log('🔌 Convirtiendo configuración...');
      const moduleConfig = this.convertToModuleConfig(config);
      
      console.log('🔧 Configuración para módulo nativo:', moduleConfig);

      // Verificar que WireGuardNative esté disponible
      if (!WireGuardNative || !WireGuardNative.connect) {
        throw new Error('Módulo WireGuard nativo no disponible');
      }

      // Primero probar un método básico del módulo
      try {
        console.log('🔌 Probando método getStatus...');
        const status = await WireGuardNative.getStatus();
        console.log('🔌 Status del módulo:', status);
      } catch (statusError) {
        console.warn('⚠️ Warning: getStatus falló:', statusError);
      }

      console.log('🔌 Llamando módulo nativo connect...');
      // Conectar usando módulo nativo RealWireGuardModule
      const result = await WireGuardNative.connect(moduleConfig);
      console.log('🔌 Módulo nativo RealWireGuardModule respondió exitosamente:', result);
      
      // ✅ ACTUALIZAR ESTADO: El módulo simplificado no envía eventos automáticos
      this.connectionState = 'connected';
      console.log('✅ VPN conectado exitosamente con módulo simplificado');
      
      // Notificar a los listeners que la conexión está activa
      this.notifyListeners('connection', { 
        status: 'connected',
        message: 'VPN conectado exitosamente'
      });
      
      console.log('🚀 VPN real activado');
      
    } catch (error) {
      console.error('❌ Error en connectWithWireGuard:', error);
      this.connectionState = 'error';
      
      // Notificar error a los listeners
      this.notifyListeners('connection', { 
        status: 'error', 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Convertir configuración WireGuard al formato del módulo nativo
   */
  private convertToModuleConfig(config: WireGuardConfig): any {
    console.log('🔧 Convirtiendo configuración WireGuard:', config);
    
    if (!config.peers || config.peers.length === 0) {
      throw new Error('No hay peers en la configuración WireGuard');
    }
    
    const peer = config.peers[0]; // Tomar el primer peer
    console.log('🔧 Peer seleccionado:', peer);
    
    const moduleConfig = {
      Interface: {
        PrivateKey: config.privateKey,
        Address: config.addresses[0],
        DNS: config.dns?.join(',') || '8.8.8.8'
      },
      Peer: {
        PublicKey: peer.publicKey,
        Endpoint: peer.endpoint,
        AllowedIPs: peer.allowedIPs.join(','),
        PersistentKeepalive: peer.persistentKeepalive?.toString() || '25'
      }
    };
    
    console.log('🔧 Configuración para módulo nativo:', moduleConfig);
    return moduleConfig;
  }

  /**
   * Desconectar VPN
   */
  async disconnect(): Promise<void> {
    try {
      console.log('🔌 Desconectando VPN...');
      
      // Actualizar estado inmediatamente
      this.connectionState = 'disconnecting';
      this.notifyListeners('connection', { status: 'disconnecting' });

      if (WireGuardNative && WireGuardNative.disconnect) {
        const result = await WireGuardNative.disconnect();
        console.log('🔌 Módulo nativo disconnect respondió:', result);
      }
      
      // ✅ ACTUALIZAR ESTADO: Confirmar desconexión
      this.connectionState = 'disconnected';
      console.log('✅ VPN desconectado exitosamente');
      
      // Notificar a los listeners
      this.notifyListeners('connection', { 
        status: 'disconnected',
        message: 'VPN desconectado'
      });

    } catch (error) {
      console.error('❌ Error desconectando VPN:', error);
      this.connectionState = 'error';
      
      // Notificar error pero asumir desconectado
      this.notifyListeners('connection', { 
        status: 'error', 
        error: error.message 
      });
      
      throw error;
    }
  }

  /**
   * Probar servidor
   */
  async testServer(address: string, port: number): Promise<{ reachable: boolean; ping: number }> {
    try {
      const startTime = Date.now();
      const response = await fetch(`http://${address}:3000/health`, {
        method: 'GET'
      });
      const ping = Date.now() - startTime;
      
      return {
        reachable: response.ok,
        ping
      };
    } catch (error) {
      return {
        reachable: false,
        ping: 999
      };
    }
  }

  /**
   * Obtener estado actual
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Agregar listener
   */
  addConnectionListener(callback: (event: VpnConnectionEvent) => void): void {
    this.listeners.connection.push(callback);
  }

  addStatsListener(callback: (stats: VpnStatsEvent) => void): void {
    this.listeners.stats.push(callback);
  }

  addErrorListener(callback: (error: VpnErrorEvent) => void): void {
    this.listeners.error.push(callback);
  }

  /**
   * Remover listeners
   */
  removeAllListeners(): void {
    this.listeners = {
      connection: [],
      stats: [],
      error: []
    };
  }

  /**
   * Notificar listeners
   */
  private notifyListeners(type: string, data: any): void {
    if (this.listeners[type]) {
      this.listeners[type].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener ${type}:`, error);
        }
      });
    }
  }
}

// Instancia singleton
const wireGuardVPN = new WireGuardVPN();

// Exportar con la misma API que antes (compatibilidad)
export default {
  // Métodos principales
  connect: (config: VpnConfig) => wireGuardVPN.connect(config),
  disconnect: () => wireGuardVPN.disconnect(),
  requestPermissions: () => wireGuardVPN.requestPermissions(),
  testServer: (address: string, port: number) => wireGuardVPN.testServer(address, port),
  
  // Listeners
  addConnectionListener: (callback: (event: VpnConnectionEvent) => void) => wireGuardVPN.addConnectionListener(callback),
  addStatsListener: (callback: (stats: VpnStatsEvent) => void) => wireGuardVPN.addStatsListener(callback),
  addErrorListener: (callback: (error: VpnErrorEvent) => void) => wireGuardVPN.addErrorListener(callback),
  removeAllListeners: () => wireGuardVPN.removeAllListeners(),
  
  // Estado
  getConnectionState: () => wireGuardVPN.getConnectionState()
};

// Los tipos ya están definidos arriba, no necesitamos exportarlos de nuevo 