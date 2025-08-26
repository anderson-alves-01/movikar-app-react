module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add reanimated plugin to prevent crashes
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: [
          // Optimize production builds
          'transform-remove-console',
        ],
      },
    },
  };
};