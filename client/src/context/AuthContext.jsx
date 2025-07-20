// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          setUser(null);
          setWalletBalance(0);
          setLoading(false);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setWalletBalance(parsedUser.walletBalance || 0);

        // Fetch latest user data
        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.user) {
          throw new Error('Invalid user data from server');
        }

        const userData = {
          ...res.data.user,
          id: res.data.user._id,
          createdAt: res.data.user.createdAt || new Date().toISOString(),
        };

        // Fallback: Fetch wallet balance if not in /api/auth/me
        let finalWalletBalance = userData.walletBalance || 0;
        if (!userData.walletBalance) {
          const walletRes = await axios.get(`${BACKEND_URL}/api/users/me/wallet`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          finalWalletBalance = walletRes.data.walletBalance || 0;
        }

        setUser(userData);
        setWalletBalance(finalWalletBalance);
        localStorage.setItem('user', JSON.stringify({ ...userData, walletBalance: finalWalletBalance }));
        console.log('[AuthContext] Initial walletBalance:', finalWalletBalance);
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Authentication failed';
        console.error('[AuthProvider] Auth check error:', {
          message,
          status: err.response?.status,
        });
        if (err.response?.status === 401) {
          logout();
          toast.error('Session expired, please log in again', {
            position: 'top-right',
            autoClose: 3000,
            theme: 'dark',
          });
        } else {
          setError(message);
          toast.error(message, {
            position: 'top-right',
            autoClose: 3000,
            theme: 'dark',
          });
        }
        setUser(null);
        setWalletBalance(0);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (err) {
        // Handled in refreshToken
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials);
      if (!res.data?.user || !res.data?.token) {
        throw new Error('Invalid login response');
      }
      const userData = {
        ...res.data.user,
        id: res.data.user._id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      setUser(userData);
      setWalletBalance(userData.walletBalance || 0);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Logged in successfully', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      return userData;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      console.error('[AuthProvider] Login error:', {
        message,
        status: err.response?.status,
      });
      setError(message);
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      if (!res.data?.user || !res.data?.token) {
        throw new Error('Registration failed');
      }
      const registeredUser = {
        ...res.data.user,
        id: res.data.user._id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      setUser(registeredUser);
      setWalletBalance(registeredUser.walletBalance || 0);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      toast.success('Registration successful', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      return registeredUser;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      console.error('[AuthProvider] Register error:', {
        message,
        status: err.response?.status,
      });
      setError(message);
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setWalletBalance(0);
    setError('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully', {
      position: 'top-right',
      autoClose: 2000,
      theme: 'dark',
    });
  };

  const updateUser = async (updates) => {
    setError('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(`${BACKEND_URL}/api/auth/me`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.user) throw new Error('Invalid update response');
      const updatedUser = {
        ...res.data.user,
        id: res.data.user._id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      setUser(updatedUser);
      setWalletBalance(updatedUser.walletBalance || 0);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      return updatedUser;
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to update profile';
      console.error('[AuthProvider] Update error:', {
        message,
        status: err.response?.status,
      });
      setError(message);
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.post(
        `${BACKEND_URL}/api/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.data?.token) throw new Error('Invalid refresh response');
      localStorage.setItem('token', res.data.token);
      if (res.data.user) {
        const userData = {
          ...res.data.user,
          id: res.data.user._id,
          createdAt: res.data.user.createdAt || new Date().toISOString(),
        };
        setUser(userData);
        setWalletBalance(userData.walletBalance || 0);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return res.data.token;
    } catch (err) {
      console.error('[AuthProvider] Token refresh error:', {
        message: err.response?.data?.error || err.message,
        status: err.response?.status,
      });
      logout();
      toast.error('Session expired, please log in again', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
      throw err;
    }
  };

  const contextValue = useMemo(
    () => ({ user, walletBalance, setWalletBalance, loading, error, login, register, logout, updateUser, refreshToken }),
    [user, walletBalance, loading, error]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};