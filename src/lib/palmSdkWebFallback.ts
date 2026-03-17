/**
 * Web fallback implementation for PalmIQ SDK
 * 
 * This provides stub implementations when running in a browser without native SDK.
 * It guides users to use either the Windows Server mode or build the Android app.
 */

import type { PalmIQSDKPlugin, PalmSDKStatus, PalmConnectionResult, PalmMatchResult, PalmRegistrationResult } from './capacitorPalmBridge';

export class PalmSDKWebFallback implements PalmIQSDKPlugin {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  async isConnected(): Promise<PalmConnectionResult & { deviceFound?: boolean; hasPermission?: boolean }> {
    return {
      connected: false,
      deviceConnected: false,
      sdkInitialized: false,
      modelLoaded: false,
      deviceFound: false,
      hasPermission: false,
      reason: 'Native SDK not available. Build the Android app or use Windows Server mode.',
    };
  }

  async getStatus(): Promise<PalmSDKStatus> {
    return {
      deviceConnected: false,
      sdkInitialized: false,
      modelLoaded: false,
      reason: 'Running in browser - native SDK not available',
    };
  }

  async initialize(): Promise<{ success: boolean; error?: string; needsPermission?: boolean }> {
    return {
      success: false,
      error: 'Native SDK not available in browser. Please build the Android app or switch to Windows Server mode.',
      needsPermission: false,
    };
  }

  async registerPalm(_options: { hand: string }): Promise<PalmRegistrationResult> {
    return {
      success: false,
      error: 'Palm registration requires native SDK. Build Android app or use Windows Server mode.',
    };
  }

  async scanAndMatch(): Promise<PalmMatchResult> {
    return {
      matched: false,
      temperature: 0,
      error: 'Palm scanning requires native SDK. Build Android app or use Windows Server mode.',
    };
  }

  async matchPalm(): Promise<PalmMatchResult> {
    return {
      matched: false,
      temperature: 0,
      error: 'Palm matching requires native SDK. Build Android app or use Windows Server mode.',
    };
  }

  async deletePalm(_options: { palmId: string }): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Native SDK not available',
    };
  }

  async cancelRegistration(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async stopOperation(): Promise<{ success: boolean }> {
    return { success: true };
  }

  async reconnect(): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Native SDK not available in browser',
    };
  }

  async getPalmCount(): Promise<{ count: number }> {
    return { count: 0 };
  }

  async getRegisteredPalms(): Promise<{ success: boolean; count: number; palms: Array<{ id: string; hand: string }> }> {
    return {
      success: false,
      count: 0,
      palms: [],
    };
  }

  async requestUsbPermission(): Promise<{ granted: boolean; connected?: boolean; error?: string; devicesFound?: number; deviceList?: string }> {
    return {
      granted: false,
      connected: false,
      error: 'USB permissions require native Android app. Build the APK using Android Studio.',
      devicesFound: 0,
      deviceList: '',
    };
  }

  async listUsbDevices(): Promise<{ count: number; devices: string; palmScannerFound: boolean; targetVID: string; targetPID: string }> {
    return {
      count: 0,
      devices: 'USB device listing requires native Android app.',
      palmScannerFound: false,
      targetVID: '0x0C45',
      targetPID: '0x6366',
    };
  }

  async disconnect(): Promise<{ success: boolean; error?: string }> {
    return {
      success: true,
    };
  }

  async getSDKInfo(): Promise<{ version: string; initialized: boolean; deviceConnected: boolean; registeredPalms: number; sdk: string }> {
    return {
      version: 'Web Fallback',
      initialized: false,
      deviceConnected: false,
      registeredPalms: 0,
      sdk: 'Web Fallback (use Android app for real SDK)',
    };
  }

  async addListener(
    eventName: string,
    callback: (data: any) => void
  ): Promise<{ remove: () => void }> {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);

    return {
      remove: () => {
        this.listeners.get(eventName)?.delete(callback);
      },
    };
  }
}
