package com.veinauthen.palm;

/**
 * Result object returned by JXPalmSDK.detectPalmVein().
 *
 * The native library (libpalm_sdk.so) references this class as the return
 * type of the detectPalmVein JNI method:
 *   detectPalmVein([BIII)Lcom/veinauthen/palm/JXPalmDetectResult;
 *
 * This class MUST be present in the APK DEX and MUST NOT be stripped by
 * ProGuard / R8.  Add to proguard-rules.pro:
 *   -keep class com.veinauthen.palm.** { *; }
 */
@SuppressWarnings("unused")
public class JXPalmDetectResult {

    /** Detection quality score: 0 = no palm, 100 = perfect */
    public int score;

    /** Bounding box of detected palm region in the input image */
    public int left;
    public int top;
    public int right;
    public int bottom;

    /** Raw feature template extracted from the detected palm vein pattern */
    public byte[] feature;

    /** Error / status code from the native layer (0 = success) */
    public int resultCode;

    public JXPalmDetectResult() {}

    public JXPalmDetectResult(int score, int resultCode) {
        this.score      = score;
        this.resultCode = resultCode;
    }
}
