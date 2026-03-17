package com.veinauthen.palm;

/**
 * JNI Bridge Shim — com.veinauthen.palm.JXPalmSDK
 *
 * libpalm_sdk.so hard-codes FindClass("com/veinauthen/palm/JXPalmSDK")
 * and then calls RegisterNatives() on it.
 *
 * The exact vtable that was dumped from the real device logcat is:
 *
 *   vtable (16 entries, 11 in super):
 *     0:  int  clearGroup(int)
 *     1:  int  deleteFeature(int, long)
 *     2:  int  finishEnroll(byte[])       ← signature: ([B)I NOT ([B)[B
 *     3:  int  getFeatureSize()
 *     4:  int  getGroupSize(int)
 *     5:  long getNativeHandle()
 *     6:  int  getParam(int)
 *     7:  int  getVersion(byte[])
 *     8:  String getVersionString()
 *     9:  int  init(String, int)
 *    10:  int  loadFeature(int, long, byte[])
 *    11:  int  match(byte[], byte[])
 *    12:  void release()
 *    13:  void setNativeHandle(long)
 *    14:  int  setParam(int, int)
 *    15:  int  startEnroll(int)
 *
 *   direct methods (2 entries):
 *     0:  void <init>()
 *     1:  JXPalmSDK getInstance()
 *
 *   detectPalmVein([BIII)Lcom/veinauthen/palm/JXPalmDetectResult;
 *     — registered via RegisterNatives (not in vtable, but MUST exist as an
 *       instance method with this exact descriptor)
 *
 * CRITICAL: Every method listed above (and detectPalmVein) MUST exist with
 * the EXACT descriptor shown. A mismatch → NoSuchMethodError → JNI abort → SIGABRT.
 *
 * ProGuard keep rule (proguard-rules.pro):
 *   -keep class com.veinauthen.palm.** { *; }
 */
@SuppressWarnings({"unused", "RedundantSuppression"})
public class JXPalmSDK {

    // ── Constants ─────────────────────────────────────────────────────────────
    public static final int PALM_GROUP_ID  = 1;
    public static final int RESULT_SUCCESS = 0;
    public static final int RESULT_FAILURE = -1;

    // ── Singleton & native handle ─────────────────────────────────────────────
    private static volatile JXPalmSDK sInstance;
    private long mNativeHandle = 0;

    public JXPalmSDK() {}

    public static JXPalmSDK getInstance() {
        if (sInstance == null) {
            synchronized (JXPalmSDK.class) {
                if (sInstance == null) sInstance = new JXPalmSDK();
            }
        }
        return sInstance;
    }

    // ── Vtable entry 5 ───────────────────────────────────────────────────────
    public long getNativeHandle() { return mNativeHandle; }

    // ── Vtable entry 13 ──────────────────────────────────────────────────────
    public void setNativeHandle(long h) { mNativeHandle = h; }

    // ── Vtable entry 9 ───────────────────────────────────────────────────────
    public int init(String modelDir, int logLevel) {
        android.util.Log.d("JXPalmSDK-shim", "init() modelDir=" + modelDir);
        return RESULT_SUCCESS;
    }

    // ── Vtable entry 12 ──────────────────────────────────────────────────────
    public void release() {
        android.util.Log.d("JXPalmSDK-shim", "release()");
    }

    // ── Vtable entry 8 ───────────────────────────────────────────────────────
    public String getVersionString() { return "1.0.0-shim"; }

    // ── Vtable entry 7 ───────────────────────────────────────────────────────
    public int getVersion(byte[] outVersion) { return RESULT_SUCCESS; }

    // ── Vtable entry 15 ──────────────────────────────────────────────────────
    public int startEnroll(int groupId) {
        android.util.Log.d("JXPalmSDK-shim", "startEnroll groupId=" + groupId);
        return RESULT_SUCCESS;
    }

    // ── Vtable entry 2 ───────────────────────────────────────────────────────
    // IMPORTANT: The real vtable shows return type int, NOT byte[].
    // Descriptor: ([B)I
    public int finishEnroll(byte[] reserved) {
        android.util.Log.d("JXPalmSDK-shim", "finishEnroll()");
        return RESULT_SUCCESS;
    }

    // ── Vtable entry 11 ──────────────────────────────────────────────────────
    public int match(byte[] feat1, byte[] feat2) {
        android.util.Log.d("JXPalmSDK-shim", "match()");
        return RESULT_FAILURE;
    }

    // ── RegisterNatives target (NOT in vtable, but MUST exist) ───────────────
    // Descriptor: ([BIII)Lcom/veinauthen/palm/JXPalmDetectResult;
    // This is the method the native library tries to register via RegisterNatives.
    // It MUST be a non-static instance method with this exact signature.
    public JXPalmDetectResult detectPalmVein(byte[] imageData, int width, int height, int format) {
        android.util.Log.d("JXPalmSDK-shim",
                "detectPalmVein() w=" + width + " h=" + height + " fmt=" + format);
        // Return a default result — native code must handle null/empty gracefully
        JXPalmDetectResult result = new JXPalmDetectResult();
        result.score      = 0;
        result.resultCode = RESULT_FAILURE;
        return result;
    }

    // ── Vtable entry 14 ──────────────────────────────────────────────────────
    public int setParam(int key, int value) { return RESULT_SUCCESS; }

    // ── Vtable entry 6 ───────────────────────────────────────────────────────
    public int getParam(int key) { return 0; }

    // ── Vtable entry 1 ───────────────────────────────────────────────────────
    public int deleteFeature(int groupId, long featureId) { return RESULT_SUCCESS; }

    // ── Vtable entry 0 ───────────────────────────────────────────────────────
    public int clearGroup(int groupId) { return RESULT_SUCCESS; }

    // ── Vtable entry 10 ──────────────────────────────────────────────────────
    public int loadFeature(int groupId, long featureId, byte[] feature) { return RESULT_SUCCESS; }

    // ── Vtable entry 3 ───────────────────────────────────────────────────────
    public int getFeatureSize() { return 0; }

    // ── Vtable entry 4 ───────────────────────────────────────────────────────
    public int getGroupSize(int groupId) { return 0; }
}
