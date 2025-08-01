const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Excluir directorios problemáticos en Windows
config.watchFolders = [];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ignorar archivos de macOS/iOS problemáticos que causan errores en Windows
config.resolver.blockList = [
  /node_modules\/@react-native-async-storage\/.*\/macos\/.*/,
  /node_modules\/.*\/macos\/.*/,
  /.*\.xcodeproj\/.*/,
  /.*\.xcworkspace\/.*/
];

module.exports = config; 