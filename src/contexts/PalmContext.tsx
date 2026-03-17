import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { palmServerApi } from '@/lib/palmServerApi';
import { PalmIQSDK, isNativeSDKAvailable, initializePalmSDK } from '@/lib/capacitorPalmBridge';
import { useAuth } from './AuthContext';

interface PalmRegistration {
  id: string;
  registeredAt: Date;
  palmHand: 'left' | 'right';
  status: 'active' | 'inactive';
}

type ConnectionMode = 'native' | 'server';

interface SDKStatus {
  deviceConnected: boolean;
  sdkInitialized: boolean;
  modelLoaded: boolean;
  reason?: string;
}

interface PalmContextType {
  isRegistered: boolean;
  isHardwareConnected: boolean;
  connectionMode: ConnectionMode;
  serverUrl: string;
  registrations: PalmRegistration[];
  sdkStatus: SDKStatus | null;
  lastError: string | null;
  isNativeAvailable: boolean;
  setConnectionMode: (mode: ConnectionMode) => void;
  setServerUrl: (url: string) => void;
  registerPalm: (hand: 'left' | 'right') => Promise<{ success: boolean; error?: string; palmId?: string }>;
  deletePalm: (id: string) => void;
  checkHardwareConnection: () => Promise<boolean>;
  scanPalm: () => Promise<{ matched: boolean; temperature: number; error?: string; userId?: string }>;
  cancelRegistration: () => Promise<void>;
  getDetailedStatus: () => Promise<SDKStatus>;
  requestUsbPermission: () => Promise<{ granted: boolean; error?: string }>;
  initializeSDK: () => Promise<boolean>;
}

const PalmContext = createContext<PalmContextType | undefined>(undefined);

export function PalmProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [sdkStatus, setSdkStatus] = useState<SDKStatus | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isNativeAvailable] = useState(() => isNativeSDKAvailable());
  
  const [connectionMode, setConnectionModeState] = useState<ConnectionMode>(() => {
    return (localStorage.getItem('palmiq_connection_mode') as ConnectionMode) || 'native';
  });
  
  const [serverUrl, setServerUrlState] = useState(() => {
    return localStorage.getItem('palmiq_server_url') || 'http://localhost:8080';
  });
  
  const [registrations, setRegistrations] = useState<PalmRegistration[]>([]);

  // Load registrations from localStorage
  useEffect(() => {
    if (!user) {
      setRegistrations([]);
      return;
    }
    const saved = localStorage.getItem(`palmiq_registrations_${user.id}`);
    if (saved) {
      setRegistrations(JSON.parse(saved, (key, value) => {
        if (key === 'registeredAt') return new Date(value);
        return value;
      }));
    }
  }, [user]);

  // Persist registrations
  useEffect(() => {
    if (user && registrations.length > 0) {
      localStorage.setItem(`palmiq_registrations_${user.id}`, JSON.stringify(registrations));
    }
  }, [registrations, user]);

  useEffect(() => {
    localStorage.setItem('palmiq_connection_mode', connectionMode);
  }, [connectionMode]);

  const setConnectionMode = (mode: ConnectionMode) => {
    setConnectionModeState(mode);
    setLastError(null);
  };

  const setServerUrl = (url: string) => {
    setServerUrlState(url);
    localStorage.setItem('palmiq_server_url', url);
    palmServerApi.setServerUrl(url);
  };

  const isRegistered = registrations.some((r) => r.status === 'active');

  const requestUsbPermission = useCallback(async (): Promise<{ granted: boolean; error?: string }> => {
    if (connectionMode !== 'native') return { granted: true };
    try {
      return await PalmIQSDK.requestUsbPermission();
    } catch (error) {
      return { granted: false, error: error instanceof Error ? error.message : 'Permission request failed' };
    }
  }, [connectionMode]);

  const initializeSDK = useCallback(async (): Promise<boolean> => {
    if (connectionMode !== 'native') return true;
    try {
      setLastError(null);
      const result = await initializePalmSDK();
      setIsHardwareConnected(result.connected);
      setSdkStatus({
        deviceConnected: result.deviceConnected ?? false,
        sdkInitialized: result.sdkInitialized ?? false,
        modelLoaded: result.modelLoaded ?? false,
        reason: result.reason,
      });
      if (!result.connected && result.reason) setLastError(result.reason);
      return result.connected;
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Initialization failed');
      return false;
    }
  }, [connectionMode]);

  const getDetailedStatus = useCallback(async (): Promise<SDKStatus> => {
    try {
      if (connectionMode === 'server') {
        const status = await palmServerApi.getStatus();
        return { deviceConnected: status.online && status.hardwareConnected, sdkInitialized: status.online, modelLoaded: status.online && status.hardwareConnected };
      }
      return await PalmIQSDK.getStatus();
    } catch (error) {
      return { deviceConnected: false, sdkInitialized: false, modelLoaded: false, reason: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [connectionMode]);

  const checkHardwareConnection = useCallback(async (): Promise<boolean> => {
    try {
      setLastError(null);
      if (connectionMode === 'server') {
        const status = await palmServerApi.getStatus();
        const connected = status.online && status.hardwareConnected;
        setIsHardwareConnected(connected);
        setSdkStatus({ deviceConnected: status.hardwareConnected, sdkInitialized: status.online, modelLoaded: status.hardwareConnected });
        if (!connected) setLastError(status.online ? 'Palm scanner not connected to server' : 'Cannot connect to Palm IQ Server');
        return connected;
      }
      const result = await PalmIQSDK.isConnected();
      const connected = result.connected === true;
      setIsHardwareConnected(connected);
      setSdkStatus({ deviceConnected: result.deviceConnected ?? false, sdkInitialized: result.sdkInitialized ?? false, modelLoaded: result.modelLoaded ?? false, reason: result.reason });
      if (!connected && result.reason) setLastError(result.reason);
      return connected;
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Connection check failed');
      setIsHardwareConnected(false);
      return false;
    }
  }, [connectionMode]);

  useEffect(() => {
    if (connectionMode !== 'native') return;
    const setupListeners = async () => {
      try {
        const listeners: Array<{ remove: () => void }> = [];
        listeners.push(await PalmIQSDK.addListener('hardwareConnected', () => { setIsHardwareConnected(true); checkHardwareConnection(); }));
        listeners.push(await PalmIQSDK.addListener('hardwareDisconnected', () => { setIsHardwareConnected(false); setSdkStatus({ deviceConnected: false, sdkInitialized: false, modelLoaded: false }); }));
        listeners.push(await PalmIQSDK.addListener('sdkInitialized', () => { checkHardwareConnection(); }));
        listeners.push(await PalmIQSDK.addListener('sdkError', (data) => { setLastError(data.message || 'SDK error occurred'); }));
        return () => { listeners.forEach((l) => l.remove()); };
      } catch (error) {
        console.error('Failed to set up SDK listeners:', error);
      }
    };
    setupListeners();
  }, [connectionMode, checkHardwareConnection]);

  useEffect(() => {
    checkHardwareConnection();
  }, [connectionMode, checkHardwareConnection]);

  const registerPalm = async (hand: 'left' | 'right'): Promise<{ success: boolean; error?: string; palmId?: string }> => {
    setLastError(null);
    const connected = await checkHardwareConnection();
    if (!connected) {
      const error = connectionMode === 'server'
        ? lastError || 'Cannot connect to Palm IQ Server. Is it running?'
        : lastError || 'Palm scanner not connected. Connect device via USB-C OTG.';
      return { success: false, error };
    }

    try {
      let palmId: string | undefined;
      if (connectionMode === 'server') {
        const result = await palmServerApi.registerPalm(hand);
        if (!result.success) { setLastError(result.error || 'Registration failed'); return { success: false, error: result.error }; }
        palmId = result.palmId;
      } else {
        const result = await PalmIQSDK.registerPalm({ hand });
        if (!result.success) { setLastError(result.error || 'Registration failed'); return { success: false, error: result.error }; }
        palmId = result.palmId;
      }

      if (palmId) {
        const newReg: PalmRegistration = { id: palmId, registeredAt: new Date(), palmHand: hand, status: 'active' };
        setRegistrations((prev) => [...prev, newReg]);
        return { success: true, palmId };
      }
      return { success: false, error: 'No palm ID returned' };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Registration failed';
      setLastError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const cancelRegistration = async (): Promise<void> => {
    try {
      if (connectionMode === 'native') await PalmIQSDK.cancelRegistration();
    } catch (error) { console.error('Cancel registration error:', error); }
  };

  const deletePalm = async (id: string) => {
    setRegistrations((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (user) localStorage.setItem(`palmiq_registrations_${user.id}`, JSON.stringify(next));
      return next;
    });
    if (connectionMode === 'server') {
      palmServerApi.deletePalm(id).catch(console.error);
    } else {
      PalmIQSDK.deletePalm({ palmId: id }).catch(console.error);
    }
  };

  const scanPalm = async (): Promise<{ matched: boolean; temperature: number; error?: string; userId?: string }> => {
    setLastError(null);
    const connected = await checkHardwareConnection();
    if (!connected) {
      return { matched: false, temperature: 0, error: connectionMode === 'server' ? lastError || 'Cannot connect to server' : lastError || 'Palm scanner not connected' };
    }
    if (!isRegistered) return { matched: false, temperature: 0, error: 'No palm registered. Please register first.' };

    try {
      if (connectionMode === 'server') {
        const result = await palmServerApi.matchPalm();
        return { matched: result.matched, temperature: result.temperature || 0, error: result.error, userId: result.userId };
      }
      const result = await PalmIQSDK.scanAndMatch();
      if (result.error) setLastError(result.error);
      return { matched: result.matched, temperature: result.temperature || 0, error: result.error, userId: result.userId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Scan failed';
      setLastError(errorMsg);
      return { matched: false, temperature: 0, error: errorMsg };
    }
  };

  return (
    <PalmContext.Provider value={{
      isRegistered, isHardwareConnected, connectionMode, serverUrl, registrations,
      sdkStatus, lastError, isNativeAvailable, setConnectionMode, setServerUrl,
      registerPalm, deletePalm, checkHardwareConnection, scanPalm, cancelRegistration,
      getDetailedStatus, requestUsbPermission, initializeSDK,
    }}>
      {children}
    </PalmContext.Provider>
  );
}

export function usePalm() {
  const context = useContext(PalmContext);
  if (context === undefined) throw new Error('usePalm must be used within a PalmProvider');
  return context;
}
