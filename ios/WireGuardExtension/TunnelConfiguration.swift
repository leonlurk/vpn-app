import Foundation
import Network

/// Configuración completa del túnel WireGuard
struct TunnelConfiguration {
    let name: String?
    let interface: InterfaceConfiguration?
    let peers: [PeerConfiguration]?
    
    /// Inicializa desde una configuración WireGuard en formato string
    init(fromWgQuickConfig config: String, name: String? = nil) throws {
        self.name = name
        
        var interfaceConfig: InterfaceConfiguration?
        var peerConfigs: [PeerConfiguration] = []
        
        // Parser simple de configuración WireGuard
        let lines = config.components(separatedBy: .newlines)
        var currentSection: String?
        var currentPeerConfig: [String: String] = [:]
        var interfaceConfigDict: [String: String] = [:]
        
        for line in lines {
            let trimmedLine = line.trimmingCharacters(in: .whitespaces)
            
            // Detectar secciones
            if trimmedLine == "[Interface]" {
                // Guardar peer anterior si existe
                if currentSection == "peer" && !currentPeerConfig.isEmpty {
                    if let peer = PeerConfiguration(from: currentPeerConfig) {
                        peerConfigs.append(peer)
                    }
                    currentPeerConfig = [:]
                }
                currentSection = "interface"
            } else if trimmedLine == "[Peer]" {
                // Guardar peer anterior si existe
                if currentSection == "peer" && !currentPeerConfig.isEmpty {
                    if let peer = PeerConfiguration(from: currentPeerConfig) {
                        peerConfigs.append(peer)
                    }
                    currentPeerConfig = [:]
                }
                currentSection = "peer"
            } else if trimmedLine.contains("=") {
                // Parsear key = value
                let parts = trimmedLine.split(separator: "=", maxSplits: 1).map { $0.trimmingCharacters(in: .whitespaces) }
                if parts.count == 2 {
                    let key = parts[0]
                    let value = parts[1]
                    
                    if currentSection == "interface" {
                        interfaceConfigDict[key] = value
                    } else if currentSection == "peer" {
                        currentPeerConfig[key] = value
                    }
                }
            }
        }
        
        // Guardar último peer si existe
        if currentSection == "peer" && !currentPeerConfig.isEmpty {
            if let peer = PeerConfiguration(from: currentPeerConfig) {
                peerConfigs.append(peer)
            }
        }
        
        // Crear configuración de interfaz
        if !interfaceConfigDict.isEmpty {
            interfaceConfig = InterfaceConfiguration(from: interfaceConfigDict)
        }
        
        self.interface = interfaceConfig
        self.peers = peerConfigs.isEmpty ? nil : peerConfigs
        
        // Validar configuración mínima
        guard interface != nil else {
            throw TunnelConfigurationError.missingInterface
        }
        
        guard let peers = peers, !peers.isEmpty else {
            throw TunnelConfigurationError.noPeers
        }
    }
}

/// Configuración de la interfaz WireGuard
struct InterfaceConfiguration {
    let privateKey: PrivateKey?
    let addresses: [IPAddressRange]
    let listenPort: UInt16?
    let mtu: UInt16?
    let dns: [DNSServer]
    
    init?(from dict: [String: String]) {
        // Private Key
        if let privateKeyString = dict["PrivateKey"] {
            self.privateKey = PrivateKey(base64Key: privateKeyString)
        } else {
            self.privateKey = nil
        }
        
        // Addresses
        var addresses: [IPAddressRange] = []
        if let addressString = dict["Address"] {
            let addressList = addressString.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            for addr in addressList {
                if let ipRange = IPAddressRange(from: addr) {
                    addresses.append(ipRange)
                }
            }
        }
        self.addresses = addresses
        
        // Listen Port
        if let portString = dict["ListenPort"], let port = UInt16(portString) {
            self.listenPort = port
        } else {
            self.listenPort = nil
        }
        
        // MTU
        if let mtuString = dict["MTU"], let mtu = UInt16(mtuString) {
            self.mtu = mtu
        } else {
            self.mtu = nil
        }
        
        // DNS
        var dnsServers: [DNSServer] = []
        if let dnsString = dict["DNS"] {
            let dnsList = dnsString.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            for dns in dnsList {
                if let dnsServer = DNSServer(from: dns) {
                    dnsServers.append(dnsServer)
                }
            }
        }
        self.dns = dnsServers
    }
}

/// Configuración de un peer WireGuard
struct PeerConfiguration {
    let publicKey: PublicKey?
    let preSharedKey: PreSharedKey?
    let allowedIPs: [IPAddressRange]
    let endpoint: Endpoint?
    let persistentKeepAlive: UInt16?
    
    init?(from dict: [String: String]) {
        // Public Key (requerido)
        guard let publicKeyString = dict["PublicKey"] else { return nil }
        self.publicKey = PublicKey(base64Key: publicKeyString)
        
        // Pre-shared Key (opcional)
        if let pskString = dict["PresharedKey"] {
            self.preSharedKey = PreSharedKey(base64Key: pskString)
        } else {
            self.preSharedKey = nil
        }
        
        // Allowed IPs
        var allowedIPs: [IPAddressRange] = []
        if let allowedIPsString = dict["AllowedIPs"] {
            let ipList = allowedIPsString.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            for ip in ipList {
                if let ipRange = IPAddressRange(from: ip) {
                    allowedIPs.append(ipRange)
                }
            }
        }
        self.allowedIPs = allowedIPs
        
        // Endpoint
        if let endpointString = dict["Endpoint"] {
            self.endpoint = Endpoint(from: endpointString)
        } else {
            self.endpoint = nil
        }
        
        // Persistent Keepalive
        if let keepAliveString = dict["PersistentKeepalive"], let keepAlive = UInt16(keepAliveString) {
            self.persistentKeepAlive = keepAlive
        } else {
            self.persistentKeepAlive = nil
        }
    }
}

// MARK: - WireGuard Types

/// Clave privada WireGuard
struct PrivateKey {
    let base64Key: String
    
    init(base64Key: String) {
        self.base64Key = base64Key
    }
}

/// Clave pública WireGuard
struct PublicKey {
    let base64Key: String
    
    init(base64Key: String) {
        self.base64Key = base64Key
    }
}

/// Clave pre-compartida WireGuard
struct PreSharedKey {
    let base64Key: String
    
    init(base64Key: String) {
        self.base64Key = base64Key
    }
}

/// Rango de direcciones IP
struct IPAddressRange {
    let address: String
    let networkPrefixLength: UInt8
    
    init?(from string: String) {
        let parts = string.split(separator: "/")
        guard parts.count <= 2 else { return nil }
        
        self.address = String(parts[0])
        
        if parts.count == 2, let prefix = UInt8(parts[1]) {
            self.networkPrefixLength = prefix
        } else {
            // Asumir /32 para IPv4 o /128 para IPv6 si no se especifica
            self.networkPrefixLength = address.contains(":") ? 128 : 32
        }
    }
    
    var stringRepresentation: String {
        return "\(address)/\(networkPrefixLength)"
    }
}

/// Servidor DNS
struct DNSServer {
    let stringRepresentation: String
    
    init?(from string: String) {
        // Validación básica de formato IP
        guard !string.isEmpty else { return nil }
        self.stringRepresentation = string
    }
}

/// Endpoint del peer
struct Endpoint {
    let host: String
    let port: UInt16
    
    init?(from string: String) {
        // Parsear host:port
        if let lastColon = string.lastIndex(of: ":") {
            let hostPart = String(string[..<lastColon])
            let portPart = String(string[string.index(after: lastColon)...])
            
            guard let port = UInt16(portPart) else { return nil }
            
            // Manejar IPv6 entre corchetes
            if hostPart.hasPrefix("[") && hostPart.hasSuffix("]") {
                self.host = String(hostPart.dropFirst().dropLast())
            } else {
                self.host = hostPart
            }
            self.port = port
        } else {
            return nil
        }
    }
    
    var stringRepresentation: String {
        if host.contains(":") {
            return "[\(host)]:\(port)"
        } else {
            return "\(host):\(port)"
        }
    }
}

// MARK: - Errors

enum TunnelConfigurationError: LocalizedError {
    case missingInterface
    case noPeers
    case invalidConfiguration
    
    var errorDescription: String? {
        switch self {
        case .missingInterface:
            return "Configuración de interfaz faltante"
        case .noPeers:
            return "No se encontraron peers en la configuración"
        case .invalidConfiguration:
            return "Configuración inválida"
        }
    }
}