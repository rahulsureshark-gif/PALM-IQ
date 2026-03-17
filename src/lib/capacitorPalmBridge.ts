/**
 * Capacitor Bridge for Native PalmIQ SDK
 * 
 * This module bridges the web app to the native Android PalmIQSDKPlugin.
 * It handles USB permission requests, hardware detection, and SDK initialization.
 */

import { registerPlugin } from '@capacitor/core';

export interface PalmSDKStatus {
  deviceConnected: boolean;
  sdkInitialized: boolean;
  modelLoaded: boolean;
  reason?: string;
}

export interface PalmConnectionResult {
  connected: boolean;
  deviceConnected?: boolean;
  sdkInitialized?: boolean;
  modelLoaded?: boolean;
  reason?: string;
}

export interface PalmRegistrationResult {
  success: boolean;
  palmId?: string;
  error?: string;
  errorCode?: number;
}

export interface PalmMatchResult {
  matched: boolean;
  temperature: number;
  score?: number;
  error?: string;
  userId?: string;
  errorCode?: number;
}

export interface PalmIQSDKPlugin {
  /**
   * Check if hardware is connected and SDK is initialized.
   * This will trigger USB permission dialog if needed.
   */
  isConnected(): Promise<PalmConnectionResult & { deviceFound?: boolean; hasPermission?: boolean }>;

  /**
   * Get detailed SDK status
   */
  getStatus(): Promise<PalmSDKStatus>;

  /**
   * Initialize the SDK. Call this when the app starts.
   * Loads model files and prepares for scanning.
   */
  initialize(): Promise<{ success: boolean; error?: string; needsPermission?: boolean }>;

  /**
   * Register a palm for the current user
   * @param options.hand - 'left' or 'right'
   */
  registerPalm(options: { hand: string }): Promise<PalmRegistrationResult>;

  /**
   * Scan and match palm against registered templates
   */
  scanAndMatch(): Promise<PalmMatchResult>;

  /**
   * Match palm against registered templates (alias)
   */
  matchPalm(): Promise<PalmMatchResult>;

  /**
   * Delete a registered palm
   */
  deletePalm(options: { palmId: string; index?: number }): Promise<{ success: boolean; error?: string }>;

  /**
   * Cancel an ongoing registration
   */
  cancelRegistration(): Promise<{ success: boolean }>;

  /**
   * Stop any ongoing operation
   */
  stopOperation(): Promise<{ success: boolean }>;

  /**
   * Attempt to reconnect to hardware
   */
  reconnect(): Promise<{ success: boolean; error?: string }>;

  /**
   * Get count of registered palms
   */
  getPalmCount(): Promise<{ count: number }>;

  /**
   * Get list of registered palms
   */
  getRegisteredPalms(): Promise<{ success: boolean; count: number; palms: Array<{ id: string; hand: string }> }>;

  /**
   * Request USB permission for the palm scanner device.
   * This will show the Android system USB permission dialog.
   */
  requestUsbPermission(): Promise<{ granted: boolean; connected?: boolean; error?: string; devicesFound?: number; deviceList?: string }>;

  /**
   * List all connected USB devices (for debugging)
   */
  listUsbDevices(): Promise<{ count: number; devices: string; palmScannerFound: boolean; targetVID: string; targetPID: string }>;

  /**
   * Disconnect from the palm scanner
   */
  disconnect(): Promise<{ success: boolean; error?: string }>;

  /**
   * Get SDK info and version
   */
  getSDKInfo(): Promise<{ version: string; initialized: boolean; deviceConnected: boolean; registeredPalms: number; sdk: string }>;

  /**
   * Add event listener for SDK events
   */
  addListener(
    eventName: 'hardwareConnected' | 'hardwareDisconnected' | 'sdkInitialized' | 'sdkError' | 'scanProgress' | 'registrationProgress',
    callback: (data: any) => void
  ): Promise<{ remove: () => void }>;
}

// Register the plugin with Capacitor
// The plugin name must match the one defined in PalmIQSDKPlugin.java
const PalmIQSDK = registerPlugin<PalmIQSDKPlugin>('PalmIQSDK', {
  web: () => import('./palmSdkWebFallback').then(m => new m.PalmSDKWebFallback()),
});

export { PalmIQSDK };

/**
 * Check if native SDK is available (running in Capacitor)
 */
export function isNativeSDKAvailable(): boolean {
  return typeof window !== 'undefined' && 'Capacitor' in window;
}

/**
 * Initialize and check connection with USB permission request
 */
export async function initializePalmSDK(): Promise<PalmConnectionResult> {
  try {
    // First request USB permission
    const permResult = await PalmIQSDK.requestUsbPermission();
    
    if (!permResult.granted) {
      return {
        connected: false,
        deviceConnected: false,
        sdkInitialized: false,
        modelLoaded: false,
        reason: permResult.error || 'USB permission denied',
      };
    }

    // Then initialize
    const initResult = await PalmIQSDK.initialize();
    
    if (!initResult.success) {
      return {
        connected: false,
        deviceConnected: false,
        sdkInitialized: false,
        modelLoaded: false,
        reason: initResult.error || 'SDK initialization failed',
      };
    }

    // Finally check connection status
    return await PalmIQSDK.isConnected();
  } catch (error) {
    console.error('PalmSDK initialization error:', error);
    return {
      connected: false,
      deviceConnected: false,
      sdkInitialized: false,
      modelLoaded: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
