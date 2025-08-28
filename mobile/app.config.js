export default {
  expo: {
    name: "alugae - Aluguel de Carros",
    slug: "alugae-mobile",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    jsEngine: "hermes",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#20B2AA"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.alugae.mobile",
      buildNumber: "2",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Este app precisa acessar sua localização para mostrar veículos próximos.",
        NSCameraUsageDescription: "Este app precisa acessar a câmera para capturar fotos dos veículos.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: [],
        UIRequiredDeviceCapabilities: ["armv7"],
        LSRequiresIPhoneOS: true,
        // Crash prevention settings
        UIApplicationExitsOnSuspend: false,
        UIFileSharingEnabled: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#20B2AA"
      },
      package: "com.alugae.mobile",
      versionCode: 2
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "7e39768d-3528-4079-8f20-32b40e6d73d6"
      }
    },
    plugins: [
      "expo-web-browser",
      "expo-font",
      [
        "expo-apple-authentication"
      ]
    ],
    // Stability settings
    updates: {
      fallbackToCacheTimeout: 0
    },
    // Memory and performance optimization
    packagerOpts: {
      config: "metro.config.js"
    }
  }
};