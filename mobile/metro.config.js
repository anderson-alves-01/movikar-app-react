const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'obj', 'png', 'jpg');

// Replit-specific configurations for better performance
config.server = {
  ...config.server,
  host: '0.0.0.0',
  port: 8081
};

// Performance optimizations
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

// Faster resolver configuration
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web'],
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
};

// Cache configuration for faster rebuilds
config.cacheVersion = '1.0';

module.exports = config;