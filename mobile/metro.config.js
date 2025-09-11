const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Replit-specific configurations
config.server = {
  ...config.server,
  host: '0.0.0.0'
};

// Allow external connections
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;