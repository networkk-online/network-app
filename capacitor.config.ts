import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production Capacitor config for Networkk (Android + iOS).
 *
 * IMPORTANT for Google Play production builds:
 *  - `server.url` MUST be undefined (do NOT point at the Lovable sandbox).
 *  - `webContentsDebuggingEnabled` MUST be false for release.
 *  - `androidScheme` = 'https' so Service Worker, camera getUserMedia,
 *    and secure-context APIs (WebRTC / Agora) work inside the WebView.
 */
const config: CapacitorConfig = {
  appId: 'com.networkk.online',
  appName: 'Networkk',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // Camera plugin handles CAMERA + READ_MEDIA_IMAGES/VIDEO permissions on Android 13+
      androidScaleType: 'CENTER_CROP',
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Required so Agora / WebRTC getUserMedia doesn't get blocked
    // inside the Android WebView.
    backgroundColor: '#000000',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    backgroundColor: '#000000',
    limitsNavigationsToAppBoundDomains: false,
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
    // DO NOT set `url` for production — leaving it undefined ships the
    // bundled `dist/` from the APK/AAB. Setting `url` would make the
    // Play Store reject the build (loads remote code).
  },
};

export default config;
