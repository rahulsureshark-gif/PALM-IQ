import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface PinContextType {
  paymentPin: string;
  isLocked: boolean;
  setPaymentPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  lockWallet: () => void;
  unlockWallet: (pin: string) => boolean;
  hasSetPin: boolean;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

const DEFAULT_PIN = '1234'; // Default demo PIN

export function PinProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [paymentPin, setPaymentPinState] = useState(DEFAULT_PIN);
  const [isLocked, setIsLocked] = useState(true);
  const [hasSetPin, setHasSetPin] = useState(false);

  // Get storage keys based on user ID
  const getPinKey = (userId: string) => `palmiq_payment_pin_${userId}`;
  const getHasSetPinKey = (userId: string) => `palmiq_has_set_pin_${userId}`;

  // Load user-specific PIN when user changes
  useEffect(() => {
    if (user?.id) {
      const savedPin = localStorage.getItem(getPinKey(user.id));
      const savedHasSetPin = localStorage.getItem(getHasSetPinKey(user.id)) === 'true';
      
      if (savedPin) {
        setPaymentPinState(savedPin);
        setHasSetPin(savedHasSetPin);
      } else {
        // New user - set default PIN
        setPaymentPinState(DEFAULT_PIN);
        setHasSetPin(false);
      }
      // Lock wallet on user change
      setIsLocked(true);
    } else {
      // No user logged in - reset to defaults
      setPaymentPinState(DEFAULT_PIN);
      setHasSetPin(false);
      setIsLocked(true);
    }
  }, [user?.id]);

  const setPaymentPin = (pin: string) => {
    if (!user?.id) return;
    
    setPaymentPinState(pin);
    setHasSetPin(true);
    localStorage.setItem(getPinKey(user.id), pin);
    localStorage.setItem(getHasSetPinKey(user.id), 'true');
  };

  const verifyPin = (pin: string): boolean => {
    return pin === paymentPin;
  };

  const lockWallet = () => {
    setIsLocked(true);
  };

  const unlockWallet = (pin: string): boolean => {
    if (verifyPin(pin)) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  return (
    <PinContext.Provider value={{
      paymentPin,
      isLocked,
      setPaymentPin,
      verifyPin,
      lockWallet,
      unlockWallet,
      hasSetPin,
    }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
}
