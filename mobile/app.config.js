export default {
  expo: {
    name: "alugae - Aluguel de Carros",
    slug: "alugae-mobile",
    version: "1.0.2",
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
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "Este app precisa acessar sua localização para mostrar veículos próximos.",
        NSCameraUsageDescription: "Este app precisa acessar a câmera para capturar fotos dos veículos.",
        NSFaceIDUsageDescription: "Este app usa Face ID para autenticação segura.",
        NSPhotoLibraryUsageDescription: "Este app precisa acessar suas fotos para upload de documentos.",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        UIRequiredDeviceCapabilities: ["armv7"],
        LSRequiresIPhoneOS: true,
        UIFileSharingEnabled: false,
        // Critical stability settings for iOS
        UIApplicationSupportsIndirectInputEvents: true,
        UILaunchStoryboardName: "SplashScreen",
        UIStatusBarStyle: "UIStatusBarStyleDefault",
        UIViewControllerBasedStatusBarAppearance: false,
        // Prevent memory issues
        UIMainStoryboardFile: "",
        CFBundleAllowMixedLocalizations: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#20B2AA"
      },
      package: "com.alugae.mobile",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION", 
        "CAMERA",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
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
      "expo-font"
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