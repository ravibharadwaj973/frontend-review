'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken } from './api';

export type User = { id: string; name: string; email: string; role: string };
export type Business = any;

type AuthState = {
  user: User | null;
  business: Business | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; businessName: string; category?: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  setBusiness: (b: Business) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await api('/auth/me');
      setUser(data.user);
      setBusiness(data.business);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const data = await api('/auth/login', { body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
  };

  const signup: AuthState['signup'] = async (input) => {
    const data = await api('/auth/signup', { body: input });
    setToken(data.token);
    setUser(data.user);
    setBusiness(data.business);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setBusiness(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, business, loading, login, signup, logout, refresh, setBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
