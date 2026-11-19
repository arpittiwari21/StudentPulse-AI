import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  logoutUser,
  checkServerHealth,
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('studentpulse_token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isServerOnline, setIsServerOnline] = useState(true);

  // Probe server health
  const probeHealth = useCallback(async () => {
    const online = await checkServerHealth();
    setIsServerOnline(online);
  }, []);

  // Validate existing token on mount
  useEffect(() => {
    probeHealth();
    const interval = setInterval(probeHealth, 30000);

    const initAuth = async () => {
      const savedToken = localStorage.getItem('studentpulse_token');
      if (savedToken) {
        try {
          const profile = await fetchCurrentUser(savedToken);
          setUser(profile);
          setToken(savedToken);
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          localStorage.removeItem('studentpulse_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
    return () => clearInterval(interval);
  }, [probeHealth]);

  // Handle Login
  const login = async (credentials) => {
    setError(null);
    try {
      const data = await loginUser(credentials);
      const jwtToken = data.token;
      localStorage.setItem('studentpulse_token', jwtToken);
      setToken(jwtToken);
      const profile = await fetchCurrentUser(jwtToken);
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle Register
  const register = async (userData) => {
    setError(null);
    try {
      const data = await registerUser(userData);
      const jwtToken = data.token;
      localStorage.setItem('studentpulse_token', jwtToken);
      setToken(jwtToken);
      const profile = await fetchCurrentUser(jwtToken);
      setUser(profile);
      return profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Handle Logout
  const logout = async () => {
    if (token) {
      await logoutUser(token);
    }
    localStorage.removeItem('studentpulse_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Refresh profile from server
  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const profile = await fetchCurrentUser(token);
      setUser(profile);
      return profile;
    } catch (err) {
      console.error('Failed to refresh profile:', err);
      logout();
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        error,
        isServerOnline,
        login,
        register,
        logout,
        refreshProfile,
        clearError,
        probeHealth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
