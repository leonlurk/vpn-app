import NetworkExtension
import os.log

class WireGuardTunnelProvider: NEPacketTunnelProvider {
    
    private var adapter: WireGuardAdapter?
    private var tunnelConfiguration: TunnelConfiguration?
    private let logger = OSLog(subsystem: "com.nodexvpn.app.WireGuardExtension", category: "TunnelProvider")
    
    override func startTunnel(options: [String : NSObject]?, 
                             completionHandler: @escaping (Error?) -> Void) {
        
        os_log("🚀 Iniciando túnel WireGuard iOS...", log: logger, type: .info)
        
        guard let protocolConfiguration = self.protocolConfiguration as? NETunnelProviderProtocol,
              let configData = protocolConfiguration.providerConfiguration?["wg-quick-config"] as? String else {
            os_log("❌ No se encontró configuración WireGuard", log: logger, type: .error)
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
            self.adapter = WireGuardAdapter(with: self) { message in
                os_log("WireGuard: %{public}@", log: self.logger, type: .info, message)
            }
            
            // Configurar interfaz de red
            self.configureNetworkInterface(tunnelConfig: tunnelConfig) { [weak self] error in
                if let error = error {
                    os_log("❌ Error configurando interfaz: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                    completionHandler(error)
                    return
                }
                
                // Iniciar adaptador WireGuard
                self?.adapter?.start(tunnelConfiguration: tunnelConfig) { error in
                    if let error = error {
                        os_log("❌ Error iniciando WireGuard: %{public}@", log: self.logger, type: .error, error.localizedDescription)
                        completionHandler(error)
                    } else {
                        os_log("✅ WireGuard iOS iniciado exitosamente", log: self.logger, type: .info)
                        completionHandler(nil)
                    }
                }
            }
            
        } catch {
            os_log("❌ Error parseando configuración: %{public}@", log: self.logger, type: .error, error.localizedDescription)
            completionHandler(error)
        }
    }
    
    override func stopTunnel(with reason: NEProviderStopReason, 
                            completionHandler: @escaping () -> Void) {
        
        os_log("🔌 Deteniendo túnel WireGuard iOS...", log: logger, type: .info)
        
        adapter?.stop { [weak self] error in
            if let error = error {
                os_log("❌ Error deteniendo WireGuard: %{public}@", log: self.logger, type: .error, error.localizedDescription)
            } else {
                os_log("✅ WireGuard iOS detenido", log: self.logger, type: .info)
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
        os_log("😴 VPN entrando en modo suspensión", log: logger, type: .info)
        completionHandler()
    }
    
    override func wake() {
        os_log("🌅 VPN despertando de suspensión", log: logger, type: .info)
    }
    
    // MARK: - Private Methods
    
    private func configureNetworkInterface(tunnelConfig: TunnelConfiguration, 
                                         completion: @escaping (Error?) -> Void) {
        
        let networkSettings = NEPacketTunnelNetworkSettings(tunnelRemoteAddress: "127.0.0.1")
        
        // Configurar direcciones IP
        if let interface = tunnelConfig.interface {
            // Separar direcciones IPv4 e IPv6
            let ipv4Addresses = interface.addresses.filter { !$0.address.contains(":") }
            let ipv6Addresses = interface.addresses.filter { $0.address.contains(":") }
            
            // Configurar IPv4
            if !ipv4Addresses.isEmpty {
                let addresses = ipv4Addresses.map { $0.address }
                let subnetMasks = ipv4Addresses.map { address in
                    self.subnetMaskString(from: address.networkPrefixLength)
                }
                
                let ipv4Settings = NEIPv4Settings(addresses: addresses, subnetMasks: subnetMasks)
                ipv4Settings.includedRoutes = [NEIPv4Route.default()]
                networkSettings.ipv4Settings = ipv4Settings
            }
            
            // Configurar IPv6
            if !ipv6Addresses.isEmpty {
                let addresses = ipv6Addresses.map { $0.address }
                let prefixLengths = ipv6Addresses.map { NSNumber(value: $0.networkPrefixLength) }
                
                let ipv6Settings = NEIPv6Settings(addresses: addresses, networkPrefixLengths: prefixLengths)
                ipv6Settings.includedRoutes = [NEIPv6Route.default()]
                networkSettings.ipv6Settings = ipv6Settings
            }
            
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
                os_log("❌ Error configurando red: %{public}@", log: self.logger, type: .error, error.localizedDescription)
            } else {
                os_log("✅ Configuración de red aplicada", log: self.logger, type: .info)
            }
            completion(error)
        }
    }
    
    // MARK: - Helper Methods
    
    private func subnetMaskString(from prefixLength: UInt8) -> String {
        let mask = (0xFFFFFFFF as UInt32) << (32 - UInt32(prefixLength))
        return String(format: "%d.%d.%d.%d",
                     (mask >> 24) & 0xFF,
                     (mask >> 16) & 0xFF,
                     (mask >> 8) & 0xFF,
                     mask & 0xFF)
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