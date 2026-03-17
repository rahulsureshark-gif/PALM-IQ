# Palm IQ - Complete Android Setup Guide

All SDK files are included in this project. Follow these steps to build the Android APK with real palm hardware support.

## Quick Start (10 Minutes)

### Step 1: Export & Clone
```bash
# 1. Click "Export to GitHub" in Lovable
# 2. Clone your repo
git clone https://github.com/YOUR_USERNAME/palm-iq.git
cd palm-iq
```

### Step 2: Install & Add Android
```bash
npm install
npx cap add android
npm run build
npx cap sync android
```

### Step 3: Run the Automated Patch
```bash
node scripts/android/patch-android.mjs
```

This automatically:
- ✅ Copies all JAR/AAR files to `android/app/libs/`
- ✅ Copies native `.so` libraries to `android/app/src/main/jniLibs/`
- ✅ Copies 7 model `.bin` files to `android/app/src/main/assets/`
- ✅ Copies `device_filter.xml` for USB auto-launch
- ✅ Copies `PalmIQSDKPlugin.java` to correct package
- ✅ Patches `MainActivity.java` with plugin registration
- ✅ Patches `build.gradle` with library dependencies
- ✅ Patches `AndroidManifest.xml` with USB permissions and auto-launch intent

### Step 4: Clean & Sync (MANDATORY)
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Step 5: Build & Run
```bash
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Connect your phone (USB debugging enabled)
3. Click Run ▶️

---

## USB Hardware Auto-Launch

After building, when you connect the palm scanner via USB-C OTG:

1. **App auto-opens** (or prompts to open if already installed)
2. **USB permission dialog** appears automatically
3. **Grant permission** to allow the app to access the scanner
4. Go to **Hardware Settings → Test Connection** to verify

---

## Testing Real Palm Scanner

1. Connect palm scanner to phone via USB-C OTG adapter
2. App will auto-open or show permission dialog
3. Grant USB permission when prompted
4. Open app → **Palm IQ** → **Hardware Settings**
5. Select **"Native SDK"** mode
6. Tap **"Test Connection"** - should show ✅ Connected
7. Go to **Palm Registration**
8. Select hand → Scan your REAL palm!

---

## SDK Files Reference

All files are in `android-sdk-files/`:

| Folder | Contents |
|--------|----------|
| `assets/` | 7 model `.bin` files for palm recognition |
| `jniLibs/arm64-v8a/` | Native `.so` libraries (64-bit) |
| `jniLibs/armeabi-v7a/` | Native `.so` libraries (32-bit) |
| `libs/` | `palm-sdk-classes.jar` and other JARs |
| `native-plugin/` | `PalmIQSDKPlugin.java` |
| `config/` | `device_filter.xml` for USB auto-launch |
| `headers/` | C headers (for reference) |
| `docs/` | Official SDK documentation |

---

## Troubleshooting

### Build fails with "cannot find symbol"?
```bash
cd android && ./gradlew clean && cd ..
npx cap sync android
node scripts/android/patch-android.mjs
npx cap sync android
```

### USB permission not showing?
- Make sure `device_filter.xml` exists at `android/app/src/main/res/xml/`
- Check AndroidManifest has `USB_DEVICE_ATTACHED` intent filter
- Try unplugging and re-plugging the scanner

### Device not detected?
- Try different USB-C OTG cable
- Check scanner LEDs are on when connected
- Run debug: In app, go to Hardware Settings → tap "List USB Devices"

### Palm scan fails?
- Hold palm 5-20cm from scanner
- Keep palm flat and steady
- Ensure good lighting
- Make sure scanner infrared LEDs are active

### App crashes on startup?
- This was fixed by deferring SDK init
- If still happening, check logcat for errors:
```bash
adb logcat | grep PalmIQSDK
```

---

## Hardware Identification

The palm scanner uses:
- **Vendor ID (VID)**: `0x0C45` (3141 decimal) - Sonix Technology
- **Product ID (PID)**: `0x6366` (25446 decimal)

---

## Important: Keep Build Stable

After a successful build:
- ❌ Do NOT rename packages
- ❌ Do NOT move SDK files
- ❌ Do NOT edit MainActivity unless required
- ✅ Only modify via the patch script

---

## Features Ready to Use

✅ USB auto-launch when scanner connected  
✅ USB permission dialog handling  
✅ Real palm registration via USB hardware  
✅ Real palm matching for Palm Pay  
✅ Liveness detection (anti-spoofing)  
✅ PIN + Palm dual authentication  
✅ Demo wallet with realistic payment flow  

---

**The native plugin (PalmIQSDKPlugin.java) is fully implemented with USB permission handling!**
