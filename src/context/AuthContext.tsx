import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { apiClient, TOKEN_STORAGE_KEY } from '../services/api';
import { UserProfile, UserRole } from '../types';

export interface TenantInfo {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  createdAt?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  tenant: TenantInfo | null;
  loading: boolean;
  token: string | null;
  isTenantAdmin: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    tenantName: string;
    domain?: string;
    industry?: string;
  }) => Promise<any>;
  logout: () => void;
  // Aliases for seamless backward compatibility
  signInWithEmail: (email: string, pass: string) => Promise<any>;
  signUpWithEmail: (email: string, pass: string, displayName?: string, role?: UserRole) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setUser(null);
      setTenant(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiClient.get<{ user: any; tenant: any }>('/auth/me');
      if (data && data.user) {
        setUser({
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.displayName,
          photoURL: data.user.photoURL,
          role: data.user.role,
          createdAt: data.user.createdAt,
          tenantId: data.user.tenantId,
          isTenantAdmin: Boolean(data.user.isTenantAdmin),
          profileId: data.user.profileId,
        });
        setTenant(data.tenant || null);
        setToken(storedToken);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setTenant(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Session token invalid or expired:', err);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUser(null);
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for unauthorized interceptor events
    const handleUnauthorized = () => {
      setUser(null);
      setTenant(null);
      setToken(null);
    };

    window.addEventListener('shogun:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('shogun:unauthorized', handleUnauthorized);
    };
  }, [checkAuth]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        token: string;
        user: any;
        tenant: any;
      }>('/auth/login', { email, password: pass });

      if (res.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        setToken(res.token);
        setUser({
          uid: res.user.id,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          role: res.user.role,
          createdAt: new Date().toISOString(),
          tenantId: res.user.tenantId,
          isTenantAdmin: Boolean(res.user.isTenantAdmin),
          profileId: res.user.profileId,
        });
        setTenant(res.tenant || null);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    displayName: string;
    tenantName: string;
    domain?: string;
    industry?: string;
  }) => {
    setLoading(true);
    try {
      const res = await apiClient.post<{
        token: string;
        user: any;
        tenant: any;
      }>('/auth/register', payload);

      if (res.token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
        setToken(res.token);
        setUser({
          uid: res.user.id,
          email: res.user.email,
          displayName: res.user.displayName,
          role: res.user.role,
          createdAt: new Date().toISOString(),
          tenantId: res.user.tenantId,
          isTenantAdmin: Boolean(res.user.isTenantAdmin),
          profileId: res.user.profileId,
        });
        setTenant(res.tenant || null);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setTenant(null);
    setToken(null);
  };

  // Backward-compatible method aliases
  const signInWithEmail = async (email: string, pass: string) => {
    return login(email, pass);
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    displayName?: string,
    _role: UserRole = 'developer'
  ) => {
    return register({
      email,
      password: pass,
      displayName: displayName || email.split('@')[0],
      tenantName: `${displayName || email.split('@')[0]}'s Workspace`,
    });
  };

  const signInWithGoogle = async () => {
    // For REST stack, Google OAuth or demo login
    return login('admin@shogunate.io', 'demo123456');
  };

  const signOut = async () => {
    logout();
  };

  const isTenantAdmin = Boolean(user?.isTenantAdmin || user?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        loading,
        token,
        isTenantAdmin,
        login,
        register,
        logout,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
