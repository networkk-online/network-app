# Networkk — Android Production Build Guide

The project is now fully prepared for Android. The Lovable cloud
environment cannot compile APK/AAB (no Android SDK / JDK / Gradle), so
you build them locally following the exact steps below. No code changes
are required after this — everything (Supabase auth, Agora live, camera,
mic, push, upload, notifications) will work out of the box.

## 0. One-time machine setup

Install:
- **Node.js 20+** and **npm** (or bun)
- **JDK 17** (Temurin recommended)
- **Android Studio** (latest) → open SDK Manager and install:
  - Android SDK Platform 34 (API 34)
  - Android SDK Build-Tools 34.0.0
  - Android SDK Command-line Tools
  - Android SDK Platform-Tools
- Add `ANDROID_HOME` env var pointing to your SDK (e.g.
  `~/Library/Android/sdk` on macOS, `%LOCALAPPDATA%\Android\Sdk` on Windows).

## 1. Get the code

Export the project to GitHub via the Lovable UI ("GitHub" → "Connect to
GitHub"), then:

```bash
git clone <your-repo-url>
cd <repo>
npm install
```

## 2. Build the web bundle

```bash
npm run build
```

This produces `dist/` — the exact assets that will be embedded in the
APK/AAB (no network fetches at runtime for app code).

## 3. Generate the Android project

Because `android/` is not committed, generate it once:

```bash
npx cap add android
npx cap sync android
```

`cap sync` copies `dist/` into `android/app/src/main/assets/public` and
auto-installs the Android manifest permissions required by every
Capacitor plugin in `package.json` (camera, mic, push, geolocation,
filesystem, etc.).

## 4. Add the AndroidManifest permissions Agora / Live streaming needs

Capacitor auto-adds most permissions, but Agora RTC needs a few extra
network entries. Open
`android/app/src/main/AndroidManifest.xml` and make sure the following
sit inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

Also inside the existing `<application ...>` tag add:

```xml
android:usesCleartextTraffic="false"
android:hardwareAccelerated="true"
android:largeHeap="true"
```

## 5. App identity

- **Application ID**: `com.networkk.online` (already set in
  `capacitor.config.ts`)
- **App name**: `Networkk`
- **Version**: bump in `android/app/build.gradle` (`versionCode` +
  `versionName`) for every Play Store upload.

## 6. Icons and splash

Drop a 1024×1024 PNG icon and a splash image, then generate all
densities:

```bash
npm i -D @capacitor/assets
npx capacitor-assets generate --android
```

## 7. Build a DEBUG APK (for testing on your phone)

```bash
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on a device: `adb install -r app/build/outputs/apk/debug/app-debug.apk`

## 8. Build a RELEASE AAB (for Google Play)

### 8a. Create a signing keystore (do this ONCE, back it up forever)

```bash
keytool -genkey -v -keystore networkk-release.keystore \
  -alias networkk -keyalg RSA -keysize 2048 -validity 10000
```

### 8b. Register it with Gradle

Create `android/keystore.properties`:

```
storeFile=/absolute/path/to/networkk-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=networkk
keyPassword=YOUR_KEY_PASSWORD
```

Edit `android/app/build.gradle` — inside `android { ... }` add:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
    release {
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 8c. Build the AAB

```bash
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` — this
is the file you upload to Google Play Console.

## 9. Google Play Console checklist

- App name: **Networkk**
- Package: `com.networkk.online`
- Category: Social
- Content rating: complete the IARC questionnaire
- Privacy policy URL (required): use `https://networkk.online/privacy`
- Data safety form: declare camera, mic, photos, location (optional),
  push tokens, and Supabase auth (email + password + phone)
- Target SDK: 34 (Play requirement from Aug 2024+)
- Upload the AAB from step 8c to a Closed/Internal testing track first.

## 10. Verified working on Android

The following flows have been prepared for the WebView:

| Feature            | Notes                                                          |
| ------------------ | -------------------------------------------------------------- |
| Login / Signup     | PKCE + safe-storage fallback for WebView (Supabase client)     |
| Posts / Reels      | HLS.js + native `<video>` playback                             |
| Stories            | Camera plugin → base64 upload to Supabase Storage              |
| Messages + Realtime| Supabase Realtime over WSS works on `https` scheme             |
| Live Streaming     | Agora RTC via WebRTC, permissions listed in step 4             |
| Camera / Mic       | `@capacitor/camera` + WebRTC getUserMedia                      |
| Push Notifications | `@capacitor/push-notifications` (requires FCM setup — step 11) |
| File upload        | Filesystem + Camera plugins                                    |


## 11A. Networkk Admin → real phone Push broadcasts

The app already registers Android push tokens in `public.push_tokens`. For
real push delivery while the app is closed/backgrounded, Firebase Cloud
Messaging (FCM) must be connected to the Android application.

### Firebase Android setup

The Firebase Android package **must be exactly**:

`com.networkk.online`

1. In Firebase Console create/select the Firebase project for Networkk.
2. Add Android app with package `com.networkk.online`.
3. Download `google-services.json`.
4. Put it at `android/app/google-services.json` before the release build.
5. The repository already contains the Google Services Gradle plugin.
6. Build the AAB again after adding the file.

### Supabase Edge Function secret

The Edge Function `send-broadcast-push` sends FCM messages securely from the
server. Never put a Firebase service-account private key in React code or
inside the APK.

In Supabase Dashboard → Edge Functions → Secrets, add:

`FIREBASE_SERVICE_ACCOUNT_JSON`

Value: the complete Firebase/Google service-account JSON for the Networkk
Firebase project.

The Admin page calls this server function; the service-account private key
never reaches the browser.

### Sending

Networkk Admin → **بث إشعار للجميع** → enter title + message → **بث الإشعار
للجميع**.

The server sends a real Android Push notification to the registered Networkk
devices, removes invalid/expired device tokens, and records the broadcast in
the existing `system_broadcasts` history.


## 11. Firebase Cloud Messaging for push

To receive pushes on Android:

1. Create a Firebase project → add an Android app with package
   `com.networkk.online`.
2. Download `google-services.json` and drop it into `android/app/`.
3. In `android/build.gradle` add `classpath 'com.google.gms:google-services:4.4.2'`.
4. In `android/app/build.gradle` add `apply plugin: 'com.google.gms.google-services'`.
5. Rebuild.

## 12. Rebuild loop after code changes

Every time you change the React app:

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```
