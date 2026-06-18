import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authAPI from '../../api/auth';
import { getProfile } from '../../api/profile';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  googleLogin: (idToken: string) => Promise<any>;
  logout: () => Promise<void>;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_ACCESS = 'muallim_access_token';
const STORAGE_KEY_REFRESH = 'muallim_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const stored_access = localStorage.getItem(STORAGE_KEY_ACCESS);
    const stored_refresh = localStorage.getItem(STORAGE_KEY_REFRESH);
    if (stored_access) setAccessToken(stored_access);
    if (stored_refresh) setRefreshToken(stored_refresh);
  }, []);

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    localStorage.setItem(STORAGE_KEY_ACCESS, access);
    localStorage.setItem(STORAGE_KEY_REFRESH, refresh);
  };

  const clearTokens = () => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEY_ACCESS);
    localStorage.removeItem(STORAGE_KEY_REFRESH);
  };

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    setTokens(response.access, response.refresh);
    // Fetch user profile to get admin status
    try {
      const userProfile = await getProfile(response.access);
      return userProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const googleLogin = async (idToken: string) => {
    const response = await authAPI.googleAuth(idToken);
    setTokens(response.access, response.refresh);
    // Fetch user profile to get admin status
    try {
      const userProfile = await getProfile(response.access);
      return userProfile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const logout = async () => {
    if (refreshToken) {
      try {
        await authAPI.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearTokens();
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isAuthenticated: !!accessToken,
        login,
        googleLogin,
        logout,
        setTokens,
        clearTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
