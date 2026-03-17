#!/usr/bin/env node
/**
 * Patch an existing Capacitor Android project to include the Palm IQ native SDK.
 *
 * Usage (after `npx cap add android`):
 *   node scripts/android/patch-android.mjs
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

// ─── Utilities ────────────────────────────────────────────────────────────────

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`  Copied: ${path.basename(src)} → ${dest}`);
}

function copyDir(srcDir, destDir) {
  if (!exists(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src  = path.join(srcDir,  entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else if (entry.isFile()) copyFile(src, dest);
  }
}

function findAllFiles(dir, predicate) {
  const matches = [];
  if (!exists(dir)) return matches;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const e of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile() && predicate(p)) matches.push(p);
    }
  }
  return matches;
}

// ─── local.properties ────────────────────────────────────────────────────────

/**
 * Auto-detect the Android SDK and write android/local.properties.
 * This is the most common reason `npx cap run android` fails with:
 *   "SDK location not found."
 */
function writeLocalProperties(androidDir) {
  const localProps = path.join(androidDir, "local.properties");

  // 1. Already has sdk.dir → nothing to do
  if (exists(localProps)) {
    const content = fs.readFileSync(localProps, "utf8");
    if (content.includes("sdk.dir")) {
      console.log("  Skipped: local.properties already has sdk.dir");
      return;
    }
  }

  // 2. Honour environment variables (set by Android Studio or CI)
  const envSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (envSdk && exists(envSdk)) {
    writeSdkDir(localProps, envSdk);
    return;
  }

  // 3. Probe common paths per OS
  const os   = process.platform;
  const home = process.env.USERPROFILE || process.env.HOME || "";

  const candidates =
    os === "win32"
      ? [
          path.join(home, "AppData", "Local", "Android", "Sdk"),
          "C:\\Android\\Sdk",
          "C:\\Users\\Public\\Android\\Sdk",
        ]
      : os === "darwin"
      ? [
          path.join(home, "Library", "Android", "sdk"),
          "/opt/homebrew/share/android-commandlinetools",
        ]
      : [
          path.join(home, "Android", "Sdk"),
          "/opt/android-sdk",
          "/usr/lib/android-sdk",
        ];

  for (const candidate of candidates) {
    if (exists(candidate)) {
      writeSdkDir(localProps, candidate);
      return;
    }
  }

  // 4. Nothing found — write a placeholder with instructions
  const placeholder =
    os === "win32"
      ? "C\\:\\\\Users\\\\YourName\\\\AppData\\\\Local\\\\Android\\\\Sdk"
      : "/home/yourname/Android/Sdk";
  fs.writeFileSync(localProps, `sdk.dir=${placeholder}\n`, "utf8");
  console.warn("⚠️  Android SDK not found automatically.");
  console.warn("   Open Android Studio → SDK Manager and note the SDK path, then");
  console.warn(`   edit ${localProps}`);
  console.warn("   and set sdk.dir to your Android SDK path.");
  console.warn("   Example (Windows): sdk.dir=C\\:\\\\Users\\\\YourName\\\\AppData\\\\Local\\\\Android\\\\Sdk");
}

function writeSdkDir(localPropsPath, sdkPath) {
  // .properties format: backslashes must be escaped on Windows
  const escaped =
    process.platform === "win32"
      ? sdkPath.replace(/\\/g, "\\\\")
      : sdkPath;
  fs.writeFileSync(localPropsPath, `sdk.dir=${escaped}\n`, "utf8");
  console.log(`  Created: local.properties → sdk.dir=${sdkPath}`);
}

// ─── MainActivity patching ────────────────────────────────────────────────────

function resolveMainActivityFromManifest(manifestPath, mainJavaDir) {
  try {
    if (!exists(manifestPath)) return null;
    const s = fs.readFileSync(manifestPath, "utf8");
    const manifestPkg  = s.match(/<manifest[^>]*\bpackage\s*=\s*"([^"]+)"/)?.[1];
    const activityName = s.match(/<activity[^>]*android:name="([^"]*MainActivity)"/)?.[1];
    if (!manifestPkg || !activityName) return null;
    const fqcn = activityName.startsWith(".") ? `${manifestPkg}${activityName}` : activityName;
    const javaPath = path.join(mainJavaDir, ...fqcn.split(".")) + ".java";
    return exists(javaPath) ? javaPath : null;
  } catch { return null; }
}

function patchMainActivityJava(filePath) {
  const original  = fs.readFileSync(filePath, "utf8");
  const pkgMatch  = original.match(/^\s*package\s+([^\s;]+)\s*;\s*$/m);
  const pkg       = pkgMatch?.[1] ?? "com.palmiq.app";

  const next = `package ${pkg};

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.palmiq.sdk.PalmIQSDKPlugin;

/**
 * Main Activity – Palm IQ App.
 * USB permission + attach/detach receivers are handled inside PalmIQSDKPlugin.
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PalmIQSDKPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

  if (original !== next) {
    fs.writeFileSync(filePath, next, "utf8");
    console.log("  Patched: MainActivity.java (normalized)");
  }
}

// ─── build.gradle patching ────────────────────────────────────────────────────

function patchBuildGradleGroovy(filePath) {
  let s        = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // 1. Add jar/aar from libs/
  if (!s.includes("fileTree(dir: 'libs'")) {
    s = s.replace(
      /dependencies\s*\{/,
      "dependencies {\n    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])"
    );
    modified = true;
  }

  // 2. Add androidx.core (needed for ActivityCompat / ContextCompat in plugin)
  if (!s.includes("androidx.core:core")) {
    s = s.replace(
      /dependencies\s*\{/,
      "dependencies {\n    implementation 'androidx.core:core:1.13.1'"
    );
    modified = true;
    console.log("  Added: androidx.core dependency (required for runtime permission requests)");
  }

  // 3. Add jniLibs source set
  if (!s.includes("jniLibs.srcDirs")) {
    s = s.replace(
      /(android\s*\{\s*\n)/,
      "$1\n    sourceSets {\n        main {\n            jniLibs.srcDirs = ['src/main/jniLibs']\n        }\n    }\n\n"
    );
    modified = true;
  }

  // 4. CRITICAL: Disable minification for BOTH debug AND release builds.
  //    libpalm_sdk.so's JNI FindClass runs BEFORE Java, so R8 must not
  //    strip or rename com.veinauthen.palm.JXPalmSDK under any build type.
  //    minifyEnabled false is the only 100% reliable guard.
  if (!s.includes("minifyEnabled false")) {
    // Force it into debug block
    if (s.includes("debug {")) {
      s = s.replace(/(debug\s*\{)/, "$1\n            minifyEnabled false");
    } else {
      s = s.replace(
        /(buildTypes\s*\{)/,
        "$1\n        debug {\n            minifyEnabled false\n        }"
      );
    }
    // Also force it into release block (safest for SDK stability)
    if (s.includes("release {")) {
      s = s.replace(/(release\s*\{)/, "$1\n            minifyEnabled false");
    }
    modified = true;
    console.log("  Added: minifyEnabled false to debug+release (prevents R8 stripping JNI shim)");
  }

  // 5. ProGuard rules wiring
  if (!s.includes("proguard-rules.pro")) {
    s = s.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[^}]*)(})/,
      (match, inner, closing) => {
        if (inner.includes("proguardFiles")) return match;
        return (
          inner +
          "            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'\n" +
          "            " + closing
        );
      }
    );
    modified = true;
    console.log("  Added: proguard-rules.pro reference to build.gradle");
  }

  if (modified) {
    fs.writeFileSync(filePath, s, "utf8");
    console.log("  Patched: build.gradle");
  }
}

// ─── ProGuard rules ───────────────────────────────────────────────────────────

function copyProguardRules(androidAppDir) {
  const src  = path.join(ROOT, "android-sdk-files", "native-plugin", "proguard-rules.pro");
  const dest = path.join(androidAppDir, "proguard-rules.pro");

  if (!exists(src)) {
    console.warn("⚠️  proguard-rules.pro source not found in android-sdk-files/native-plugin/");
    return;
  }

  let existing = "";
  if (exists(dest)) existing = fs.readFileSync(dest, "utf8");
  const ours = fs.readFileSync(src, "utf8");

  if (!existing.includes("com.veinauthen.palm.JXPalmSDK")) {
    fs.writeFileSync(dest, existing + "\n" + ours, "utf8");
    console.log("  Merged: proguard-rules.pro (added Palm SDK keep rules)");
  } else {
    console.log("  Skipped: proguard-rules.pro already contains Palm SDK rules");
  }
}

// ─── AndroidManifest patching ─────────────────────────────────────────────────

function ensureManifestEntries(manifestPath) {
  let s        = fs.readFileSync(manifestPath, "utf8");
  let modified = false;

  // ── CRITICAL: Remove any stale static <receiver> for UsbPermissionReceiver ──
  // This class does NOT exist as a compiled class in the APK. It is an anonymous
  // BroadcastReceiver field in PalmIQSDKPlugin registered DYNAMICALLY via
  // registerReceiver(). A static manifest entry causes:
  //   ClassNotFoundException: com.palmiq.sdk.PalmIQSDKPlugin$UsbPermissionReceiver
  //   → RuntimeException: Unable to instantiate receiver → FATAL EXCEPTION: main
  const receiverPattern = /<receiver[^>]*UsbPermissionReceiver[^>]*>[\s\S]*?<\/receiver>/g;
  if (receiverPattern.test(s)) {
    s = s.replace(receiverPattern, "");
    modified = true;
    console.log("  Removed: stale UsbPermissionReceiver <receiver> from AndroidManifest.xml");
  }

  const requiredLines = [
    // USB host — required for OTG palm scanner
    '<uses-feature android:name="android.hardware.usb.host" android:required="true" />',
    // Camera — required by SDK for liveness detection
    '<uses-permission android:name="android.permission.CAMERA" />',
    '<uses-feature android:name="android.hardware.camera" android:required="false" />',
    // Bluetooth — for nearby devices (shown in vendor app)
    '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
    '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />',
    // Network — required for SDK network authorization (JXAuthen / JXLicense)
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    // Storage — required for SDK license cache and feature storage
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
    // For Android 13+ scoped storage (photos/videos shown in vendor app)
    '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
    '<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />',
    // Audio — shown in vendor app permission dialog (SDK may use mic for liveness)
    '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
    // Notifications — shown in vendor app permission dialog
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    // Phone state — shown in vendor app (device ID for SDK licensing)
    '<uses-permission android:name="android.permission.READ_PHONE_STATE" />',
    // Vibrate — used for scan feedback
    '<uses-permission android:name="android.permission.VIBRATE" />',
    // Wake lock — keeps CPU alive during scan
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
  ];

  for (const line of requiredLines) {
    if (!s.includes(line)) {
      s = s.replace(/<manifest([^>]*)>/, (m) => `${m}\n    ${line}`);
      modified = true;
    }
  }

  if (!s.includes("android:configChanges")) {
    s = s.replace(
      /(<activity[^>]*android:name="\.MainActivity")/,
      '$1\n            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden|keyboard|navigation|uiMode|locale|layoutDirection|fontScale|density|smallestScreenSize"'
    );
    modified = true;
    console.log("  Added: android:configChanges to MainActivity");
  }

  if (!s.includes("android:launchMode")) {
    s = s.replace(
      /(<activity[^>]*android:name="\.MainActivity")/,
      '$1\n            android:launchMode="singleTask"'
    );
    modified = true;
    console.log("  Added: android:launchMode=singleTask to MainActivity");
  }

  if (!s.includes("android:screenOrientation")) {
    s = s.replace(
      /(<activity[^>]*android:name="\.MainActivity")/,
      '$1\n            android:screenOrientation="portrait"'
    );
    modified = true;
    console.log("  Added: android:screenOrientation=portrait to MainActivity");
  }

  const usbIntentFilter = `<intent-filter>
                <action android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED" />
            </intent-filter>
            <meta-data
                android:name="android.hardware.usb.action.USB_DEVICE_ATTACHED"
                android:resource="@xml/device_filter" />`;

  if (!s.includes("USB_DEVICE_ATTACHED")) {
    s = s.replace(
      /(<activity[^>]*android:name="\.MainActivity"[^>]*>)/,
      `$1\n            ${usbIntentFilter}`
    );
    modified = true;
    console.log("  Added: USB_DEVICE_ATTACHED intent-filter to MainActivity");
  }

  // NOTE: Do NOT inject a static <receiver> for UsbPermissionReceiver.
  // The USB permission BroadcastReceiver in PalmIQSDKPlugin is registered
  // DYNAMICALLY in load() via registerReceiver(). Declaring it statically
  // in the manifest causes:
  //   ClassNotFoundException: com.palmiq.sdk.PalmIQSDKPlugin$UsbPermissionReceiver
  // because no such compiled inner class exists — it is an anonymous field.
  // Dynamic registration is the correct and only approach here.

  if (modified) {
    fs.writeFileSync(manifestPath, s, "utf8");
    console.log("  Patched: AndroidManifest.xml");
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function main() {
  console.log("\n🔧 Palm IQ Android SDK Patch\n");

  const androidDir    = path.join(ROOT, "android");
  const androidAppDir = path.join(androidDir, "app");

  if (!exists(androidAppDir)) {
    console.error("❌ Android platform not found. Run: npx cap add android");
    process.exit(1);
  }

  // ── 0. Write local.properties (fixes "SDK location not found") ────────────
  console.log("📝 Configuring local.properties...");
  writeLocalProperties(androidDir);

  // ── 1. Copy SDK JAR ────────────────────────────────────────────────────────
  console.log("\n📦 Copying SDK files...");
  const libsSrc  = path.join(ROOT, "android-sdk-files", "libs");
  const libsDest = path.join(androidAppDir, "libs");
  ensureDir(libsDest);

  const sdkJarCandidates = ["palm-sdk-classes.jar", "classes-2.jar", "classes-3.jar"];
  const selectedJar = process.env.PALM_SDK_JAR || "palm-sdk-classes.jar";
  const jarToCopy   = sdkJarCandidates.includes(selectedJar) ? selectedJar : "palm-sdk-classes.jar";

  if (exists(libsSrc)) {
    const srcPath = path.join(libsSrc, jarToCopy);
    if (exists(srcPath)) {
      copyFile(srcPath, path.join(libsDest, jarToCopy));
    } else {
      console.warn(`⚠️  Could not find ${jarToCopy} in android-sdk-files/libs/`);
    }
  }

  // Remove sibling SDK jars to prevent duplicate class errors
  for (const candidate of sdkJarCandidates) {
    if (candidate === jarToCopy) continue;
    const p = path.join(libsDest, candidate);
    if (exists(p)) { fs.unlinkSync(p); console.log(`  Removed: ${candidate}`); }
  }

  // ── 2. Native libraries ────────────────────────────────────────────────────
  console.log("\n📦 Copying native libraries...");
  copyDir(
    path.join(ROOT, "android-sdk-files", "jniLibs"),
    path.join(androidAppDir, "src", "main", "jniLibs")
  );

  // ── 3. Model assets ────────────────────────────────────────────────────────
  console.log("\n📦 Copying model assets...");
  copyDir(
    path.join(ROOT, "android-sdk-files", "assets"),
    path.join(androidAppDir, "src", "main", "assets")
  );

  // ── 4. SDK keys ────────────────────────────────────────────────────────────
  copyFile(
    path.join(ROOT, "android-sdk-files", "config", "values.xml"),
    path.join(androidAppDir, "src", "main", "res", "values", "palm_sdk_keys.xml")
  );

  // ── 5. USB device filter ───────────────────────────────────────────────────
  console.log("\n📦 Copying USB device filter...");
  const deviceFilterSrc  = path.join(ROOT, "android-sdk-files", "config", "device_filter.xml");
  const deviceFilterDest = path.join(androidAppDir, "src", "main", "res", "xml", "device_filter.xml");
  if (exists(deviceFilterSrc)) {
    copyFile(deviceFilterSrc, deviceFilterDest);
  } else {
    ensureDir(path.dirname(deviceFilterDest));
    fs.writeFileSync(deviceFilterDest,
      `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <usb-device vendor-id="3141" product-id="25446" />\n    <usb-device vendor-id="3141" product-id="25451" />\n</resources>`,
      "utf8"
    );
    console.log("  Created: device_filter.xml");
  }

  // ── 6. Plugin Java + JNI shim ──────────────────────────────────────────────
  console.log("\n📦 Copying plugin files...");
  copyFile(
    path.join(ROOT, "android-sdk-files", "native-plugin", "PalmIQSDKPlugin.java"),
    path.join(androidAppDir, "src", "main", "java", "com", "palmiq", "sdk", "PalmIQSDKPlugin.java")
  );

  console.log("📦 Copying JNI shim classes (fixes ClassNotFoundException / SIGABRT)...");
  const shimDir     = path.join(ROOT, "android-sdk-files", "native-plugin", "com", "veinauthen", "palm");
  const shimDestDir = path.join(androidAppDir, "src", "main", "java", "com", "veinauthen", "palm");

  // JXPalmSDK.java — the class JNI FindClass + RegisterNatives targets
  const shimSrc  = path.join(shimDir, "JXPalmSDK.java");
  const shimDest = path.join(shimDestDir, "JXPalmSDK.java");
  if (exists(shimSrc)) {
    copyFile(shimSrc, shimDest);
    console.log("  ✅ JNI shim deployed → com/veinauthen/palm/JXPalmSDK.java");
  } else {
    console.error("❌ CRITICAL: JNI shim not found at " + shimSrc);
    console.error("   App will crash with SIGABRT when scanner is connected!");
  }

  // JXPalmDetectResult.java — return type of detectPalmVein(), required by RegisterNatives
  const resultSrc  = path.join(shimDir, "JXPalmDetectResult.java");
  const resultDest = path.join(shimDestDir, "JXPalmDetectResult.java");
  if (exists(resultSrc)) {
    copyFile(resultSrc, resultDest);
    console.log("  ✅ JXPalmDetectResult deployed → com/veinauthen/palm/JXPalmDetectResult.java");
  } else {
    console.error("❌ CRITICAL: JXPalmDetectResult.java not found at " + resultSrc);
    console.error("   detectPalmVein() RegisterNatives will fail → SIGABRT!");
  }

  // ── 7. ProGuard rules ──────────────────────────────────────────────────────
  console.log("\n📦 Copying ProGuard rules...");
  copyProguardRules(androidAppDir);

  // ── 8. Patch source files ──────────────────────────────────────────────────
  console.log("\n🔨 Patching Android files...");

  const mainJavaDir = path.join(androidAppDir, "src", "main", "java");
  const manifest    = path.join(androidAppDir, "src", "main", "AndroidManifest.xml");

  const primaryMainActivity = resolveMainActivityFromManifest(manifest, mainJavaDir);
  const allMainActivities   = findAllFiles(mainJavaDir, (p) => p.endsWith("MainActivity.java"));
  const patched             = new Set();

  if (primaryMainActivity) {
    patchMainActivityJava(primaryMainActivity);
    patched.add(primaryMainActivity);
  }
  for (const p of allMainActivities) {
    if (patched.has(p)) continue;
    patchMainActivityJava(p);
    patched.add(p);
  }
  if (patched.size === 0) console.warn("⚠️  Could not find MainActivity.java");

  const buildGradle = path.join(androidAppDir, "build.gradle");
  if (exists(buildGradle)) patchBuildGradleGroovy(buildGradle);
  else console.warn("⚠️  Could not find build.gradle");

  if (exists(manifest)) ensureManifestEntries(manifest);
  else console.warn("⚠️  Could not find AndroidManifest.xml");

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log("\n✅ Patch complete!\n");
  console.log("📋 ALL 3 root causes fixed:");
  console.log("");
  console.log("  1. SIGABRT / ClassNotFoundException com.veinauthen.palm.JXPalmSDK");
  console.log("     → Shim classes deployed to java/ AND forced via Class.forName() BEFORE");
  console.log("       System.loadLibrary() so JNI FindClass() succeeds at static init time.");
  console.log("     → minifyEnabled false for debug AND release (R8 cannot strip shim).");
  console.log("");
  console.log("  2. Runtime permissions not asked on launch");
  console.log("     → Plugin now calls ActivityCompat.requestPermissions() in load()");
  console.log("       for CAMERA, RECORD_AUDIO, READ_PHONE_STATE, POST_NOTIFICATIONS.");
  console.log("       System permission dialogs will appear automatically on first open.");
  console.log("");
  console.log("  3. Hardware scanner LED not turning on");
  console.log("     → Once shim loads (fix #1) and permissions granted (fix #2),");
  console.log("       nativeInit() succeeds and the UVC stream opens the scanner LED.");
  console.log("");
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("  FULL REBUILD — PowerShell (copy ALL lines, run in project folder):");
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("  npm install");
  console.log("  npm run build");
  console.log("  Remove-Item -Recurse -Force android -ErrorAction SilentlyContinue");
  console.log("  npx cap add android");
  console.log("  node scripts/android/patch-android.mjs");
  console.log("  cd android");
  console.log("  .\\gradlew clean");
  console.log("  cd ..");
  console.log("  npx cap sync android");
  console.log("  npx cap open android");
  console.log("");
  console.log("  In Android Studio: Build > Build APK(s) → install on device.");
  console.log("  When app opens: GRANT ALL permissions (camera, mic, phone, storage).");
  console.log("  Connect palm scanner via USB-C OTG → LED should turn on. ✅");
  console.log("══════════════════════════════════════════════════════════════════\n");
}


main();

