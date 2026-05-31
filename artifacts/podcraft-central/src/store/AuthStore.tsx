import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createAccount, signIn as serviceSignIn } from '../services/authService';

export interface AuthUser {
  userId: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signUp: (name: string, email: string, password: string, timezone: string) => Promise<{ ok: boolean; error?: string; userId?: number }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const SESSION_KEY = 'podcraft_session_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        if (parsed.userId && parsed.email && parsed.name) {
          setUser(parsed);
        }
      }
    } catch {
      // ignore malformed session
    }
    setIsLoading(false);
  }, []);

  const signUp = async (name: string, email: string, password: string, timezone: string) => {
    const result = await createAccount(name, email, password, timezone);
    if (result.ok && result.userId) {
      const u: AuthUser = { userId: result.userId, email: result.email!, name: result.name! };
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    return { ok: result.ok, error: result.error, userId: result.userId };
  };

  const signIn = async (email: string, password: string) => {
    const result = await serviceSignIn(email, password);
    if (result.ok && result.userId) {
      const u: AuthUser = { userId: result.userId, email: result.email!, name: result.name! };
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    return { ok: result.ok, error: result.error };
  };

  const signOut = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
