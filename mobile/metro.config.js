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
  // Fix TurboModule initialization issues
  asyncRequireModulePath: require.resolve('metro-runtime/src/modules/asyncRequire'),
  // Hermes stability improvements
  hermesParser: true,
  unstable_allowRequireContext: true,
};

// Faster resolver configuration
config.resolver = {
  ...config.resolver,
  platforms: ['ios', 'android', 'web'],
  sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
};

// Cache configuration for faster rebuilds
config.cacheVersion = '1.0';

// Android stability fixes
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'import'];

// TurboModule crash prevention
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    return require('crypto').createHash('sha1').update(path).digest('hex');
  },
};

// Memory optimization for Android
config.maxWorkers = 2;
config.resetCache = false;

module.exports = config;