import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface Transaction {
  id: string;
  type: 'palm_pay' | 'demo_upi' | 'demo_transfer' | 'credit' | 'p2p_send' | 'p2p_receive';
  amount: number;
  merchant?: string;
  description: string;
  status: 'success' | 'failed' | 'pending';
  timestamp: Date;
  location?: string;
  temperature?: number;
  senderId?: string;
  senderName?: string;
  senderPhone?: string;
  receiverId?: string;
  receiverName?: string;
  receiverPhone?: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  phoneNumber: string | null;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deductBalance: (amount: number) => boolean;
  addBalance: (amount: number) => void;
  sendToPhone: (phone: string, amount: number) => Promise<{ success: boolean; error?: string; receiverName?: string }>;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const INITIAL_BALANCE = 10000;

function getTxKey(userId: string) { return `palmiq_transactions_${userId}`; }
function getBalKey(userId: string) { return `palmiq_balance_${userId}`; }

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const loadTransactions = useCallback((userId: string) => {
    try {
      const saved = localStorage.getItem(getTxKey(userId));
      if (saved) {
        setTransactions(JSON.parse(saved, (key, value) => {
          if (key === 'timestamp') return new Date(value);
          return value;
        }));
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    }
  }, []);

  const persistTransactions = useCallback((userId: string, txs: Transaction[]) => {
    localStorage.setItem(getTxKey(userId), JSON.stringify(txs));
  }, []);

  const refreshWallet = useCallback(async () => {
    if (!user) return;
    loadTransactions(user.id);
  }, [user, loadTransactions]);

  useEffect(() => {
    if (!user) {
      setBalance(INITIAL_BALANCE);
      setTransactions([]);
      setLoading(false);
      setPhoneNumber(null);
      return;
    }

    setPhoneNumber(userProfile?.phoneNumber || null);
    const savedBalance = localStorage.getItem(getBalKey(user.id));
    setBalance(savedBalance ? Number(savedBalance) : INITIAL_BALANCE);
    loadTransactions(user.id);
    setLoading(false);
  }, [user, userProfile?.phoneNumber, loadTransactions]);

  useEffect(() => {
    if (user) localStorage.setItem(getBalKey(user.id), String(balance));
  }, [balance, user]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    if (!user) return;
    const newTx: Transaction = { id: `tx_${Date.now()}`, ...transaction, timestamp: new Date() };
    setTransactions((prev) => {
      const next = [newTx, ...prev];
      persistTransactions(user.id, next);
      return next;
    });
  };

  const deductBalance = (amount: number): boolean => {
    if (balance >= amount) {
      setBalance((prev) => prev - amount);
      return true;
    }
    return false;
  };

  const addBalance = (amount: number) => {
    setBalance((prev) => prev + amount);
  };

  const sendToPhone = async (
    phone: string,
    amount: number
  ): Promise<{ success: boolean; error?: string; receiverName?: string }> => {
    if (!user || !phoneNumber) return { success: false, error: 'Not logged in' };

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone === phoneNumber) return { success: false, error: 'Cannot send to yourself' };

    if (balance < amount) return { success: false, error: 'Insufficient balance' };

    // Local-only P2P (demo)
    setBalance((prev) => prev - amount);
    addTransaction({
      type: 'p2p_send',
      amount,
      description: `Sent ₹${amount} to ${cleanPhone}`,
      status: 'success',
    });
    return { success: true, receiverName: cleanPhone };
  };

  return (
    <WalletContext.Provider value={{
      balance, transactions, loading, phoneNumber,
      addTransaction, deductBalance, addBalance, sendToPhone, refreshWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error('useWallet must be used within a WalletProvider');
  return context;
}
