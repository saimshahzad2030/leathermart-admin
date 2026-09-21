import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AdminUser, AdminRole } from '@/types';
import { authApi } from '@/lib/api/auth';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (allowedRoles: AdminRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    const cached = localStorage.getItem('atelier_user');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('atelier_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('atelier_token');
      localStorage.removeItem('atelier_refresh_token');
      localStorage.removeItem('atelier_user');
      setUser(null);
      setToken(null);
    }
  }, [token]);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      localStorage.setItem('atelier_user', JSON.stringify(freshUser));
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        await logout();
      }
    }
  }, [logout]);

  // Initial check on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('atelier_token');
      if (storedToken) {
        try {
          await refreshUser();
        } catch {
          // handled in refreshUser
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      logout();
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [refreshUser, logout]);

  const login = async (credentials: { email: string; password: string }) => {
    const session = await authApi.login(credentials);
    localStorage.setItem('atelier_token', session.accessToken);
    if (session.refreshToken) {
      localStorage.setItem('atelier_refresh_token', session.refreshToken);
    }
    localStorage.setItem('atelier_user', JSON.stringify(session.admin));
    setToken(session.accessToken);
    setUser(session.admin);
  };

  const hasRole = (allowedRoles: AdminRole[]): boolean => {
    if (!user) return false;
    // super_admin bypasses all role checks
    if (user.role === 'super_admin') return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
