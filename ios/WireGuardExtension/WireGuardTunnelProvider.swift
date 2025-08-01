import NetworkExtension
import WireGuardKit

class WireGuardTunnelProvider: NEPacketTunnelProvider {
    
    private var adapter: WireGuardAdapter?
    private var tunnelConfiguration: TunnelConfiguration?
    
    override func startTunnel(options: [String : NSObject]?, 
                             completionHandler: @escaping (Error?) -> Void) {
        
        os_log("🚀 Iniciando túnel WireGuard iOS...", log: OSLog.default, type: .info)
        
        guard let protocolConfiguration = self.protocolConfiguration as? NETunnelProviderProtocol,
              let configData = protocolConfiguration.providerConfiguration?["wg-quick-config"] as? String else {
            os_log("❌ No se encontró configuración WireGuard", log: OSLog.default, type: .error)
            completionHandler(TunnelError.invalidConfiguration)
            return
        }
        
        do {
            // Parsear configuración WireGuard
            self.tunnelConfiguration = try TunnelConfiguration(fromWgQuickConfig: configData)
            
            guard let tunnelConfig = self.tunnelConfiguration else {
                completionHandler(TunnelError.invalidConfiguration)
                return
            }
            
            // Crear adaptador WireGuard
            self.adapter = WireGuardAdapter(with: self) { logLevel, message in
                os_log("WireGuard: %{public}@", log: OSLog.default, type: .info, message)
            }
            
            // Configurar interfaz de red
            self.configureNetworkInterface(tunnelConfig: tunnelConfig) { [weak self] error in
                if let error = error {
                    os_log("❌ Error configurando interfaz: %{public}@", log: OSLog.default, type: .error, error.localizedDescription)
                    completionHandler(error)
                    return
                }
                
                // Iniciar adaptador WireGuard
                self?.adapter?.start(tunnelConfiguration: tunnelConfig) { error in
                    if let error = error {
                        os_log("❌ Error iniciando WireGuard: %{public}@", log: OSLog.default, type: .error, error.localizedDescription)
                        completionHandler(error)
                    } else {
                        os_log("✅ WireGuard iOS iniciado exitosamente", log: OSLog.default, type: .info)
                        completionHandler(nil)
                    }
                }
            }
            
        } catch {
            os_log("❌ Error parseando configuración: %{public}@", log: OSLog.default, type: .error, error.localizedDescription)
            completionHandler(error)
        }
    }
    
    override func stopTunnel(with reason: NEProviderStopReason, 
                            completionHandler: @escaping () -> Void) {
        
        os_log("🔌 Deteniendo túnel WireGuard iOS...", log: OSLog.default, type: .info)
        
        adapter?.stop { [weak self] error in
            if let error = error {
                os_log("❌ Error deteniendo WireGuard: %{public}@", log: OSLog.default, type: .error, error.localizedDescription)
            } else {
                os_log("✅ WireGuard iOS detenido", log: OSLog.default, type: .info)
            }
            
            self?.adapter = nil
            self?.tunnelConfiguration = nil
            completionHandler()
        }
    }
    
    override func handleAppMessage(_ messageData: Data, 
                                  completionHandler: ((Data?) -> Void)?) {
        // Manejar mensajes de la app principal si es necesario
        completionHandler?(nil)
    }
    
    override func sleep(completionHandler: @escaping () -> Void) {
        os_log("😴 VPN entrando en modo suspensión", log: OSLog.default, type: .info)
        completionHandler()
    }
    
    override func wake() {
        os_log("🌅 VPN despertando de suspensión", log: OSLog.default, type: .info)
    }
    
    // MARK: - Private Methods
    
    private func configureNetworkInterface(tunnelConfig: TunnelConfiguration, 
                                         completion: @escaping (Error?) -> Void) {
        
        let networkSettings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "127.0.0.1")
        
        // Configurar direcciones IP
        if let interface = tunnelConfig.interface {
            let addresses = interface.addresses.map { $0.address.stringRepresentation }
            let subnets = interface.addresses.map { address in
                NEIPv4Route(destinationAddress: address.address.stringRepresentation, 
                           subnetMask: address.networkPrefixLength.netmask)
            }
            
            let ipv4Settings = NEIPv4Settings(addresses: addresses, subnetMasks: subnets.map { $0.subnetMask })
            ipv4Settings.includedRoutes = subnets
            
            // Configurar rutas completas (todo el tráfico)
            ipv4Settings.includedRoutes = [NEIPv4Route.default()]
            
            networkSettings.ipv4Settings = ipv4Settings
            
            // Configurar DNS
            if !interface.dns.isEmpty {
                let dnsSettings = NEDNSSettings(servers: interface.dns.map { $0.stringRepresentation })
                networkSettings.dnsSettings = dnsSettings
            }
        }
        
        // Configurar MTU
        networkSettings.mtu = NSNumber(value: 1420)
        
        // Aplicar configuración
        self.setTunnelNetworkSettings(networkSettings) { error in
            if let error = error {
                os_log("❌ Error configurando red: %{public}@", log: OSLog.default, type: .error, error.localizedDescription)
            } else {
                os_log("✅ Configuración de red aplicada", log: OSLog.default, type: .info)
            }
            completion(error)
        }
    }
}

// MARK: - Error Types

enum TunnelError: Error {
    case invalidConfiguration
    case adapterNotFound
    
    var localizedDescription: String {
        switch self {
        case .invalidConfiguration:
            return "Configuración WireGuard inválida"
        case .adapterNotFound:
            return "Adaptador WireGuard no encontrado"
        }
    }
}

// MARK: - Network Prefix Extensions

extension UInt8 {
    var netmask: String {
        let mask = (0xFFFFFFFF as UInt32) << (32 - self)
        return String(format: "%d.%d.%d.%d",
                     (mask >> 24) & 0xFF,
                     (mask >> 16) & 0xFF,
                     (mask >> 8) & 0xFF,
                     mask & 0xFF)
    }
} 