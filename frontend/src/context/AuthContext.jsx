import React, { createContext, useContext, useState } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.login({ email, password });
      const authToken = data.access_token || data.token;
      
      // 1. Immediately store tokens in localStorage
      localStorage.setItem('access_token', authToken);
      localStorage.setItem('token', authToken);
      setToken(authToken);

      let userProfile = null;

      // 2. Safely attempt to fetch user profile
      try {
        userProfile = await authService.getMe();
      } catch (profileErr) {
        console.warn("getMe endpoint failed, falling back to payload data:", profileErr);
        userProfile = data.user || { email, username: email };
      }

      // 3. Persist user info & finalize login
      localStorage.setItem('user', JSON.stringify(userProfile));
      setUser(userProfile);

      return { success: true, user: userProfile };
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : detail?.[0]?.msg || JSON.stringify(detail) || 'Authentication failed. Check your credentials.';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await authService.register(userData);
      const loginRes = await login(userData.email, userData.password);
      return loginRes;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail : detail?.[0]?.msg || JSON.stringify(detail) || 'Registration failed. Try again.';
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const normalizeRole = (raw) => {
    if (!raw) return 'User';
    const r = raw.toLowerCase();
    if (r.includes('admin')) return 'Administrator';
    if (r.includes('derm')) return 'Dermatologist';
    if (r.includes('consult')) return 'Skincare Consultant';
    return 'User';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token, // Relies on token presence to prevent premature logout loops
    role: normalizeRole(user?.role),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}