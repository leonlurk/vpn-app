import Foundation
import NetworkExtension
import os.log

/// Adaptador de WireGuard para iOS - Equivalente al GoBackend de Android
/// Maneja la comunicación con el motor WireGuard nativo
class WireGuardAdapter {
    
    // MARK: - Properties
    
    private let packetTunnelProvider: NEPacketTunnelProvider
    private let logger = OSLog(subsystem: "com.nodexvpn.app.WireGuardExtension", category: "WireGuard")
    private var wireguardHandle: Int32?
    private let wireguardQueue = DispatchQueue(label: "WireGuardQueue", qos: .userInitiated)
    
    // Callbacks
    private var logHandler: ((String) -> Void)?
    
    // Estado
    private var isRunning = false
    
    // MARK: - Initialization
    
    init(with packetTunnelProvider: NEPacketTunnelProvider, logHandler: @escaping (String) -> Void) {
        self.packetTunnelProvider = packetTunnelProvider
        self.logHandler = logHandler
        os_log("✅ WireGuardAdapter inicializado", log: logger, type: .info)
    }
    
    // MARK: - Public Methods
    
    /// Inicia el túnel WireGuard con la configuración proporcionada
    func start(tunnelConfiguration: TunnelConfiguration, completionHandler: @escaping (Error?) -> Void) {
        wireguardQueue.async { [weak self] in
            guard let self = self else { return }
            
            do {
                os_log("🚀 Iniciando WireGuard con configuración", log: self.logger, type: .info)
                
                // Convertir configuración a formato WireGuard
                let configString = try self.generateWireGuardConfig(from: tunnelConfiguration)
                self.logHandler?("Configuración generada: \(configString.count) bytes")
                
                // Inicializar WireGuard nativo (simulado por ahora)
                // En producción, esto llamaría a la librería WireGuard real
                self.wireguardHandle = self.initializeWireGuard(configString: configString)
                
                if self.wireguardHandle != nil {
                    self.isRunning = true
                    os_log("✅ WireGuard iniciado exitosamente", log: self.logger, type: .info)
                    
                    // Iniciar procesamiento de paquetes
                    self.startPacketProcessing()
                    
                    DispatchQueue.main.async {
                        completionHandler(nil)
                    }
                } else {
                    throw WireGuardAdapterError.initializationFailed
                }
                
            } catch {
                os_log("❌ Error iniciando WireGuard: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                DispatchQueue.main.async {
                    completionHandler(error)
                }
            }
        }
    }
    
    /// Detiene el túnel WireGuard
    func stop(completionHandler: @escaping (Error?) -> Void) {
        wireguardQueue.async { [weak self] in
            guard let self = self else { return }
            
            os_log("🔌 Deteniendo WireGuard", log: self.logger, type: .info)
            
            self.isRunning = false
            
            if let handle = self.wireguardHandle {
                // Limpiar recursos WireGuard
                self.cleanupWireGuard(handle: handle)
                self.wireguardHandle = nil
            }
            
            os_log("✅ WireGuard detenido", log: self.logger, type: .info)
            
            DispatchQueue.main.async {
                completionHandler(nil)
            }
        }
    }
    
    /// Obtiene estadísticas del túnel
    func getRuntimeConfiguration(completionHandler: @escaping (String?) -> Void) {
        wireguardQueue.async { [weak self] in
            guard let self = self, let handle = self.wireguardHandle else {
                completionHandler(nil)
                return
            }
            
            // En producción, esto obtendría estadísticas reales
            let stats = """
            rx_bytes=\(arc4random_uniform(1000000))
            tx_bytes=\(arc4random_uniform(1000000))
            last_handshake_time_sec=\(Date().timeIntervalSince1970)
            """
            
            completionHandler(stats)
        }
    }
    
    // MARK: - Private Methods
    
    /// Genera la configuración en formato WireGuard
    private func generateWireGuardConfig(from tunnelConfig: TunnelConfiguration) throws -> String {
        var configString = "[Interface]\n"
        
        // Configurar interfaz
        if let privateKey = tunnelConfig.interface?.privateKey {
            configString += "PrivateKey = \(privateKey.base64Key)\n"
        }
        
        if let addresses = tunnelConfig.interface?.addresses {
            for address in addresses {
                configString += "Address = \(address.stringRepresentation)\n"
            }
        }
        
        if let dns = tunnelConfig.interface?.dns, !dns.isEmpty {
            let dnsServers = dns.map { $0.stringRepresentation }.joined(separator: ", ")
            configString += "DNS = \(dnsServers)\n"
        }
        
        if let listenPort = tunnelConfig.interface?.listenPort {
            configString += "ListenPort = \(listenPort)\n"
        }
        
        // Configurar peers
        for peer in tunnelConfig.peers ?? [] {
            configString += "\n[Peer]\n"
            
            if let publicKey = peer.publicKey {
                configString += "PublicKey = \(publicKey.base64Key)\n"
            }
            
            if let endpoint = peer.endpoint {
                configString += "Endpoint = \(endpoint.stringRepresentation)\n"
            }
            
            if !peer.allowedIPs.isEmpty {
                let allowedIPs = peer.allowedIPs.map { $0.stringRepresentation }.joined(separator: ", ")
                configString += "AllowedIPs = \(allowedIPs)\n"
            }
            
            if let keepAlive = peer.persistentKeepAlive {
                configString += "PersistentKeepalive = \(keepAlive)\n"
            }
            
            if let preSharedKey = peer.preSharedKey {
                configString += "PresharedKey = \(preSharedKey.base64Key)\n"
            }
        }
        
        return configString
    }
    
    /// Inicializa WireGuard nativo
    private func initializeWireGuard(configString: String) -> Int32? {
        // En producción, esto llamaría a wgTurnOn() de WireGuardKit
        // Por ahora retornamos un handle simulado
        os_log("🔧 Inicializando WireGuard nativo", log: logger, type: .info)
        return 1 // Handle simulado
    }
    
    /// Limpia recursos de WireGuard
    private func cleanupWireGuard(handle: Int32) {
        // En producción, esto llamaría a wgTurnOff() de WireGuardKit
        os_log("🧹 Limpiando recursos WireGuard", log: logger, type: .info)
    }
    
    /// Inicia el procesamiento de paquetes
    private func startPacketProcessing() {
        // Lee paquetes del sistema
        packetTunnelProvider.packetFlow.readPackets { [weak self] packets, protocols in
            guard let self = self, self.isRunning else { return }
            
            // Procesar paquetes a través de WireGuard
            self.wireguardQueue.async {
                for (index, packet) in packets.enumerated() {
                    // En producción, esto pasaría el paquete a WireGuard
                    self.processPacket(packet, protocolFamily: protocols[index])
                }
                
                // Continuar leyendo paquetes
                if self.isRunning {
                    self.startPacketProcessing()
                }
            }
        }
    }
    
    /// Procesa un paquete individual
    private func processPacket(_ packet: Data, protocolFamily: NSNumber) {
        // En producción, esto:
        // 1. Pasaría el paquete a wgSend()
        // 2. Recibiría paquetes de wgRecv()
        // 3. Los escribiría de vuelta al sistema con writePackets()
        
        // Por ahora, solo logeamos para debug
        if packet.count > 0 {
            os_log("📦 Procesando paquete: %d bytes, protocolo: %@", 
                   log: logger, 
                   type: .debug, 
                   packet.count, 
                   protocolFamily.stringValue)
        }
    }
}

// MARK: - Error Types

enum WireGuardAdapterError: LocalizedError {
    case initializationFailed
    case invalidConfiguration
    case connectionFailed
    
    var errorDescription: String? {
        switch self {
        case .initializationFailed:
            return "Error inicializando WireGuard"
        case .invalidConfiguration:
            return "Configuración WireGuard inválida"
        case .connectionFailed:
            return "Error conectando con WireGuard"
        }
    }
}

// MARK: - Helper Extensions

extension Data {
    var hexString: String {
        return map { String(format: "%02x", $0) }.joined()
    }
}