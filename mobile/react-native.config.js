module.exports = {
  dependencies: {
    // Disable auto-linking for problematic packages
    'react-native-vector-icons': {
      platforms: {
        ios: {
          project: './ios/alugaeAlugueldeCarros.xcodeproj',
        },
      },
    },
  },
  // iOS specific configurations
  ios: {
    // Prevent TurboModule crashes
    unstable_reactLegacy: true,
  },
  // Performance optimizations
  resolver: {
    blacklistRE: /(node_modules\/.*\/node_modules\/react-native\/.*)/,
  },
};