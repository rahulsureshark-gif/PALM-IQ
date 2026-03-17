# Palm IQ — Android Native Fix (One Command)

This project includes the **real** Palm SDK files in `android-sdk-files/`, but the Android platform folder (`android/`) is generated locally by Capacitor.

## 1) Create Android platform

After exporting to GitHub and cloning locally:

```bash
npm install
npm run build
npx cap add android
npx cap sync android
```

## 2) Patch Android app (copies SDK + registers plugin + permissions)

```bash
node scripts/android/patch-android.mjs
npx cap sync android
npx cap open android
```

What the patch does:
- Copies **SDK jar** → `android/app/libs/palm-sdk-classes.jar`
- Copies **jniLibs** → `android/app/src/main/jniLibs/`
- Copies **model .bin assets** → `android/app/src/main/assets/`
- Copies **SDK keys** → `android/app/src/main/res/values/palm_sdk_keys.xml`
- Copies **PalmIQSDKPlugin.java** → `android/app/src/main/java/com/palmiq/sdk/`
- Patches **MainActivity.java** to `registerPlugin(PalmIQSDKPlugin.class)`
- Adds **USB host + camera permissions** to `AndroidManifest.xml`
- Adds **jar + jniLibs sourceSets** to `android/app/build.gradle` (Groovy)

## 3) Run on device

1. Connect the palm scanner using a USB‑C OTG adapter
2. Run the app from Android Studio
3. When prompted, **grant USB permission**
4. In the app: Hardware Settings → **Native SDK** mode → Register Palm

## Notes

- If your Android project uses `android/app/build.gradle.kts`, the script will not auto-edit it; add the same jar + `sourceSets` manually.
