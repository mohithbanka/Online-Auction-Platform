import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { CheckCircleIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Notification = ({ notification, onMarkAsRead }) => {
  const { user, logout } = useAuth();
  const [isMarking, setIsMarking] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isRead, setIsRead] = useState(notification.read || false);

  if (!notification || !notification._id) {
    console.error('[Notification] Invalid notification prop:', notification);
    return <div className="p-4 text-red-400 bg-gray-900 rounded-lg">Error: Invalid notification</div>;
  }

  const handleMarkAsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMarking || isRead) return;

    console.log('[Notification] Marking as read:', notification._id);
    setIsMarking(true);
    setIsRead(true);
    try {
      await onMarkAsRead();
      toast.success('Notification marked as read', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    } catch (err) {
      console.error('[Notification] Error marking as read:', err.message);
      setIsRead(notification.read || false);
      toast.error('Failed to mark as read', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    } finally {
      setIsMarking(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAddingToCart || !notification.auction?._id) return;

    console.log('[Notification] Adding to cart:', notification.auction._id);
    setIsAddingToCart(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(
        `${BACKEND_URL}/api/cart`,
        { auctionId: notification.auction._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Added to cart', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to add to cart';
      console.error('[Notification] Error adding to cart:', message, err.response?.status);
      if (err.response?.status === 401 || err.message === 'No authentication token found') {
        logout();
        toast.error('Session expired, please log in again', {
          position: 'top-right',
          autoClose: 2000,
          theme: 'dark',
        });
      } else {
        toast.error(message, {
          position: 'top-right',
          autoClose: 2000,
          theme: 'dark',
        });
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleLinkClick = () => {
    if (!isRead && onMarkAsRead && !isMarking) {
      console.log('[Notification] Link clicked, marking as read:', notification._id);
      setIsRead(true);
      onMarkAsRead();
    }
  };

  const createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date();

  return (
    <div className="relative bg-gray-800 rounded-lg shadow-md mb-2">
      <Link
        to={notification.auction?._id ? `/auctions/${notification.auction._id}` : '#'}
        onClick={handleLinkClick}
        className={`block p-4 rounded-lg transition-all duration-300 ${
          !isRead ? 'bg-gradient-to-r from-cyan-900 to-blue-900' : 'bg-gray-800'
        } hover:bg-gray-700`}
        aria-label={`View notification for ${notification.auction?.title || 'unknown auction'}`}
      >
        <div className="flex justify-between items-start">
          <div>
            {notification.auction?.title && (
              <p className="text-sm font-semibold text-white">{notification.auction.title}</p>
            )}
            <p className="text-sm text-gray-300">{notification.message || 'No message'}</p>
          </div>
          {!isRead && (
            <span
              className="ml-2 inline-block h-3 w-3 rounded-full bg-red-500 animate-pulse"
              aria-label="Unread notification"
            ></span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">{format(createdAt, 'MMM d, yyyy h:mm a')}</p>
      </Link>
      <div className="absolute top-4 right-4 flex space-x-2">
        {!isRead && (
          <button
            onClick={handleMarkAsRead}
            disabled={isMarking || isRead}
            className={`p-1 rounded-full ${
              isMarking ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
            } transition-all duration-300`}
            title="Mark as read"
            aria-label="Mark notification as read"
          >
            <CheckCircleIcon
              className={`h-5 w-5 ${isMarking ? 'text-gray-500' : 'text-green-400 hover:text-green-300'}`}
            />
          </button>
        )}
        {user?.role === 'buyer' && notification.auction?._id && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart}
            className={`p-1 rounded-full ${
              isAddingToCart ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
            } transition-all duration-300`}
            title="Add to cart"
            aria-label="Add auction to cart"
          >
            <ShoppingCartIcon
              className={`h-5 w-5 ${isAddingToCart ? 'text-gray-500' : 'text-cyan-400 hover:text-cyan-300'}`}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;