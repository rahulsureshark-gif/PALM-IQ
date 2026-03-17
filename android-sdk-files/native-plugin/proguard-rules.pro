# ============================================================
#  Palm IQ — ProGuard / R8 keep rules
#
#  CRITICAL: libpalm_sdk.so performs JNI FindClass with the
#  hardcoded path "com/veinauthen/palm/JXPalmSDK". If R8
#  strips or renames this class the app crashes with:
#    JNI DETECTED ERROR: JNI NewGlobalRef called with pending
#    exception java.lang.ClassNotFoundException:
#    Didn't find class "com.veinauthen.palm.JXPalmSDK"
#  ==> Fatal Signal 6 (SIGABRT)
# ============================================================

# ── SHIM class: exact name the JNI native library looks up ──────────────────
# This class MUST survive R8 with its exact package/name unchanged.
-keep class com.veinauthen.palm.JXPalmSDK { *; }
-keep class com.veinauthen.palm.**        { *; }
-keepnames class com.veinauthen.palm.**
-keepclassmembers class com.veinauthen.palm.JXPalmSDK { *; }

# ── Real implementation class (delegate) ────────────────────────────────────
-keep class com.tendcent.palm.JXPalmSdk  { *; }
-keep class com.tendcent.palm.**         { *; }
-keepnames class com.tendcent.palm.**

# ── Alternative vendor package names (some .so versions may use these) ──────
-keep class com.jx.palm.**   { *; }
-keep class com.jx.**        { *; }

# ── XRCommonVeinAlgAPI JNI interface ────────────────────────────────────────
-keep class com.tendcent.**   { *; }
-keep class com.veinauthen.** { *; }

# ── Palm SDK data model classes ─────────────────────────────────────────────
-keep class **.sPalmInfo       { *; }
-keep class **.VeinReturnCode  { *; }
-keep class **.VeinException   { *; }
-keep class **.VeinProcessor   { *; }
-keep class **.EnrollTip       { *; }
-keep class **.FeatureConstants { *; }
-keep class **.XRCommonVeinAlgAPI { *; }

# ── Capacitor plugin must not be obfuscated ─────────────────────────────────
-keep class com.palmiq.sdk.PalmIQSDKPlugin { *; }
-keep class com.palmiq.sdk.**              { *; }

# ── Capacitor core ──────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin *;
    @com.getcapacitor.PluginMethod public *;
}

# ── Sonix USB Camera (JNI bridge) ───────────────────────────────────────────
-keep class **.SonixCamera        { *; }
-keep class **.SonixCameraManager { *; }
-keep class **.SonixCamera_*      { *; }

# ── Keep ALL JNI-callable native methods across the project ─────────────────
-keepclasseswithmembernames class * {
    native <methods>;
}

# ── Prevent stripping of enum classes used by SDK ───────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ── Serializable / Parcelable ────────────────────────────────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# ── Suppress warnings for SDK internals ─────────────────────────────────────
-dontwarn com.veinauthen.**
-dontwarn com.tendcent.**
-dontwarn com.jx.**
-dontwarn **.SonixCamera**
