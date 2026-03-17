# Palm IQ - Android Build Guide

## Prerequisites
- Node.js 18+
- Android Studio (latest)
- Java JDK 17+

## Steps to Build Android APK

### 1. Clone/Download Project
```bash
# Export to GitHub from Lovable, then clone
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Android Platform
```bash
npx cap add android
```

### 4. Build the Web App
```bash
npm run build
```

### 5. Sync to Android
```bash
npx cap sync android
```

### 6. Open in Android Studio
```bash
npx cap open android
```

### 7. In Android Studio:
1. Wait for Gradle sync to complete
2. Add your `google-services.json` to `android/app/` folder
3. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
4. APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

## For Release APK (Signed)
1. Go to **Build > Generate Signed Bundle / APK**
2. Create a new keystore or use existing
3. Follow the wizard to generate signed APK

## Hot Reload During Development
The app is configured to load from the Lovable preview URL, so changes you make in Lovable will appear in the Android app automatically (requires internet).

## For Offline/Production Build
Edit `capacitor.config.ts` and remove the `server` block:
```ts
// Remove or comment out:
// server: {
//   url: '...',
//   cleartext: true
// },
```
Then rebuild: `npm run build && npx cap sync android`

## Firebase Setup
Your `google-services.json` should be placed in:
```
android/app/google-services.json
```

## Troubleshooting
- If Gradle fails, try: `cd android && ./gradlew clean`
- For SDK issues, open SDK Manager in Android Studio and install required SDKs
- Minimum SDK: 22 (Android 5.1)
- Target SDK: 34 (Android 14)
