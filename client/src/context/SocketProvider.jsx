// src/context/SocketProvider.jsx
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState('');
  const { user, refreshToken, logout, setWalletBalance } = useAuth();

  const debouncedToastError = useCallback(
    debounce((message) => {
      toast.error(message, {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
    }, 2000),
    []
  );

  const debouncedToastSuccess = useCallback(
    debounce((message) => {
      toast.success(message, {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    }, 2000),
    []
  );

  useEffect(() => {
    if (!BACKEND_URL) {
      console.error('[SocketProvider] BACKEND_URL is not defined');
      setConnectionStatus('error');
      setConnectionError('Server configuration error');
      debouncedToastError('Unable to connect due to server configuration');
      return;
    }

    if (!user || !localStorage.getItem('token')) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnectionStatus('disconnected');
        setConnectionError('');
      }
      return;
    }

    setConnectionStatus('connecting');
    const token = localStorage.getItem('token');
    const newSocket = io(BACKEND_URL, {
      withCredentials: false,
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      randomizationFactor: 0.5,
    });

    newSocket.on('connect', () => {
      setConnectionStatus('connected');
      setConnectionError('');
      if (connectionStatus !== 'connected') {
        debouncedToastSuccess('Connected to real-time updates');
      }
      console.log('[SocketProvider] Connected to server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[SocketProvider] Connection error:', error.message);
      setConnectionStatus('error');
      setConnectionError('Failed to connect to real-time updates');
      debouncedToastError(`Connection error: ${error.message}`);
    });

    newSocket.on('reconnect', (attempt) => {
      setConnectionStatus('connected');
      setConnectionError('');
      console.log('[SocketProvider] Reconnected after', attempt, 'attempts');
      debouncedToastSuccess('Reconnected to real-time updates');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[SocketProvider] Reconnection failed');
      setConnectionStatus('error');
      setConnectionError('Failed to reconnect to real-time updates');
      debouncedToastError('Failed to reconnect, please log in again');
      logout();
    });

    newSocket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        setConnectionStatus('disconnected');
        setConnectionError('Disconnected from real-time updates');
        debouncedToastError('Disconnected, attempting to reconnect...');
      }
      console.log('[SocketProvider] Disconnected:', reason);
    });

    newSocket.on('error', async (error) => {
      console.error('[SocketProvider] Socket error:', error.message);
      if (error.message.includes('token') || error.message.includes('auth')) {
        try {
          const newToken = await refreshToken();
          newSocket.auth.token = newToken;
          newSocket.connect();
          console.log('[SocketProvider] Retrying with new token');
        } catch (err) {
          setConnectionStatus('error');
          setConnectionError('Authentication failed');
          debouncedToastError('Session expired, logging out...');
          logout();
        }
      } else {
        setConnectionStatus('error');
        setConnectionError(error.message);
        debouncedToastError(`Socket error: ${error.message}`);
      }
    });

    newSocket.on('walletUpdate', ({ userId, walletBalance: newBalance }) => {
      console.log('[SocketProvider] Received walletUpdate:', { userId, newBalance });
      if (user && userId === user.id) {
        setWalletBalance(newBalance);
        debouncedToastSuccess(`Wallet updated: $${newBalance.toFixed(2)}`);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('reconnect');
      newSocket.off('reconnect_failed');
      newSocket.off('disconnect');
      newSocket.off('error');
      newSocket.off('walletUpdate');
      newSocket.disconnect();
      setSocket(null);
      setConnectionStatus('disconnected');
      setConnectionError('');
    };
  }, [user, refreshToken, logout, setWalletBalance, debouncedToastError, debouncedToastSuccess]);

  const on = useCallback(
    (event, callback) => {
      if (socket) {
        socket.on(event, callback);
        console.log('[SocketProvider] Subscribed to event:', event);
      }
    },
    [socket]
  );

  const off = useCallback(
    (event, callback) => {
      if (socket) {
        socket.off(event, callback);
        console.log('[SocketProvider] Unsubscribed from event:', event);
      }
    },
    [socket]
  );

  const contextValue = useMemo(
    () => ({ socket, connectionStatus, connectionError, on, off }),
    [socket, connectionStatus, connectionError, on, off]
  );

  return <SocketContext.Provider value={contextValue}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};