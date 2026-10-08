'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken, setToken } from './api';

export type User = { id: string; name: string; email: string; role: string; isAdmin?: boolean };
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
  /** Set when an admin opened this business with "Open as business" */
  impersonatedBy: { id: string; name: string } | null;
  stopImpersonating: () => void;
};

// While an admin is viewing a business: the session to restore afterwards, and where to go back to
const PREV_TOKEN_KEY = 'starling.prevToken';
const ADMIN_RETURN_KEY = 'starling.adminReturn';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedBy, setImpersonatedBy] = useState<AuthState['impersonatedBy']>(null);
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
      setImpersonatedBy(data.impersonatedBy || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // The API says the account was paused (or resumed) — reload who we are
    const onPaused = () => refresh();
    window.addEventListener('starling:account', onPaused);
    return () => window.removeEventListener('starling:account', onPaused);
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
    try {
      window.localStorage.removeItem(PREV_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_RETURN_KEY);
    } catch {
      /* ignore */
    }
    setUser(null);
    setBusiness(null);
    setImpersonatedBy(null);
    router.push('/login');
  };

  /** Leave an admin "Open as business" session: restore this browser's own sign-in and go back to the admin site. */
  const stopImpersonating = () => {
    let prev: string | null = null;
    let back: string | null = null;
    try {
      prev = window.localStorage.getItem(PREV_TOKEN_KEY);
      back = window.localStorage.getItem(ADMIN_RETURN_KEY);
      window.localStorage.removeItem(PREV_TOKEN_KEY);
      window.localStorage.removeItem(ADMIN_RETURN_KEY);
    } catch {
      /* ignore */
    }
    setToken(prev);
    window.location.href = back || (prev ? '/app' : '/login');
  };

  return (
    <AuthContext.Provider value={{ user, business, loading, login, signup, logout, refresh, setBusiness, impersonatedBy, stopImpersonating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** Called by /impersonate when an admin opens this business from the admin site. */
export function beginAdminSession(token: string, back?: string | null) {
  try {
    const current = window.localStorage.getItem('starling.token');
    // Keep this browser's own session (if it isn't already an admin view) to restore later
    if (current && !window.localStorage.getItem(PREV_TOKEN_KEY)) window.localStorage.setItem(PREV_TOKEN_KEY, current);
    if (back && /^https?:\/\//.test(back)) window.localStorage.setItem(ADMIN_RETURN_KEY, back);
  } catch {
    /* ignore */
  }
  setToken(token);
}
