import React, { createContext, useContext, useEffect, useState } from 'react';

interface LocalUser {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
}

interface UserProfile {
  phoneNumber: string;
  displayName: string;
}

interface AuthContextType {
  user: LocalUser | null;
  session: null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'palmiq_users';
const SESSION_KEY = 'palmiq_session';

function getUsers(): Record<string, { password: string; displayName: string; phoneNumber: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { password: string; displayName: string; phoneNumber: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function emailToId(email: string): string {
  // Simple deterministic ID from email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'local_' + Math.abs(hash).toString(36) + '_' + email.replace(/[^a-zA-Z0-9]/g, '');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LocalUser;
        setUser(parsed);
        setUserProfile({ phoneNumber: parsed.phoneNumber, displayName: parsed.displayName });
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const users = getUsers();
    const entry = users[email.toLowerCase()];
    if (!entry) throw new Error('Account not found. Please sign up first.');
    if (entry.password !== password) throw new Error('Incorrect password.');

    const localUser: LocalUser = {
      id: emailToId(email),
      email: email.toLowerCase(),
      displayName: entry.displayName,
      phoneNumber: entry.phoneNumber,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
    setUser(localUser);
    setUserProfile({ phoneNumber: entry.phoneNumber, displayName: entry.displayName });
  };

  const signUp = async (email: string, password: string, displayName: string, phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) throw new Error('Please enter a valid 10-digit phone number');
    if (password.length < 4) throw new Error('Password must be at least 4 characters');

    const users = getUsers();
    const key = email.toLowerCase();
    if (users[key]) throw new Error('Account already exists. Please sign in.');

    users[key] = { password, displayName, phoneNumber: cleanPhone };
    saveUsers(users);

    const localUser: LocalUser = {
      id: emailToId(email),
      email: key,
      displayName,
      phoneNumber: cleanPhone,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
    setUser(localUser);
    setUserProfile({ phoneNumber: cleanPhone, displayName });
  };

  const logout = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: null, userProfile, loading, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
