# Palm IQ Android SDK - Real Hardware Setup

This guide explains how to set up the real palm vein scanner SDK for Android.

## SDK Files Included

All SDK files have been organized in `android-sdk-files/`:

### Model Files (assets/)
These go in `android/app/src/main/assets/`:
- `ir_liveness_roi_160x160_en.bin` - Liveness detection model
- `palm_detection_20250530_en.bin` - Palm detection model
- `palm_filter_back_20240923_en.bin` - Background filter model
- `palm_filter_en.bin` - Palm filter model
- `palm_landmark_20250530_en.bin` - Landmark detection model
- `palm_print_20241004_fp_16_en.bin` - Palm print recognition
- `palm_vein_20240901_fp16_en.bin` - Palm vein recognition

### Native Libraries (jniLibs/)
These go in `android/app/src/main/jniLibs/`:

**arm64-v8a/** (64-bit ARM devices):
- `libcrypto.so` - Cryptography
- `libgmssl.so` - GM SSL
- `libncnn.so` - Neural network inference
- `libomp.so` - OpenMP threading
- `libopencv_java3.so` - OpenCV image processing
- `libpalm_sdk.so` - **Main Palm SDK**
- `librknntt.so` - Rockchip NPU
- `libssl.so` - SSL/TLS
- `libusb1.0.so` - USB device access

**armeabi-v7a/** (32-bit ARM devices):
Same libraries for older devices.

### Configuration
- `values.xml` - Contains app keys (appKey0-9) for SDK authorization

## Quick Setup

After exporting to GitHub and cloning:

```bash
# 1. Install dependencies
npm install

# 2. Add Android platform
npx cap add android

# 3. Copy SDK files to Android project
cp -r android-sdk-files/assets/* android/app/src/main/assets/
cp -r android-sdk-files/jniLibs/* android/app/src/main/jniLibs/

# 4. Add values.xml to Android resources
cp android-sdk-files/config/values.xml android/app/src/main/res/values/palm_sdk_keys.xml

# 5. Build and sync
npm run build
npx cap sync android

# 6. Open in Android Studio
npx cap open android
```

## SDK App Keys

The SDK uses authorization keys from `values.xml`:
```xml
<string name="appKey0">e1ca0</string>
<string name="appKey1">e1ca1</string>
...
<string name="appKey9">e1ca9</string>
```

These are loaded by the native code for SDK authorization.

## Native Bridge Implementation

The `PalmIQSDKPlugin.java` needs to load the native libraries:

```java
static {
    System.loadLibrary("palm_sdk");
    // Other libraries are loaded automatically as dependencies
}
```

## USB Device Requirements

The palm scanner connects via USB OTG. The AndroidManifest.xml requires:
```xml
<uses-feature android:name="android.hardware.usb.host" />
<uses-permission android:name="android.permission.USB_PERMISSION" />
```

Minimum SDK: 22 (Android 5.1 Lollipop)

## Testing

1. Connect palm scanner via USB-C OTG adapter
2. Launch app and grant USB permissions
3. Go to Hardware Settings → select "Native SDK"
4. Test connection

The app should detect the device and enable real palm scanning!
