export default {
  expo: {
    name: "bolt-expo-nativewind",
    slug: "bolt-expo-nativewind",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.aitech.beautyfood",
      infoPlist: {
        NSCameraUsageDescription: "このアプリは料理の写真を撮影するためにカメラを使用します。",
        NSPhotoLibraryUsageDescription: "このアプリは料理の写真を選択するためにフォトライブラリにアクセスします。",
        NSMicrophoneUsageDescription: "このアプリはビデオ撮影時にマイクを使用することがあります。"
      }
    },
    android: {
      package: "com.aitech.beautyfood"
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-camera",
      "expo-image-picker",
      "expo-apple-authentication"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || process.env.EXPO_PUBLIC_SLACK_WEBHOOK_URL,
      eas: {
        projectId: "b06c8db5-b4c5-438b-bf47-7a0a7fe4a9e6"
      }
    }
  }
}; 