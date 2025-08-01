/**
 * VPN INTEGRATION - Adaptador para frontend existente
 * 
 * Integra el VPN Nodex 100% propio con la UI existente de MainScreen.
 * Proporciona una interfaz compatible con el código actual.
 */

import NodexVPN, { 
  VpnConfig, 
  ConnectionState, 
  VpnConnectionEvent,
  VpnStatsEvent,
  VpnErrorEvent 
} from './NodexVpn';

// Servidor real en producción
const DEMO_SERVERS = [
  { 
    id: 'sa-brazil', 
    name: 'Nodex VPN (Brasil)', 
    flag: '🇧🇷', 
    address: '92.113.32.217', 
    port: 51820,
    ping: 25,
    publicKey: 'mzbRqonSUE52WbcP1ti6WGhwbZWicxNs5fWG+zsryjY='
  }
];

export interface Server {
  id: string;
  name: string;
  flag: string;
  address: string;
  port: number;
  ping: number;
  publicKey?: string;
}

export interface VpnStatus {
  isConnected: boolean;
  isConnecting: boolean;
  currentServer: Server | null;
  connectionTime: number;
  error: string | null;
}

export interface VpnStats {
  speed: string;
  ping: number;
  bytesReceived: number;
  bytesSent: number;
  connectionTime: number;
}

/**
 * CLASE PRINCIPAL DE INTEGRACIÓN VPN
 */
class VpnIntegrationService {
  private status: VpnStatus = {
    isConnected: false,
    isConnecting: false,
    currentServer: null,
    connectionTime: 0,
    error: null
  };

  private stats: VpnStats = {
    speed: '0 MB/s',
    ping: 0,
    bytesReceived: 0,
    bytesSent: 0,
    connectionTime: 0
  };

  private connectionStartTime: number = 0;
  private statusListeners: ((status: VpnStatus) => void)[] = [];
  private statsListeners: ((stats: VpnStats) => void)[] = [];
  private connectionMonitorInterval: NodeJS.Timeout | null = null;

  // JWT Token de ejemplo - en producción obtener del login
  private authToken: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMTIzIiwiaWF0IjoxNTE2MjM5MDIyfQ.example';

  constructor() {
    this.setupVpnListeners();
  }

  /**
   * Monitorear conexión con el backend
   */
  private startConnectionMonitoring() {
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }

    this.connectionMonitorInterval = setInterval(async () => {
      if (!this.status.isConnected || !this.status.currentServer) {
        return;
      }

      try {
        console.log('🔍 Verificando conexión con backend...');
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`http://${this.status.currentServer.address}:3000/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Backend respondió con código: ${response.status}`);
        }

        const endTime = Date.now();
        console.log(`✅ Backend responde OK (${endTime - startTime}ms)`);
        
      } catch (error) {
        console.error('❌ Backend no responde, desconectando VPN:', error);
        await this.handleBackendDisconnection();
      }
    }, 10000); // Verificar cada 10 segundos
  }

  private async handleBackendDisconnection() {
    console.log('🚨 Desconectando VPN por pérdida de backend...');
    
    // Detener monitoreo
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }

    // Desconectar VPN
    try {
      await NodexVPN.disconnect();
    } catch (error) {
      console.error('Error desconectando VPN:', error);
    }

    // Actualizar estado
    this.status.isConnected = false;
    this.status.isConnecting = false;
    this.status.currentServer = null;
    this.status.error = 'Conexión con servidor perdida';
    this.connectionStartTime = 0;
    
    this.notifyStatusListeners();
  }

  /**
   * Configurar listeners del módulo VPN nativo
   */
  private setupVpnListeners() {
    // Listener para cambios de estado de conexión
    NodexVPN.addConnectionListener((event: VpnConnectionEvent) => {
      console.log('VPN Connection Event:', event);
      this.handleConnectionEvent(event);
    });

    // Listener para estadísticas
    NodexVPN.addStatsListener((stats: VpnStatsEvent) => {
      this.updateStats(stats);
    });

    // Listener para errores
    NodexVPN.addErrorListener((error: VpnErrorEvent) => {
      console.error('VPN Error:', error);
      this.status.error = error.message;
      this.status.isConnecting = false;
      this.notifyStatusListeners();
    });
  }

  /**
   * Maneja eventos de conexión del VPN nativo
   */
  private handleConnectionEvent(event: VpnConnectionEvent) {
    switch (event.status) {
      case 'connected':
        this.status.isConnected = true;
        this.status.isConnecting = false;
        this.status.error = null;
        this.connectionStartTime = Date.now();
        break;

      case 'disconnected':
        this.status.isConnected = false;
        this.status.isConnecting = false;
        this.status.currentServer = null;
        this.connectionStartTime = 0;
        break;

      case 'error':
        this.status.isConnected = false;
        this.status.isConnecting = false;
        this.status.error = 'Error de conexión VPN';
        break;
    }

    this.notifyStatusListeners();
  }

  /**
   * Actualiza estadísticas
   */
  private updateStats(nativeStats: VpnStatsEvent) {
    // Calcular velocidad (aproximada)
    const speedMbps = (nativeStats.bytesReceived / 1024 / 1024) || 0;
    
    this.stats = {
      speed: speedMbps > 0 ? `${speedMbps.toFixed(1)} MB/s` : '--',
      ping: nativeStats.ping || (this.status.currentServer?.ping || 0),
      bytesReceived: nativeStats.bytesReceived,
      bytesSent: nativeStats.bytesSent,
      connectionTime: this.connectionStartTime > 0 ? Date.now() - this.connectionStartTime : 0
    };

    this.notifyStatsListeners();
  }

  /**
   * MÉTODOS PÚBLICOS - Compatible con MainScreen existente
   */

  /**
   * Conectar al VPN
   */
  async connect(server: Server): Promise<void> {
    try {
      console.log('🚀 Iniciando conexión VPN...');
      console.log('Iniciando conexión VPN a:', server.name);

      this.status.isConnecting = true;
      this.status.currentServer = server;
      this.status.error = null;
      this.notifyStatusListeners();

      // Obtener configuración WireGuard del servidor real
      const response = await fetch(`http://${server.address}:3000/api/vpn/wireguard-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-' + Date.now() // ID único para este usuario
        })
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error obteniendo configuración');
      }

      console.log('Configuración WireGuard obtenida del servidor');

      // Configurar conexión con datos reales del servidor
      const config: VpnConfig = {
        serverAddress: server.address,
        serverPort: server.port || 51820,
        authToken: this.authToken
      };

      // ACTIVAR VPN REAL:
      console.log('🚀 MODO REAL: Conectando VPN...');
      
      try {
        await NodexVPN.connect(config);
        console.log('🚀 VPN real activado');
        
        // Iniciar monitoreo de la conexión con el backend
        console.log('🔍 Iniciando monitoreo de backend...');
        this.startConnectionMonitoring();
        
      } catch (vpnError: any) {
        if (vpnError.code === 'PERMISSION_REQUIRED') {
          console.log('📋 Permisos VPN requeridos - solicitando...');
          // Los permisos ya se solicitaron automáticamente, informar al usuario
          throw new Error('Aprueba los permisos VPN e intenta conectar nuevamente');
        } else {
          throw vpnError;
        }
      }
      
      // COMENTADO - YA NO SIMULAMOS:
      // console.log('🧪 MODO DEBUG: Simulando conexión VPN exitosa...');
      // await new Promise(resolve => setTimeout(resolve, 2000));
      // this.status.isConnected = true;
      // this.status.isConnecting = false;
      // this.status.error = null;
      // this.connectionStartTime = Date.now();
      // this.notifyStatusListeners();

    } catch (error) {
      console.error('Error conectando VPN:', error);
      this.status.isConnecting = false;
      this.status.error = error instanceof Error ? error.message : 'Error desconocido';
      this.notifyStatusListeners();
      throw error;
    }
  }

  /**
   * Desconectar del VPN
   */
  async disconnect(): Promise<void> {
    try {
      console.log('Desconectando VPN...');
      
      // Detener monitoreo
      if (this.connectionMonitorInterval) {
        clearInterval(this.connectionMonitorInterval);
        this.connectionMonitorInterval = null;
        console.log('🔍 Monitoreo de backend detenido');
      }
      
      await NodexVPN.disconnect();
    } catch (error) {
      console.error('Error desconectando VPN:', error);
      throw error;
    }
  }

  /**
   * Alternar conexión (compatible con MainScreen)
   */
  async toggle(server: Server): Promise<void> {
    if (this.status.isConnected) {
      await this.disconnect();
    } else {
      await this.connect(server);
    }
  }

  /**
   * Obtener estado actual
   */
  getStatus(): VpnStatus {
    return { ...this.status };
  }

  /**
   * Obtener estadísticas actuales
   */
  getStats(): VpnStats {
    return { ...this.stats };
  }

  /**
   * Obtener lista de servidores
   */
  getServers(): Server[] {
    return [...DEMO_SERVERS];
  }

  /**
   * Probar conectividad de servidor
   */
  async testServer(server: Server): Promise<{ ping: number; reachable: boolean }> {
    try {
      // Probar endpoint de health del servidor
      const startTime = Date.now();
      const response = await fetch(`http://${server.address}:3000/health`, {
        method: 'GET'
      });
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        return {
          ping: endTime - startTime,
          reachable: true
        };
      } else {
        return {
          ping: -1,
          reachable: false
        };
      }
    } catch (error) {
      console.error('Error probando servidor:', error);
      return {
        ping: -1,
        reachable: false
      };
    }
  }

  /**
   * LISTENERS
   */

  addStatusListener(listener: (status: VpnStatus) => void): () => void {
    this.statusListeners.push(listener);
    return () => {
      const index = this.statusListeners.indexOf(listener);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  addStatsListener(listener: (stats: VpnStats) => void): () => void {
    this.statsListeners.push(listener);
    return () => {
      const index = this.statsListeners.indexOf(listener);
      if (index > -1) {
        this.statsListeners.splice(index, 1);
      }
    };
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private notifyStatsListeners() {
    this.statsListeners.forEach(listener => listener(this.stats));
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    this.statusListeners = [];
    this.statsListeners = [];
    NodexVPN.removeAllListeners();
  }
}

// Instancia singleton
const VpnIntegration = new VpnIntegrationService();

export default VpnIntegration;

// Exportar tipos adicionales
export type {
  VpnIntegrationService,
  Server as ServerType,
  VpnStatus as VpnStatusType,
  VpnStats as VpnStatsType
}; 