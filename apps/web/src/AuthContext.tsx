import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from './apiClient';

interface AuthState {
  token: string | null;
  role: 'admin' | 'partner' | null;
  partnerId?: string;
  email?: string;
}

interface AuthContextValue {
  auth: AuthState;
  login: (token: string, role: 'admin' | 'partner', partnerId?: string, email?: string) => void;
  logout: () => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'sos-auth-token';
const ROLE_KEY = 'sos-auth-role';
const PARTNER_KEY = 'sos-auth-partner-id';
const EMAIL_KEY = 'sos-auth-email';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ token: null, role: null });

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const role = localStorage.getItem(ROLE_KEY) as AuthState['role'] | null;
    const partnerId = localStorage.getItem(PARTNER_KEY) ?? undefined;
    const email = localStorage.getItem(EMAIL_KEY) ?? undefined;

    if (token && role) {
      setAuth({ token, role, partnerId, email });
    }
  }, []);

  const login = (token: string, role: 'admin' | 'partner', partnerId?: string, email?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
    if (partnerId) localStorage.setItem(PARTNER_KEY, partnerId);
    if (email) localStorage.setItem(EMAIL_KEY, email);
    setAuth({ token, role, partnerId, email });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(PARTNER_KEY);
    localStorage.removeItem(EMAIL_KEY);
    setAuth({ token: null, role: null });
  };

  const fetchWithAuth = (input: RequestInfo, init: RequestInit = {}) => {
    const headers = new Headers(init.headers ?? undefined);
    if (auth.token) {
      headers.set('Authorization', `Bearer ${auth.token}`);
    }

    const requestInput = typeof input === 'string' ? apiUrl(input) : input;
    return fetch(requestInput, { ...init, headers });
  };

  const value = useMemo(
    () => ({ auth, login, logout, fetchWithAuth }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
