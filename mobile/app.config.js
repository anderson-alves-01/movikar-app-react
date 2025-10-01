export default {
  expo: {
    entryPoint: './index.js',
    name: "alugae - Aluguel de Carros",
    slug: "alugae-mobile",
    version: "1.0.3",
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
      buildNumber: "3",
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
        // Critical crash prevention settings
        UIApplicationSupportsIndirectInputEvents: true,
        UIStatusBarStyle: "UIStatusBarStyleDefault",
        UIViewControllerBasedStatusBarAppearance: false,
        UIMainStoryboardFile: "",
        CFBundleAllowMixedLocalizations: false,
        // Memory and stability improvements
        UIPrerenderedIcon: false,
        UIStatusBarHidden: false,
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown"
        ],
        // Disable problematic features that can crash
        UIUserInterfaceStyle: "Light"
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
      ],
      // Hermes engine stability fixes
      enableHermes: true,
      // TurboModule crash prevention
      enableProguardInReleaseBuilds: false,
      // Memory allocation fixes for crash prevention
      largeHeap: true,
      // Prevent crashes on startup
      softwareKeyboardLayoutMode: "adjustResize"
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
  }
};