import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import Notification from '../components/Notification';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Notifications = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // console.log('[Notifications] User:', user, 'Socket:', !!socket);
    const fetchNotifications = async () => {
      if (!user) {
        // console.log('[Notifications] No user, skipping fetchNotifications');
        setNotifications([]);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        const res = await axios.get(`${BACKEND_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validNotifications = (res.data || [])
          .filter((n) => n?._id && typeof n.read === 'boolean')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications(validNotifications);
        // console.log('[Notifications] Notifications fetched:', validNotifications);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load notifications.';
        setError(message);
        console.error('[Notifications] Error fetching notifications:', {
          message,
          status: err.response?.status,
        });
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!socket || !user) {
      // console.log('[Notifications] No socket or user, skipping WebSocket setup');
      return;
    }

    const handleNewNotification = (notification) => {
      // console.log('[Notifications] Received newNotification:', notification);
      if (!notification?._id || typeof notification.read !== 'boolean') {
        console.error('[Notifications] Invalid newNotification:', notification);
        return;
      }
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          // console.log('[Notifications] Duplicate notification ignored:', notification._id);
          return prev;
        }
        return [notification, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    };

    const handleNotificationRead = ({ _id, read }) => {
      // console.log('[Notifications] Received notificationRead:', { _id, read });
      if (!_id || typeof read !== 'boolean') {
        console.error('[Notifications] Invalid notificationRead:', { _id, read });
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === _id ? { ...n, read } : n))
      );
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('notificationRead', handleNotificationRead);
    socket.on('connect_error', (err) => {
      console.error('[Notifications] Socket connect error:', err.message);
    });

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('notificationRead', handleNotificationRead);
      socket.off('connect_error');
    };
  }, [socket, user]);

  const markAsRead = async (id) => {
    if (!id) {
      console.error('[Notifications] Invalid notification ID:', id);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(`${BACKEND_URL}/api/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      // console.log('[Notifications] Marked as read:', res.data);
    } catch (err) {
      console.error('[Notifications] Error marking as read:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="animate-spin h-12 w-12 mx-auto text-cyan-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto">
          {error}
          <p className="mt-2">
            <Link to="/" className="text-cyan-400 hover:text-cyan-300 underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-6">Notifications</h1>
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {notifications.map((notification) =>
                notification ? (
                  <li key={notification._id}>
                    <Notification
                      notification={notification}
                      onMarkAsRead={() => markAsRead(notification._id)}
                    />
                  </li>
                ) : null
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;