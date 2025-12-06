import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AUTH_TOKEN_KEY,
  getCurrentUser,
  login as loginService,
  logout as logoutService,
} from '../services/authService';

type AuthUser = {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  type?: string;
  status?: string;
  organizationId?: string;
};

type Organization = {
  id: string;
  name?: string;
  slug?: string;
} | null;

type AuthContextValue = {
  user: AuthUser | null;
  organization: Organization;
  token: string | null;
  hasToken: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  currentOrganization: Organization;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] = useState<Organization>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setOrganization(null);
    setToken(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const bootstrap = async () => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!stored) {
      clearSession();
      setIsLoading(false);
      return;
    }

    setToken(stored);
    const me = await getCurrentUser();
    if (me.success && me.user) {
      setUser(me.user);
      setOrganization(me.organization ?? null);
      setIsAuthenticated(true);
    } else {
      clearSession();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (username: string, password = '') => {
    const result = await loginService(username, password);

    if (result.success && (result.token || result.accessToken)) {
      const newToken = result.token || result.accessToken || null;
      setToken(newToken);
      setIsAuthenticated(true);
      setUser(result.user ?? { id: 'local-user', username });
      setOrganization(null);
      return { success: true };
    }

    clearSession();
    return { success: false, error: result.error };
  };

  const refreshUser = async () => {
    if (!token) return;
    const me = await getCurrentUser();
    if (me.success && me.user) {
      setUser(me.user);
      setOrganization(me.organization ?? null);
      setIsAuthenticated(true);
    } else {
      clearSession();
    }
  };

  const logout = async () => {
    await logoutService();
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      organization,
      currentOrganization: organization,
      token,
      isAuthenticated,
      hasToken: !!token,
      isLoading,
      isSuperAdmin: user?.type === 'superadmin' || (user as any)?.role === 'super_admin',
      login,
      logout,
      refreshUser,
    }),
    [user, organization, token, isAuthenticated, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
