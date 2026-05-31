import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createUser, validateUser } from './db';

interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signUp: (name: string, email: string, password: string, timezone: string) => Promise<{ ok: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
}

const SESSION_KEY = 'podcraft_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const signUp = async (name: string, email: string, password: string, timezone: string) => {
    const result = await createUser(name, email, password, timezone);
    if (result.ok) {
      const u = { email, name };
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    return result;
  };

  const signIn = async (email: string, password: string) => {
    const result = await validateUser(email, password);
    if (result.ok && result.name) {
      const u = { email, name: result.name };
      setUser(u);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    }
    return result;
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
