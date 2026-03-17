package com.palmiq.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.palmiq.sdk.PalmIQSDKPlugin;

/**
 * Main Activity for Palm IQ App
 * 
 * This extends Capacitor's BridgeActivity and registers the native Palm SDK plugin.
 * 
 * IMPORTANT: Replace this file in your Android project at:
 * android/app/src/main/java/com/palmiq/app/MainActivity.java
 * 
 * NOTE: USB BroadcastReceiver registration is handled in PalmIQSDKPlugin.java
 * with proper RECEIVER_EXPORTED flag for Android 14+ compatibility.
 */
public class MainActivity extends BridgeActivity {
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register the Palm IQ SDK Plugin before calling super
        registerPlugin(PalmIQSDKPlugin.class);
        
        super.onCreate(savedInstanceState);
        
        // Note: USB permission BroadcastReceiver is registered in PalmIQSDKPlugin.load()
        // with proper Android 14+ RECEIVER_EXPORTED flag - do NOT register here
    }
}
