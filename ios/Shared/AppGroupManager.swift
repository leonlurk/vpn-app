import Foundation

/// Gestiona la comunicación entre la app principal y la Network Extension usando App Groups
class AppGroupManager {
    
    // MARK: - Constants
    
    static let shared = AppGroupManager()
    private let appGroupIdentifier = "group.com.nodexvpn.app.shared"
    
    // Keys para UserDefaults compartidos
    private enum Keys {
        static let vpnConfiguration = "vpn_configuration"
        static let connectionStatus = "connection_status"
        static let lastConnectionTime = "last_connection_time"
        static let serverInfo = "server_info"
        static let statistics = "statistics"
    }
    
    // MARK: - Properties
    
    private var sharedDefaults: UserDefaults? {
        return UserDefaults(suiteName: appGroupIdentifier)
    }
    
    private let fileManager = FileManager.default
    
    private var sharedContainerURL: URL? {
        return fileManager.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier)
    }
    
    // MARK: - VPN Configuration
    
    /// Guarda la configuración VPN para compartir con la extension
    func saveVPNConfiguration(_ config: [String: Any]) {
        sharedDefaults?.set(config, forKey: Keys.vpnConfiguration)
        sharedDefaults?.synchronize()
    }
    
    /// Obtiene la configuración VPN guardada
    func getVPNConfiguration() -> [String: Any]? {
        return sharedDefaults?.dictionary(forKey: Keys.vpnConfiguration)
    }
    
    // MARK: - Connection Status
    
    /// Actualiza el estado de conexión
    func updateConnectionStatus(_ status: String) {
        sharedDefaults?.set(status, forKey: Keys.connectionStatus)
        sharedDefaults?.set(Date(), forKey: Keys.lastConnectionTime)
        sharedDefaults?.synchronize()
    }
    
    /// Obtiene el estado actual de conexión
    func getConnectionStatus() -> String {
        return sharedDefaults?.string(forKey: Keys.connectionStatus) ?? "disconnected"
    }
    
    /// Obtiene la última vez que se conectó
    func getLastConnectionTime() -> Date? {
        return sharedDefaults?.object(forKey: Keys.lastConnectionTime) as? Date
    }
    
    // MARK: - Server Information
    
    /// Guarda información del servidor actual
    func saveServerInfo(_ serverInfo: [String: Any]) {
        sharedDefaults?.set(serverInfo, forKey: Keys.serverInfo)
        sharedDefaults?.synchronize()
    }
    
    /// Obtiene información del servidor
    func getServerInfo() -> [String: Any]? {
        return sharedDefaults?.dictionary(forKey: Keys.serverInfo)
    }
    
    // MARK: - Statistics
    
    /// Guarda estadísticas de conexión
    func saveStatistics(_ stats: [String: Any]) {
        sharedDefaults?.set(stats, forKey: Keys.statistics)
        sharedDefaults?.synchronize()
    }
    
    /// Obtiene estadísticas de conexión
    func getStatistics() -> [String: Any]? {
        return sharedDefaults?.dictionary(forKey: Keys.statistics)
    }
    
    // MARK: - File Operations
    
    /// Guarda la configuración WireGuard en un archivo
    func saveWireGuardConfig(_ configString: String) throws {
        guard let containerURL = sharedContainerURL else {
            throw AppGroupError.containerNotAvailable
        }
        
        let configURL = containerURL.appendingPathComponent("wireguard.conf")
        try configString.write(to: configURL, atomically: true, encoding: .utf8)
    }
    
    /// Lee la configuración WireGuard desde archivo
    func readWireGuardConfig() throws -> String {
        guard let containerURL = sharedContainerURL else {
            throw AppGroupError.containerNotAvailable
        }
        
        let configURL = containerURL.appendingPathComponent("wireguard.conf")
        return try String(contentsOf: configURL, encoding: .utf8)
    }
    
    /// Borra la configuración WireGuard
    func deleteWireGuardConfig() {
        guard let containerURL = sharedContainerURL else { return }
        
        let configURL = containerURL.appendingPathComponent("wireguard.conf")
        try? fileManager.removeItem(at: configURL)
    }
    
    // MARK: - Logs
    
    /// Guarda logs en el contenedor compartido
    func saveLog(_ message: String) {
        guard let containerURL = sharedContainerURL else { return }
        
        let logsURL = containerURL.appendingPathComponent("vpn_logs.txt")
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .short, timeStyle: .medium)
        let logEntry = "[\(timestamp)] \(message)\n"
        
        if let data = logEntry.data(using: .utf8) {
            if fileManager.fileExists(atPath: logsURL.path) {
                if let fileHandle = try? FileHandle(forWritingTo: logsURL) {
                    fileHandle.seekToEndOfFile()
                    fileHandle.write(data)
                    fileHandle.closeFile()
                }
            } else {
                try? data.write(to: logsURL)
            }
        }
    }
    
    /// Lee los logs guardados
    func readLogs() -> String? {
        guard let containerURL = sharedContainerURL else { return nil }
        
        let logsURL = containerURL.appendingPathComponent("vpn_logs.txt")
        return try? String(contentsOf: logsURL, encoding: .utf8)
    }
    
    /// Limpia todos los datos compartidos
    func clearAllData() {
        // Limpiar UserDefaults
        let keys = [Keys.vpnConfiguration, Keys.connectionStatus, Keys.lastConnectionTime, Keys.serverInfo, Keys.statistics]
        keys.forEach { sharedDefaults?.removeObject(forKey: $0) }
        sharedDefaults?.synchronize()
        
        // Limpiar archivos
        deleteWireGuardConfig()
        
        if let containerURL = sharedContainerURL {
            let logsURL = containerURL.appendingPathComponent("vpn_logs.txt")
            try? fileManager.removeItem(at: logsURL)
        }
    }
}

// MARK: - Error Types

enum AppGroupError: LocalizedError {
    case containerNotAvailable
    case configurationNotFound
    
    var errorDescription: String? {
        switch self {
        case .containerNotAvailable:
            return "App Group container no disponible"
        case .configurationNotFound:
            return "Configuración no encontrada en App Group"
        }
    }
}