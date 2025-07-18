import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Optional TypeScript types (uncomment if using TypeScript)
// interface User {
//   id: string;
//   email: string;
//   createdAt: string;
//   [key: string]: any;
// }
// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   error: string;
//   login: (credentials: { email: string; password: string }) => Promise<User>;
//   register: (userData: { email: string; password: string; [key: string]: any }) => Promise<User>;
//   logout: () => void;
//   updateUser: (updates: Partial<User>) => Promise<User>;
//   refreshToken: () => Promise<string>;
// }

const AuthContext = createContext/*<AuthContextType>*/(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// Token refresh interval (e.g., every 15 minutes)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Initialize loading to false
  const [error, setError] = useState('');

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          setUser(null);
          return;
        }

        // Parse user data and set it immediately for faster rendering
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Validate token with the server
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
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
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
      }
    };

    checkAuth();
  }, []);

  // Periodic token refresh
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (err) {
        // Error handling is done in refreshToken
      }
    }, TOKEN_REFRESH_INTERVAL);

    return () => clearInterval(refreshInterval);
  }, [user]);

  const login = async (credentials) => {
    setError('');
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
    }
  };

  const register = async (userData) => {
    setError('');
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
    }
  };

  const logout = () => {
    setUser(null);
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
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(`${BACKEND_URL}/api/auth/me`, updates, {
        // Changed from /api/users/me to /api/auth/me
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.user) throw new Error('Invalid update response');
      const updatedUser = {
        ...res.data.user,
        id: res.data.user._id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      setUser(updatedUser);
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ user, loading, error, login, register, logout, updateUser, refreshToken }),
    [user, loading, error]
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