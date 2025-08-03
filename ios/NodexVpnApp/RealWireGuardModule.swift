import Foundation
import React
import NetworkExtension
import UserNotifications
import os.log

@objc(RealWireGuardModule)
class RealWireGuardModule: NSObject, RCTBridgeModule {
  
  static func moduleName() -> String! {
    return "RealWireGuardModule"
  }
  
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  // Logging
  private let logger = OSLog(subsystem: "com.nodexvpn.app", category: "VPN")
  
  private var vpnManager: NEVPNManager?
  private var currentTunnelProvider: WireGuardTunnelProvider?
  private let appGroupManager = AppGroupManager.shared
  
  override init() {
    super.init()
    self.vpnManager = NEVPNManager.shared()
    os_log("✅ RealWireGuardModule iOS inicializado", log: logger, type: .info)
    
    // Solicitar permisos de notificaciones
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if granted {
        os_log("✅ Permisos de notificación concedidos", log: self.logger, type: .info)
      } else if let error = error {
        os_log("❌ Error solicitando permisos de notificación: %{public}@", log: self.logger, type: .error, error.localizedDescription)
      }
    }
  }
  
  @objc func connect(_ config: NSDictionary, 
                    resolver: @escaping RCTPromiseResolveBlock,
                    rejecter: @escaping RCTPromiseRejectBlock) {
    
    os_log("🚀 Iniciando conexión VPN iOS...", log: logger, type: .info)
    
    guard let vpnManager = self.vpnManager else {
      rejecter("VPN_MANAGER_ERROR", "VPN Manager no disponible", nil)
      return
    }
    
    do {
      // Configurar VPN
      try self.configureVPN(config: config) { [weak self] success in
        if success {
          // Iniciar conexión
          self?.startVPNConnection(resolver: resolver, rejecter: rejecter)
        } else {
          rejecter("VPN_CONFIG_ERROR", "Error configurando VPN", nil)
        }
      }
    } catch {
      rejecter("VPN_CONNECTION_ERROR", "Error conectando VPN: \(error.localizedDescription)", error)
    }
  }
  
  @objc func disconnect(_ resolver: @escaping RCTPromiseResolveBlock,
                       rejecter: @escaping RCTPromiseRejectBlock) {
    
    os_log("🔌 Desconectando VPN iOS...", log: logger, type: .info)
    
    guard let vpnManager = self.vpnManager else {
      rejecter("VPN_MANAGER_ERROR", "VPN Manager no disponible", nil)
      return
    }
    
    vpnManager.connection.stopVPNTunnel()
    
    // Remover notificación persistente
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ["vpn_notification"])
    
    let result: NSDictionary = [
      "status": "disconnected",
      "message": "VPN iOS desconectado exitosamente"
    ]
    
    resolver(result)
    os_log("✅ VPN iOS desconectado", log: logger, type: .info)
  }
  
  @objc func getStatus(_ resolver: @escaping RCTPromiseResolveBlock,
                      rejecter: @escaping RCTPromiseRejectBlock) {
    
    guard let vpnManager = self.vpnManager else {
      rejecter("VPN_MANAGER_ERROR", "VPN Manager no disponible", nil)
      return
    }
    
    let connectionStatus = vpnManager.connection.status
    let isConnected = connectionStatus == .connected
    
    let result: NSDictionary = [
      "status": isConnected ? "connected" : "disconnected",
      "isConnected": isConnected
    ]
    
    resolver(result)
  }
  
  // MARK: - Private Methods
  
  private func configureVPN(config: NSDictionary, completion: @escaping (Bool) -> Void) throws {
    
    guard let vpnManager = self.vpnManager else {
      completion(false)
      return
    }
    
    vpnManager.loadFromPreferences { [weak self] error in
      if let error = error {
        os_log("❌ Error cargando preferencias VPN: %{public}@", log: self.logger, type: .error, error.localizedDescription)
        completion(false)
        return
      }
      
      // Configurar protocolo VPN
      let providerProtocol = NETunnelProviderProtocol()
      providerProtocol.providerBundleIdentifier = Bundle.main.bundleIdentifier! + ".WireGuardExtension"
      providerProtocol.serverAddress = "VPN Server"
      
      // Convertir configuración a formato WireGuard
      let wireGuardConfig = self?.buildWireGuardConfig(from: config) ?? ""
      
      // Guardar configuración en App Group para la extension
      self?.appGroupManager.saveLog("🚀 Guardando configuración en App Group")
      
      // Guardar config completa en App Group
      var configDict: [String: Any] = [:]
      if let interfaceConfig = config["Interface"] as? NSDictionary {
        configDict["Interface"] = interfaceConfig as! [String: Any]
      }
      if let peerConfig = config["Peer"] as? NSDictionary {
        configDict["Peer"] = peerConfig as! [String: Any]
      }
      
      self?.appGroupManager.saveVPNConfiguration(configDict)
      
      // Guardar configuración WireGuard en archivo
      do {
        try self?.appGroupManager.saveWireGuardConfig(wireGuardConfig)
        self?.appGroupManager.saveLog("✅ Configuración guardada en App Group")
      } catch {
        self?.appGroupManager.saveLog("❌ Error guardando configuración: \(error.localizedDescription)")
      }
      
      providerProtocol.providerConfiguration = ["wg-quick-config": wireGuardConfig]
      
      vpnManager.protocolConfiguration = providerProtocol
      vpnManager.localizedDescription = "NodeX VPN"
      vpnManager.isEnabled = true
      
      // Guardar configuración
      vpnManager.saveToPreferences { saveError in
        if let saveError = saveError {
          os_log("❌ Error guardando configuración VPN: %{public}@", log: self.logger, type: .error, saveError.localizedDescription)
          completion(false)
        } else {
          os_log("✅ Configuración VPN guardada", log: self.logger, type: .info)
          completion(true)
        }
      }
    }
  }
  
  private func startVPNConnection(resolver: @escaping RCTPromiseResolveBlock,
                                 rejecter: @escaping RCTPromiseRejectBlock) {
    
    guard let vpnManager = self.vpnManager else {
      rejecter("VPN_MANAGER_ERROR", "VPN Manager no disponible", nil)
      return
    }
    
    do {
      try vpnManager.connection.startVPNTunnel()
      
      // Crear notificación persistente
      self.createPersistentNotification()
      
      let result: NSDictionary = [
        "status": "connected",
        "message": "VPN iOS conectado exitosamente"
      ]
      
      resolver(result)
      os_log("✅ VPN iOS conectado exitosamente", log: self.logger, type: .info)
      
    } catch {
      rejecter("VPN_START_ERROR", "Error iniciando VPN: \(error.localizedDescription)", error)
    }
  }
  
  private func buildWireGuardConfig(from config: NSDictionary) -> String {
    var wireGuardConfig = ""
    
    // Sección [Interface]
    wireGuardConfig += "[Interface]\n"
    
    if let interfaceConfig = config["Interface"] as? NSDictionary {
      if let privateKey = interfaceConfig["PrivateKey"] as? String {
        wireGuardConfig += "PrivateKey = \(privateKey)\n"
      }
      if let address = interfaceConfig["Address"] as? String {
        wireGuardConfig += "Address = \(address)\n"
      }
      if let dns = interfaceConfig["DNS"] as? String {
        wireGuardConfig += "DNS = \(dns)\n"
      }
    }
    
    // Sección [Peer]
    wireGuardConfig += "\n[Peer]\n"
    
    if let peerConfig = config["Peer"] as? NSDictionary {
      if let publicKey = peerConfig["PublicKey"] as? String {
        wireGuardConfig += "PublicKey = \(publicKey)\n"
      }
      if let endpoint = peerConfig["Endpoint"] as? String {
        wireGuardConfig += "Endpoint = \(endpoint)\n"
      }
      if let allowedIPs = peerConfig["AllowedIPs"] as? String {
        wireGuardConfig += "AllowedIPs = \(allowedIPs)\n"
      }
      if let keepalive = peerConfig["PersistentKeepalive"] as? String {
        wireGuardConfig += "PersistentKeepalive = \(keepalive)\n"
      }
    }
    
    os_log("📋 Configuración WireGuard iOS generada", log: logger, type: .info)
    return wireGuardConfig
  }
  
  private func createPersistentNotification() {
    let content = UNMutableNotificationContent()
    content.title = "🔒 NodeX VPN"
    content.body = "Conectado con WireGuard real"
    content.subtitle = "Conexión VPN activa - Toca para gestionar"
    content.sound = nil
    content.categoryIdentifier = "VPN_CATEGORY"
    
    let request = UNNotificationRequest(
      identifier: "vpn_notification",
      content: content,
      trigger: nil // Notificación permanente
    )
    
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        os_log("❌ Error creando notificación iOS: %{public}@", log: self.logger, type: .error, error.localizedDescription)
      } else {
        os_log("✅ Notificación VPN iOS creada", log: self.logger, type: .info)
      }
    }
  }
} 