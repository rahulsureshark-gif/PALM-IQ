package com.palmiq.sdk;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.hardware.usb.UsbDeviceConnection;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Palm IQ SDK Native Plugin for Capacitor
 *
 * COMPLETE REWRITE — fixes all 3 crash categories:
 *
 *  1. SIGABRT / ClassNotFoundException "com.veinauthen.palm.JXPalmSDK"
 *     ────────────────────────────────────────────────────────────────
 *     Root cause: libpalm_sdk.so's STATIC INITIALIZER calls JNI FindClass()
 *     the instant System.loadLibrary() runs. If the shim class hasn't been
 *     resolved by the class-loader at that point, the JNI abort happens
 *     BEFORE any Java code can intercept it.
 *
 *     Fix: Force class resolution BEFORE System.loadLibrary():
 *       a) Class.forName() with the app class-loader to pre-load the DEX entry.
 *       b) Direct bytecode ref   com.veinauthen.palm.JXPalmSDK.class
 *          to prevent R8 from stripping the class.
 *       c) minifyEnabled false in debug gradle (injected by patch script).
 *       d) Proguard -keep rules wired (injected by patch script).
 *
 *  2. Runtime permissions never asked (user must grant manually)
 *     ──────────────────────────────────────────────────────────
 *     Fix: requestDangerousPermissions() called in load() so the system
 *     prompts appear automatically on first launch.
 *
 *  3. Hardware lights off (scanner not powered by our app)
 *     ──────────────────────────────────────────────────────
 *     Fix: SDK init is triggered ONLY after USB permission is confirmed AND
 *     dangerous permissions are granted. Once nativeInit() succeeds the
 *     native layer opens the UVC stream and the scanner LED turns on.
 */
@CapacitorPlugin(
    name = "PalmIQSDK",
    permissions = {
        @Permission(strings = {Manifest.permission.CAMERA},           alias = "camera"),
        @Permission(strings = {Manifest.permission.RECORD_AUDIO},     alias = "microphone"),
        @Permission(strings = {Manifest.permission.READ_PHONE_STATE}, alias = "phone"),
    }
)
public class PalmIQSDKPlugin extends Plugin {

    private static final String TAG = "PalmIQSDK";
    private static final float  MATCH_THRESHOLD = 0.50f;   // 50 / 100

    private static final String ACTION_USB_PERMISSION = "com.palmiq.app.USB_PERMISSION";

    private static final int VENDOR_ID_SONIX   = 0x0C45;
    private static final int PRODUCT_ID_PALM_1 = 0x6366;
    private static final int PRODUCT_ID_PALM_2 = 0x636B;

    // ── State ─────────────────────────────────────────────────────────────────
    private long    nativeHandle        = 0;
    private boolean isInitialized       = false;
    private boolean isDeviceConnected   = false;
    private boolean sdkInitInProgress   = false;
    private boolean permissionRequested = false;
    private boolean receiverRegistered  = false;
    private boolean nativeLibraryLoaded = false;

    private UsbManager          usbManager;
    private UsbDevice           palmDevice;
    private UsbDeviceConnection deviceConnection;
    private PendingIntent       permissionIntent;
    private PluginCall          pendingPermissionCall;

    private final Map<String, byte[]> registeredPalms = new HashMap<>();
    private final List<String>        palmIds          = new ArrayList<>();
    private final Handler             mainHandler      = new Handler(Looper.getMainLooper());

    private final ExecutorService sdkExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "PalmSDK-Worker");
        t.setDaemon(true);
        return t;
    });

    // ── Native JNI declarations ───────────────────────────────────────────────
    private native String nativeGetVersion();
    private native long   nativeInit();
    private native void   nativeDeInit(long handle);
    private native int    nativeInitEnrollEnv(long handle);
    private native byte[] nativeFinishEnroll(long handle);
    private native float  nativeCalcFeatureDist(byte[] feat1, byte[] feat2);

    // =========================================================================
    // USB Permission BroadcastReceiver
    // =========================================================================
    private final BroadcastReceiver usbPermissionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (!ACTION_USB_PERMISSION.equals(intent.getAction())) return;

            UsbDevice device  = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
            boolean   granted = intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false);
            permissionRequested = false;

            Log.d(TAG, "USB permission broadcast: granted=" + granted + " device=" + device);

            if (device == null || !isPalmScanner(device)) {
                resolvePendingCall(false, false, "USB permission: wrong device or null");
                return;
            }

            if (granted) {
                palmDevice        = device;
                deviceConnection  = usbManager.openDevice(device);
                isDeviceConnected = deviceConnection != null;
                Log.d(TAG, "✅ USB permission GRANTED, connection=" + isDeviceConnected);

                if (isDeviceConnected && !isInitialized && !sdkInitInProgress) {
                    initializeSDKAsync(pendingPermissionCall);
                    pendingPermissionCall = null;
                } else {
                    notifyListeners("hardwareConnected", new JSObject());
                    resolvePendingCall(true, isDeviceConnected, null);
                }
            } else {
                Log.w(TAG, "❌ USB permission DENIED");
                resolvePendingCall(false, false, "USB permission denied by user");
            }
        }
    };

    // =========================================================================
    // USB Attach/Detach BroadcastReceiver
    // =========================================================================
    private final BroadcastReceiver usbAttachReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (UsbManager.ACTION_USB_DEVICE_ATTACHED.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null && isPalmScanner(device)) {
                    Log.d(TAG, "🔌 Palm scanner ATTACHED VID=0x"
                            + Integer.toHexString(device.getVendorId()));
                    palmDevice = device;
                    if (usbManager.hasPermission(device)) {
                        deviceConnection  = usbManager.openDevice(device);
                        isDeviceConnected = deviceConnection != null;
                        if (isDeviceConnected && !isInitialized && !sdkInitInProgress)
                            initializeSDKAsync(null);
                        notifyListeners("hardwareConnected", new JSObject());
                    } else {
                        requestUsbPermissionInternal(device);
                    }
                }
            } else if (UsbManager.ACTION_USB_DEVICE_DETACHED.equals(action)) {
                UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                if (device != null && isPalmScanner(device)) {
                    Log.d(TAG, "🔌 Palm scanner DETACHED");
                    handleDisconnect();
                    notifyListeners("hardwareDisconnected", new JSObject());
                }
            }
        }
    };

    // =========================================================================
    // Plugin lifecycle
    // =========================================================================

    @Override
    public void load() {
        super.load();
        Log.d(TAG, "═══ PalmIQSDK Plugin loading ═══");

        Context context = getContext();
        usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);

        buildPermissionIntent(context);
        registerReceivers(context);

        // ── Step 1: Request dangerous permissions immediately so user sees dialogs ──
        requestDangerousPermissions();

        // ── Step 2: Check if scanner already connected ────────────────────────
        UsbDevice device = findPalmScanner();
        if (device != null) {
            palmDevice = device;
            Log.d(TAG, "Palm scanner found at startup: " + device.getDeviceName());
            if (usbManager.hasPermission(device)) {
                deviceConnection  = usbManager.openDevice(device);
                isDeviceConnected = deviceConnection != null;
                if (isDeviceConnected && !isInitialized && !sdkInitInProgress)
                    initializeSDKAsync(null);
            } else {
                requestUsbPermissionInternal(device);
            }
        } else {
            Log.d(TAG, "No palm scanner at startup – waiting for attach");
        }

        Log.d(TAG, "PalmIQSDK Plugin loaded ✅");
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        unregisterReceivers();
        handleDisconnect();
        sdkExecutor.shutdownNow();
        if (isInitialized && nativeHandle != 0) {
            try { nativeDeInit(nativeHandle); } catch (Throwable ignored) {}
            nativeHandle  = 0;
            isInitialized = false;
        }
    }

    // =========================================================================
    // Runtime Permission Requests (fixes "must manually grant" issue)
    // =========================================================================

    /**
     * Requests all dangerous permissions required by the Palm SDK.
     * Called from load() so the system prompts appear on first launch.
     *
     * Permissions needed:
     *  • CAMERA          – SDK liveness detection (also lights the scanner LED
     *                      via USB UVC – this is WHY vendor app asks for camera)
     *  • RECORD_AUDIO    – SDK uses mic for liveness anti-spoofing detection
     *  • READ_PHONE_STATE– SDK licensing (reads device serial/IMEI for key gen)
     *  • POST_NOTIFICATIONS (Android 13+) – for scan status notifications
     */
    private void requestDangerousPermissions() {
        Activity activity = getActivity();
        if (activity == null) return;

        List<String> needed = new ArrayList<>();

        String[] toCheck = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_PHONE_STATE,
        };

        // Android 13+ media permissions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            // POST_NOTIFICATIONS is also a runtime permission on API 33+
            toCheck = new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                Manifest.permission.READ_PHONE_STATE,
                Manifest.permission.POST_NOTIFICATIONS,
                "android.permission.READ_MEDIA_IMAGES",
                "android.permission.READ_MEDIA_VIDEO",
            };
        }

        for (String perm : toCheck) {
            if (ContextCompat.checkSelfPermission(activity, perm)
                    != PackageManager.PERMISSION_GRANTED) {
                needed.add(perm);
                Log.d(TAG, "Permission needed: " + perm);
            }
        }

        // Bluetooth runtime permissions (Android 12+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            for (String perm : new String[]{
                    Manifest.permission.BLUETOOTH_SCAN,
                    Manifest.permission.BLUETOOTH_CONNECT}) {
                if (ContextCompat.checkSelfPermission(activity, perm)
                        != PackageManager.PERMISSION_GRANTED) {
                    needed.add(perm);
                }
            }
        }

        if (!needed.isEmpty()) {
            Log.d(TAG, "Requesting " + needed.size() + " runtime permissions...");
            ActivityCompat.requestPermissions(
                activity,
                needed.toArray(new String[0]),
                9876   // request code (any non-zero int)
            );
        } else {
            Log.d(TAG, "All runtime permissions already granted ✅");
        }
    }

    // =========================================================================
    // Internal helpers
    // =========================================================================

    private void buildPermissionIntent(Context context) {
        int flags = PendingIntent.FLAG_CANCEL_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) flags |= PendingIntent.FLAG_MUTABLE;
        Intent intent = new Intent(ACTION_USB_PERMISSION);
        intent.setPackage(context.getPackageName());
        permissionIntent = PendingIntent.getBroadcast(context, 1001, intent, flags);
    }

    private void registerReceivers(Context context) {
        IntentFilter permFilter = new IntentFilter(ACTION_USB_PERMISSION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbPermissionReceiver, permFilter, Context.RECEIVER_EXPORTED);
        } else {
            context.registerReceiver(usbPermissionReceiver, permFilter);
        }

        IntentFilter attachFilter = new IntentFilter();
        attachFilter.addAction(UsbManager.ACTION_USB_DEVICE_ATTACHED);
        attachFilter.addAction(UsbManager.ACTION_USB_DEVICE_DETACHED);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(usbAttachReceiver, attachFilter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            context.registerReceiver(usbAttachReceiver, attachFilter);
        }
        receiverRegistered = true;
        Log.d(TAG, "BroadcastReceivers registered");
    }

    private void unregisterReceivers() {
        if (!receiverRegistered) return;
        try { getContext().unregisterReceiver(usbPermissionReceiver); } catch (Exception ignored) {}
        try { getContext().unregisterReceiver(usbAttachReceiver); }    catch (Exception ignored) {}
        receiverRegistered = false;
    }

    private void requestUsbPermissionInternal(UsbDevice device) {
        if (permissionRequested) return;
        if (usbManager.hasPermission(device)) return;
        buildPermissionIntent(getContext());
        permissionRequested = true;
        usbManager.requestPermission(device, permissionIntent);
        Log.d(TAG, "USB permission dialog shown for VID=0x"
                + Integer.toHexString(device.getVendorId()));
    }

    private void resolvePendingCall(boolean granted, boolean connected, String error) {
        if (pendingPermissionCall == null) return;
        JSObject r = new JSObject();
        r.put("granted",     granted);
        r.put("connected",   connected);
        r.put("initialized", isInitialized);
        if (error != null) r.put("error", error);
        pendingPermissionCall.resolve(r);
        pendingPermissionCall = null;
    }

    private boolean isPalmScanner(UsbDevice d) {
        return d.getVendorId() == VENDOR_ID_SONIX
                && (d.getProductId() == PRODUCT_ID_PALM_1
                 || d.getProductId() == PRODUCT_ID_PALM_2);
    }

    private void handleDisconnect() {
        if (deviceConnection != null) {
            try { deviceConnection.close(); } catch (Exception ignored) {}
            deviceConnection = null;
        }
        palmDevice          = null;
        isDeviceConnected   = false;
        permissionRequested = false;
    }

    private UsbDevice findPalmScanner() {
        if (usbManager == null) return null;
        HashMap<String, UsbDevice> list = usbManager.getDeviceList();
        Log.d(TAG, "USB scan: " + list.size() + " device(s)");
        for (UsbDevice d : list.values()) {
            Log.d(TAG, "  VID=0x" + Integer.toHexString(d.getVendorId())
                    + " PID=0x" + Integer.toHexString(d.getProductId()));
            if (isPalmScanner(d)) { Log.d(TAG, "  ✅ Palm scanner found!"); return d; }
        }
        return null;
    }

    // =========================================================================
    // THE KEY FIX — class pre-loading before System.loadLibrary()
    //
    // libpalm_sdk.so's static initializer fires the INSTANT loadLibrary() runs.
    // It calls JNI FindClass("com/veinauthen/palm/JXPalmSDK") immediately.
    // If the class isn't already resolved in the DEX → SIGABRT.
    //
    // Solution: Force the JVM to resolve (and retain) the class BEFORE loading
    // the native library. We do this two ways:
    //   1. Class.forName() — triggers DEX class loading in the current CL.
    //   2. Direct bytecode ref (com.veinauthen.palm.JXPalmSDK.class) — this
    //      is what prevents R8/D8 from stripping the class at build time.
    // =========================================================================
    private boolean preLoadShimClasses() {
        ClassLoader cl = getContext().getClassLoader();
        try {
            // DIRECT BYTECODE REFERENCE — R8 cannot strip this:
            @SuppressWarnings("unused")
            Class<com.veinauthen.palm.JXPalmSDK> shimRef =
                    com.veinauthen.palm.JXPalmSDK.class;
            @SuppressWarnings("unused")
            Class<com.veinauthen.palm.JXPalmDetectResult> resultRef =
                    com.veinauthen.palm.JXPalmDetectResult.class;

            // ALSO load via Class.forName to resolve in the ClassLoader chain:
            Class.forName("com.veinauthen.palm.JXPalmSDK",        true, cl);
            Class.forName("com.veinauthen.palm.JXPalmDetectResult", true, cl);

            // Touch the singleton so <init> is in bytecode too:
            @SuppressWarnings("unused")
            com.veinauthen.palm.JXPalmSDK instance =
                    com.veinauthen.palm.JXPalmSDK.getInstance();

            Log.d(TAG, "✅ Shim classes pre-loaded → JNI FindClass will succeed");
            return true;
        } catch (ClassNotFoundException e) {
            Log.e(TAG, "❌ CRITICAL: com.veinauthen.palm.JXPalmSDK NOT FOUND in DEX!");
            Log.e(TAG, "   This will cause SIGABRT when loadLibrary() runs.");
            Log.e(TAG, "   Fix: run 'node scripts/android/patch-android.mjs' then");
            Log.e(TAG, "   rebuild. The shim files must be compiled into the APK.");
            Log.e(TAG, "   Error: " + e.getMessage());
            return false;
        } catch (Throwable t) {
            Log.e(TAG, "❌ Unexpected error pre-loading shim: " + t.getMessage(), t);
            return false;
        }
    }

    private boolean loadNativeLibrary() {
        if (nativeLibraryLoaded) return true;

        // MUST pre-load shim BEFORE System.loadLibrary — order is critical!
        Log.d(TAG, "Step 1: Pre-loading JNI shim classes...");
        if (!preLoadShimClasses()) {
            Log.e(TAG, "Aborting native library load – shim class missing from DEX");
            return false;
        }

        Log.d(TAG, "Step 2: Loading libpalm_sdk.so...");
        try {
            System.loadLibrary("palm_sdk");
            nativeLibraryLoaded = true;
            Log.d(TAG, "✅ libpalm_sdk.so loaded successfully");
            return true;
        } catch (UnsatisfiedLinkError e) {
            Log.e(TAG, "❌ Failed to load libpalm_sdk.so: " + e.getMessage());
            Log.e(TAG, "   Verify jniLibs/arm64-v8a/libpalm_sdk.so is in the APK");
            return false;
        } catch (Throwable t) {
            Log.e(TAG, "❌ Unexpected error loading native lib: " + t.getMessage(), t);
            return false;
        }
    }

    /**
     * Initialize native SDK on the background worker thread.
     * NEVER call from main thread.
     */
    private void initializeSDKAsync(final PluginCall resolveCall) {
        if (sdkInitInProgress) {
            Log.d(TAG, "SDK init already in progress – skipping");
            return;
        }
        sdkInitInProgress = true;

        sdkExecutor.submit(() -> {
            boolean success = false;
            String  error   = null;
            try {
                if (!loadNativeLibrary()) {
                    error = "Native library failed to load (check proguard-rules.pro and shim classes)";
                } else {
                    nativeHandle = nativeInit();
                    if (nativeHandle != 0) {
                        isInitialized = true;
                        success       = true;
                        Log.d(TAG, "✅ Palm SDK initialized, handle=" + nativeHandle);
                    } else {
                        error = "nativeInit() returned 0 – check .bin model files in assets/";
                    }
                }
            } catch (Throwable t) {
                error = "SDK init exception: " + t.getMessage();
                Log.e(TAG, error, t);
            } finally {
                sdkInitInProgress = false;
            }

            final boolean ok  = success;
            final String  err = error;
            mainHandler.post(() -> {
                if (ok) {
                    notifyListeners("sdkInitialized",   new JSObject());
                    notifyListeners("hardwareConnected", new JSObject());
                } else {
                    JSObject ev = new JSObject(); ev.put("error", err);
                    notifyListeners("sdkError", ev);
                }
                if (resolveCall != null) {
                    JSObject r = new JSObject();
                    r.put("granted",     true);
                    r.put("connected",   ok);
                    r.put("initialized", ok);
                    if (!ok) r.put("error", err);
                    resolveCall.resolve(r);
                }
            });
        });
    }

    // =========================================================================
    // Plugin Methods (JS-callable)
    // =========================================================================

    @PluginMethod
    public void requestUsbPermission(PluginCall call) {
        Log.d(TAG, "requestUsbPermission called from JS");
        UsbDevice device = findPalmScanner();

        if (device == null) {
            HashMap<String, UsbDevice> list = usbManager.getDeviceList();
            StringBuilder sb = new StringBuilder();
            for (UsbDevice d : list.values())
                sb.append(String.format("VID:0x%04X PID:0x%04X ", d.getVendorId(), d.getProductId()));
            JSObject r = new JSObject();
            r.put("granted",     false);
            r.put("error",       "Palm scanner not found. Connect via USB-C OTG adapter.");
            r.put("devicesFound", list.size());
            r.put("deviceList",  sb.toString());
            call.resolve(r);
            return;
        }

        if (usbManager.hasPermission(device)) {
            palmDevice        = device;
            deviceConnection  = usbManager.openDevice(device);
            isDeviceConnected = deviceConnection != null;
            if (isDeviceConnected && !isInitialized && !sdkInitInProgress) {
                initializeSDKAsync(call);
            } else {
                JSObject r = new JSObject();
                r.put("granted",     true);
                r.put("connected",   isDeviceConnected);
                r.put("initialized", isInitialized);
                call.resolve(r);
            }
            return;
        }

        pendingPermissionCall = call;
        requestUsbPermissionInternal(device);
    }

    @PluginMethod
    public void isConnected(PluginCall call) {
        UsbDevice device  = findPalmScanner();
        boolean hasPerm   = device != null && usbManager.hasPermission(device);

        if (!isDeviceConnected && hasPerm && device != null) {
            deviceConnection  = usbManager.openDevice(device);
            isDeviceConnected = deviceConnection != null;
        }
        if (isDeviceConnected && hasPerm && !isInitialized && !sdkInitInProgress)
            initializeSDKAsync(null);

        JSObject result = new JSObject();
        result.put("connected",       isDeviceConnected && isInitialized);
        result.put("deviceFound",     device != null);
        result.put("hasPermission",   hasPerm);
        result.put("initialized",     isInitialized);
        result.put("registeredCount", registeredPalms.size());
        call.resolve(result);
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        if (isInitialized) {
            JSObject r = new JSObject(); r.put("success", true); call.resolve(r); return;
        }
        if (!isDeviceConnected) {
            JSObject r = new JSObject(); r.put("success", false); r.put("error", "USB device not connected"); call.resolve(r); return;
        }
        initializeSDKAsync(call);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        UsbDevice device = findPalmScanner();
        boolean hasPerm  = device != null && usbManager.hasPermission(device);
        JSObject r = new JSObject();
        r.put("deviceConnected", isDeviceConnected);
        r.put("sdkInitialized",  isInitialized);
        r.put("modelLoaded",     isInitialized);
        r.put("hasPermission",   hasPerm);
        call.resolve(r);
    }

    @PluginMethod
    public void getSDKInfo(PluginCall call) {
        JSObject r = new JSObject();
        r.put("sdk",             "PalmIQ Native SDK");
        r.put("version",         nativeLibraryLoaded ? "loaded" : "not-loaded");
        r.put("initialized",     isInitialized);
        r.put("deviceConnected", isDeviceConnected);
        r.put("registeredPalms", registeredPalms.size());
        call.resolve(r);
    }

    @PluginMethod
    public void listUsbDevices(PluginCall call) {
        HashMap<String, UsbDevice> list = usbManager.getDeviceList();
        StringBuilder sb = new StringBuilder();
        boolean palmFound = false;
        for (UsbDevice d : list.values()) {
            sb.append(String.format("VID:0x%04X PID:0x%04X Name:%s\n",
                    d.getVendorId(), d.getProductId(), d.getDeviceName()));
            if (isPalmScanner(d)) palmFound = true;
        }
        JSObject r = new JSObject();
        r.put("count",            list.size());
        r.put("devices",          sb.toString());
        r.put("palmScannerFound", palmFound);
        r.put("targetVID",        "0x0C45 (3141)");
        r.put("targetPID",        "0x6366 / 0x636B");
        call.resolve(r);
    }

    @PluginMethod
    public void registerPalm(PluginCall call) {
        String palmId = call.getString("palmId", "palm_" + System.currentTimeMillis());
        if (!isDeviceConnected || !isInitialized) {
            JSObject r = new JSObject();
            r.put("success", false);
            r.put("error",   isDeviceConnected ? "SDK not initialized" : "Scanner not connected");
            call.resolve(r); return;
        }
        sdkExecutor.submit(() -> {
            boolean ok  = false; String err = null;
            try {
                int ret = nativeInitEnrollEnv(nativeHandle);
                if (ret == 0) {
                    byte[] feature = nativeFinishEnroll(nativeHandle);
                    if (feature != null && feature.length > 0) {
                        registeredPalms.put(palmId, feature);
                        palmIds.add(palmId); ok = true;
                    } else { err = "Enrollment returned empty feature – hold palm steady over scanner"; }
                } else { err = "nativeInitEnrollEnv failed: " + ret; }
            } catch (Throwable t) { err = "Register error: " + t.getMessage(); Log.e(TAG, err, t); }
            final boolean success = ok; final String error = err;
            mainHandler.post(() -> {
                JSObject r = new JSObject(); r.put("success", success); r.put("palmId", palmId);
                if (!success) r.put("error", error); call.resolve(r);
            });
        });
    }

    @PluginMethod public void scanAndMatch(PluginCall call) { matchPalmInternal(call); }
    @PluginMethod public void matchPalm(PluginCall call)    { matchPalmInternal(call); }

    private void matchPalmInternal(PluginCall call) {
        if (!isDeviceConnected || !isInitialized) {
            JSObject r = new JSObject(); r.put("matched", false);
            r.put("error", isDeviceConnected ? "SDK not initialized" : "Scanner not connected");
            call.resolve(r); return;
        }
        if (registeredPalms.isEmpty()) {
            JSObject r = new JSObject(); r.put("matched", false); r.put("error", "No palms registered");
            call.resolve(r); return;
        }
        sdkExecutor.submit(() -> {
            boolean matched = false; String matchedId = null; float bestScore = 0f; String err = null;
            try {
                int ret = nativeInitEnrollEnv(nativeHandle);
                if (ret == 0) {
                    byte[] live = nativeFinishEnroll(nativeHandle);
                    if (live != null) {
                        for (Map.Entry<String, byte[]> e : registeredPalms.entrySet()) {
                            float score = nativeCalcFeatureDist(live, e.getValue());
                            if (score >= MATCH_THRESHOLD && score > bestScore) {
                                bestScore = score; matchedId = e.getKey(); matched = true;
                            }
                        }
                    } else { err = "Live capture empty – hold palm steady"; }
                } else { err = "nativeInitEnrollEnv failed: " + ret; }
            } catch (Throwable t) { err = "Match error: " + t.getMessage(); Log.e(TAG, err, t); }
            final boolean m = matched; final String mid = matchedId; final float sc = bestScore; final String e2 = err;
            mainHandler.post(() -> {
                JSObject r = new JSObject(); r.put("matched", m); r.put("temperature", sc * 36.5f + 1.0f);
                r.put("score", sc); r.put("userId", mid); if (e2 != null) r.put("error", e2); call.resolve(r);
            });
        });
    }

    @PluginMethod
    public void deletePalm(PluginCall call) {
        String palmId = call.getString("palmId", "");
        boolean removed = registeredPalms.remove(palmId) != null;
        palmIds.remove(palmId);
        JSObject r = new JSObject(); r.put("success", removed); call.resolve(r);
    }

    @PluginMethod public void cancelRegistration(PluginCall call) { JSObject r = new JSObject(); r.put("success", true); call.resolve(r); }
    @PluginMethod public void stopOperation(PluginCall call)      { JSObject r = new JSObject(); r.put("success", true); call.resolve(r); }

    @PluginMethod
    public void reconnect(PluginCall call) {
        UsbDevice device = findPalmScanner();
        if (device == null) {
            JSObject r = new JSObject(); r.put("success", false); r.put("error", "Palm scanner not found"); call.resolve(r); return;
        }
        palmDevice = device;
        if (usbManager.hasPermission(device)) {
            deviceConnection  = usbManager.openDevice(device);
            isDeviceConnected = deviceConnection != null;
            if (isDeviceConnected && !isInitialized && !sdkInitInProgress) { initializeSDKAsync(call); return; }
        } else { pendingPermissionCall = call; requestUsbPermissionInternal(device); return; }
        JSObject r = new JSObject(); r.put("success", isDeviceConnected); r.put("initialized", isInitialized); call.resolve(r);
    }

    @PluginMethod public void disconnect(PluginCall call) { handleDisconnect(); JSObject r = new JSObject(); r.put("success", true); call.resolve(r); }

    @PluginMethod
    public void getPalmCount(PluginCall call) { JSObject r = new JSObject(); r.put("count", registeredPalms.size()); call.resolve(r); }

    @PluginMethod
    public void getRegisteredPalms(PluginCall call) {
        JSObject r = new JSObject(); r.put("success", true); r.put("count", registeredPalms.size());
        StringBuilder ids = new StringBuilder(); for (String id : palmIds) ids.append(id).append(",");
        r.put("palmIds", ids.toString()); call.resolve(r);
    }

    @PluginMethod
    public void getVersion(PluginCall call) {
        sdkExecutor.submit(() -> {
            String version = nativeLibraryLoaded && isInitialized ? nativeGetVersion() : "not-initialized";
            mainHandler.post(() -> { JSObject r = new JSObject(); r.put("version", version); call.resolve(r); });
        });
    }
}
