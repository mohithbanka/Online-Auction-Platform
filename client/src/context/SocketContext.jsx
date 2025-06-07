import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext(null);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectionError, setConnectionError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // console.log('[SocketProvider] No user, skipping socket connection');
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      // console.log('[SocketProvider] No token found, skipping socket connection');
      setConnectionError('Authentication required for real-time updates');
      toast.error('Please log in to enable real-time updates', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }

    // console.log('[SocketProvider] Creating socket connection for user:', user.id || user._id);

    const newSocket = io(BACKEND_URL, {
      withCredentials: false,
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      // console.log('[SocketProvider] Socket connected:', newSocket.id, 'User:', user.id || user._id);
      setConnectionError('');
      toast.success('Connected to real-time updates', {
        position: 'top-right',
        autoClose: 2000,
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('[SocketProvider] Connection error:', error.message);
      setConnectionError('Failed to connect to real-time updates');
      toast.error('Connection error, retrying...', {
        position: 'top-right',
        autoClose: 2000,
      });
    });

    newSocket.on('reconnect', (attempt) => {
      // console.log('[SocketProvider] Reconnected after', attempt, 'attempts');
      setConnectionError('');
      toast.success('Reconnected to real-time updates', {
        position: 'top-right',
        autoClose: 2000,
      });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('[SocketProvider] Reconnection failed');
      setConnectionError('Failed to reconnect to real-time updates');
      toast.error('Failed to reconnect, please refresh the page', {
        position: 'top-right',
        autoClose: 2000,
      });
    });

    newSocket.on('disconnect', (reason) => {
      // console.log('[SocketProvider] Socket disconnected:', reason);
      if (reason !== 'io client disconnect') {
        setConnectionError('Disconnected from real-time updates');
        toast.warn('Disconnected, attempting to reconnect...', {
          position: 'top-right',
          autoClose: 2000,
        });
      }
    });

    setSocket(newSocket);

    return () => {
      // console.log('[SocketProvider] Cleaning up socket for user:', user.id || user._id);
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};