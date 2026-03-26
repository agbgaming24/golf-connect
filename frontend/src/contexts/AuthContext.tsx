import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, charityId?: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        console.log('[Auth] Session restore starting. Token exists:', !!token);
        
        if (token) {
          try {
            console.log('[Auth] Calling getProfile...');
            const res = await authService.getProfile();
            
            console.log('[Auth] getProfile response:', {
              hasData: !!res?.data,
              dataType: typeof res?.data,
              dataKeys: res?.data ? Object.keys(res.data) : [],
            });
            
            if (res?.data?.id) {
              console.log('[Auth] ✓ User restored:', res.data.name);
              setUser(res.data);
            } else {
              console.warn('[Auth] ✗ Invalid response format from getProfile');
              localStorage.removeItem('auth_token');
            }
          } catch (profileError) {
            console.error('[Auth] ✗ getProfile failed:', profileError);
            // Clear token only on 401/authentication errors
            if ((profileError as any)?.response?.status === 401) {
              localStorage.removeItem('auth_token');
              console.log('[Auth] Token was invalid (401), cleared');
            } else {
              // Keep token for retry on network/other errors
              console.log('[Auth] Keeping token for retry (non-auth error)');
            }
          }
        } else {
          console.log('[Auth] No token found, user logged out');
        }
      } catch (error) {
        console.error('[Auth] Unexpected error during session restore:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      localStorage.setItem('auth_token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, charityId?: string) => {
    setIsLoading(true);
    try {
      const res = await authService.register({ name, email, password, charityId });
      localStorage.setItem('auth_token', res.data.token);
      setUser(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
