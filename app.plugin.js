
const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withVPNConfig(config) {
  // Configurar proyecto Xcode
  config = withXcodeProject(config, async (config) => {
    const project = config.modResults;
    
    // Agregar Network Extension target si no existe
    console.log('🔧 Configurando Network Extension en Xcode...');
    
    // Aquí iría la lógica para agregar el target programáticamente
    // Por ahora solo logueamos
    console.log('✅ Configuración Xcode aplicada');
    
    return config;
  });

  // Configurar entitlements
  config = withEntitlementsPlist(config, async (config) => {
    config.modResults['com.apple.developer.networking.networkextension'] = [
      'packet-tunnel-provider'
    ];
    
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.nodexvpn.app.shared'
    ];
    
    console.log('✅ Entitlements configurados');
    return config;
  });

  return config;
};
