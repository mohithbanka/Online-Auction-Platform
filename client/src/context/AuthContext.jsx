import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AuthContext = createContext();
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      // console.log('[AuthProvider] Initiating auth check');
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // console.log('[AuthProvider] Restored user from localStorage:', parsedUser);
          setUser(parsedUser);
        } else {
          // console.log('[AuthProvider] No token or user in localStorage');
          setLoading(false);
          return;
        }

        const res = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data?.user) {
          throw new Error('Invalid user data from server');
        }

        const userData = {
          ...res.data.user,
          id: res.data.user._id,
          createdAt: res.data.user.createdAt || new Date().toISOString(), // Fallback
        };
        // console.log('[AuthProvider] User data fetched from API:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Authentication failed';
        console.error('[AuthProvider] Auth check error:', {
          message,
          status: err.response?.status,
          response: err.response?.data,
        });
        if (err.response?.status === 401) {
          // console.log('[AuthProvider] Invalid token, clearing auth');
          logout();
          toast.error('Session expired, please log in again', {
            position: 'top-right',
            autoClose: 2000,
          });
        } else {
          setError(message);
          toast.error(message, {
            position: 'top-right',
            autoClose: 2000,
          });
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    // console.log('[AuthProvider] Logging in:', credentials.email);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, credentials);
      if (!res.data?.user || !res.data?.token) {
        throw new Error('Invalid login response');
      }
      const userData = {
        ...res.data.user,
        id: res.data.user.id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      // console.log('[AuthProvider] Login user data:', userData);
      setUser(userData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Logged in successfully', {
        position: 'top-right',
        autoClose: 2000,
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
        autoClose: 2000,
      });
      throw err;
    }
  };

  const register = async (userData) => {
    // console.log('[AuthProvider] Registering:', userData.email);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, userData);
      if (!res.data?.user || !res.data?.token) {
        throw new Error('Registration failed');
      }
      const registeredUser = {
        ...res.data.user,
        id: res.data.user.id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      // console.log('[AuthProvider] Registered user data:', registeredUser);
      setUser(registeredUser);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      toast.success('Registration successful', {
        position: 'top-right',
        autoClose: 2000,
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
        autoClose: 2000,
      });
      throw err;
    }
  };

  const logout = () => {
    // console.log('[AuthProvider] Logging out');
    setUser(null);
    setError('');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  const updateUser = async (updates) => {
    // console.log('[AuthProvider] Updating user:', updates);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(`${BACKEND_URL}/api/users/me`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.data.user) throw new Error('Invalid update response');
      const updatedUser = {
        ...res.data.user,
        id: res.data.user.id,
        createdAt: res.data.user.createdAt || new Date().toISOString(),
      };
      // console.log('[AuthProvider] Updated user data:', updatedUser);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully', {
        position: 'top-right',
        autoClose: 2000,
      });
      return updatedUser;
    } catch (err){}
    const message = err.response?.data?.error || err.message || 'Failed to update profile';
    console.error('[AuthProvider] Update error:', {
      message,
      status: err.response?.status,
    });
    setError(message);
    toast.error(message, {
      position: 'top-right',
      autoClose: 2000,
    });
    throw err;
  };

  const refreshToken = async () => {
    // console.log('[AuthProvider] Attempting to refresh token');
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
      // console.log('[AuthProvider] Token refreshed successfully');
      return res.data.token;
    } catch (err) {
      console.error('[AuthProvider] Token refresh error:', {
        message: err.response?.data?.error || err.message,
        status: err.response?.status,
      });
      logout();
      toast.error('Session expired, please log in again', {
        position: 'top-right',
        autoClose: 2000,
      });
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, updateUser, refreshToken }}>
      {loading ? (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg
              className="animate-spin h-12 w-12 mx-auto text-cyan-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="mt-2 text-sm">Checking authentication...</p>
          </div>
        </div>
      ) : (
        children
      )}
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