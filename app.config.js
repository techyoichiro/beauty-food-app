export default {
  expo: {
    name: "美活！",
    slug: "beautyfood-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "beautyfood",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    owner: "m.yoichiro",
    ios: {
      supportsTablet: false,
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
      privacyPolicyUrl: "https://seasoned-omelet-fec.notion.site/privacy-policy-22511745eca2818b9201ca2410b49d8e",
      termsOfServiceUrl: "https://seasoned-omelet-fec.notion.site/terms-of-service-22511745eca280b5b927d7e10566bd26",
      supportUrl: "https://techyoichiro.github.io/beauty-food-app/support-page/",
      eas: {
        projectId: "bbacced7-4633-42c7-8143-889465af16d4"
      }
    }
  }
}; 