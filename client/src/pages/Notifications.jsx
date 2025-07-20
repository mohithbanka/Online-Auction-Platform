// src/components/Notifications.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { toast } from 'react-toastify';
// import Notification from './Notification';
import Notification from '../components/Notification';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const PAGE_SIZE = 10;

const Notifications = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const observer = useRef(null);
  const lastNotificationRef = useRef(null);

  const fetchNotifications = useCallback(async (pageNum, reset = false) => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      setHasMore(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      if (reset) setLoading(true);
      else setLoadingMore(true);

      const res = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pageNum, limit: PAGE_SIZE },
      });

      const validNotifications = (res.data || [])
        .filter((n) => n?._id && typeof n.read === 'boolean')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications((prev) => (reset ? validNotifications : [...prev, ...validNotifications]));
      setHasMore(validNotifications.length === PAGE_SIZE);
      setError('');
      console.log('[Notifications] Fetched notifications:', validNotifications.length, 'Page:', pageNum);
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to load notifications';
      setError(message);
      toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
      console.error('[Notifications] Fetch error:', { message, status: err.response?.status });
    } finally {
      if (reset) setLoading(false);
      else setLoadingMore(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  useEffect(() => {
    if (loading || loadingMore || !hasMore || !user) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => {
            const nextPage = prev + 1;
            fetchNotifications(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );

    if (lastNotificationRef.current) {
      observer.current.observe(lastNotificationRef.current);
    }

    return () => {
      if (observer.current && lastNotificationRef.current) {
        observer.current.unobserve(lastNotificationRef.current);
      }
    };
  }, [loading, loadingMore, hasMore, user, fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) {
      console.log('[Notifications] No socket or user, skipping WebSocket setup');
      return;
    }

    const handleNewNotification = (notification) => {
      console.log('[Notifications] Received newNotification:', notification);
      if (!notification?._id || typeof notification.read !== 'boolean') {
        console.error('[Notifications] Invalid newNotification:', notification);
        return;
      }
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) {
          console.log('[Notifications] Duplicate notification ignored:', notification._id);
          return prev;
        }
        return [notification, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    };

    const handleNotificationRead = ({ _id, read }) => {
      console.log('[Notifications] Received notificationRead:', { _id, read });
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
      toast.error('Failed to connect to real-time updates', {
        position: 'top-right',
        autoClose: 3000,
        theme: 'dark',
      });
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
      await axios.put(`${BACKEND_URL}/api/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      console.log('[Notifications] Marked notification as read:', id);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to mark notification as read';
      console.error('[Notifications] Error marking as read:', {
        message,
        status: err.response?.status,
      });
      toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.put(`${BACKEND_URL}/api/notifications/read-all`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success(res.data.message || 'All notifications marked as read', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      console.log('[Notifications] Marked all notifications as read');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to mark all notifications as read';
      console.error('[Notifications] Error marking all as read:', {
        message,
        status: err.response?.status,
      });
      toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
    } finally {
      setIsMarkingAll(false);
    }
  };

  const clearReadNotifications = async () => {
    setIsClearing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      const res = await axios.delete(`${BACKEND_URL}/api/notifications/clear-read`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success(res.data.message || 'Read notifications cleared', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      console.log('[Notifications] Cleared read notifications');
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to clear notifications';
      console.error('[Notifications] Error clearing notifications:', {
        message,
        status: err.response?.status,
      });
      toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
    } finally {
      setIsClearing(false);
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-sm">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto" role="alert">
          {error}
          <button
            onClick={() => fetchNotifications(1, true)}
            className="mt-2 px-4 py-1 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors duration-200"
            aria-label="Retry loading notifications"
          >
            Retry
          </button>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">Notifications</h1>
          {notifications.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={markAllAsRead}
                disabled={isMarkingAll || notifications.every((n) => n.read)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isMarkingAll || notifications.every((n) => n.read)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
                aria-label="Mark all notifications as read"
              >
                {isMarkingAll ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Marking...
                  </span>
                ) : (
                  'Mark All as Read'
                )}
              </button>
              <button
                onClick={clearReadNotifications}
                disabled={isClearing || !notifications.some((n) => n.read)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isClearing || !notifications.some((n) => n.read)
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                aria-label="Clear read notifications"
              >
                {isClearing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Clearing...
                  </span>
                ) : (
                  'Clear Read'
                )}
              </button>
            </div>
          )}
        </div>
        <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No notifications yet</div>
          ) : (
            <ul className="divide-y divide-gray-800" role="list">
              {notifications.map((notification, index) =>
                notification ? (
                  <li
                    key={notification._id}
                    ref={index === notifications.length - 1 ? lastNotificationRef : null}
                    className="transition-opacity duration-300 hover:bg-gray-800"
                    role="listitem"
                  >
                    <Notification
                      notification={notification}
                      onMarkAsRead={() => markAsRead(notification._id)}
                    />
                  </li>
                ) : null
              )}
            </ul>
          )}
          {loadingMore && (
            <div className="p-4 text-center text-gray-400">
              <svg
                className="animate-spin h-8 w-8 mx-auto text-cyan-500"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="mt-2 text-sm">Loading more...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;