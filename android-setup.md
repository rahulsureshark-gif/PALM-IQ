# Quick Android Setup Guide

## Prerequisites
- Android phone with USB OTG support
- USB-C OTG adapter
- Palm vein scanner device
- Android Studio installed on your computer

## Step-by-Step Setup

### 1. Clone and Setup Project

```bash
# Clone your repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install

# Add Android platform
npx cap add android

# Build web assets
npm run build

# Sync to Android
npx cap sync android
```

### 2. Extract and Place SDK Files

**Combine split archives:**
```bash
# Windows
copy /b src\sdk\PalmVeinSDK.zip.001+src\sdk\PalmVeinSDK.zip.002+src\sdk\PalmVeinSDK.zip.003+src\sdk\PalmVeinSDK.zip.004 PalmVeinSDK.zip

# Mac/Linux
cat src/sdk/PalmVeinSDK.zip.00* > PalmVeinSDK.zip
```

**Extract and copy files:**
```bash
unzip PalmVeinSDK.zip

# Copy AAR to libs
mkdir -p android/app/libs
cp palm-3xxx-V2.2.13.1.aar android/app/libs/

# Copy model files to assets
mkdir -p android/app/src/main/assets
cp *.bin android/app/src/main/assets/
```

### 3. Update build.gradle

Edit `android/app/build.gradle`:

```gradle
android {
    // Add inside android block
    repositories {
        flatDir {
            dirs 'libs'
        }
    }
}

dependencies {
    // Add this line
    implementation(name: 'palm-3xxx-V2.2.13.1', ext: 'aar')
}
```

### 4. Create Plugin File

Create folder structure:
```
android/app/src/main/java/com/palmiq/sdk/
```

Copy the `PalmIQSDKPlugin.java` code from `PALM_SDK_INTEGRATION_GUIDE.md` into this folder.

### 5. Update MainActivity

Find and edit `MainActivity.java` (usually in `android/app/src/main/java/app/lovable/.../MainActivity.java`):

```java
import com.palmiq.sdk.PalmIQSDKPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(PalmIQSDKPlugin.class);
    }
}
```

### 6. Update AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-feature android:name="android.hardware.usb.host" android:required="true"/>
<uses-permission android:name="android.permission.USB_PERMISSION"/>
```

### 7. Build and Run

```bash
# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Connect phone via USB
2. Enable USB debugging on phone
3. Click Run button
4. Install app

### 8. Test Palm Scanner

1. Connect palm scanner to phone via OTG
2. Open app → Palm IQ → Hardware Settings
3. Select "Native SDK" mode
4. Verify connection status shows "Connected"
5. Go to Palm Registration
6. Scan your palm!

## Troubleshooting

**Build fails:** Check AAR filename matches exactly in build.gradle

**Device not detected:** 
- Try different OTG cable
- Check USB debugging is enabled
- Grant USB permission when prompted

**SDK init fails:**
- Verify all .bin files are in assets folder
- Check file names match exactly

**Palm not recognized:**
- Hold palm 5-20cm from sensor
- Ensure good lighting
- Keep palm flat and steady
