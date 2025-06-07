import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CartCard = ({ cartItem, onCheckout }) => {
  const { logout } = useAuth();
  const [address, setAddress] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!cartItem || !cartItem._id || !cartItem.auction) {
    console.error('[CartCard] Invalid cartItem:', cartItem);
    return <div className="p-4 text-red-400 bg-gray-900 rounded-lg">Error: Invalid cart item</div>;
  }

  const handleCheckout = async () => {
    if (!address.trim()) {
      toast.error('Please enter a delivery address', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      return;
    }

    console.log('[CartCard] Checking out:', cartItem._id);
    setIsCheckingOut(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(
        `${BACKEND_URL}/api/cart/checkout`,
        { cartId: cartItem._id, address },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Checkout successful', {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
      onCheckout(cartItem._id); // Remove from UI
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Checkout failed';
      console.error('[CartCard] Error checking out:', message, err.response?.status);
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
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg shadow-md flex flex-col space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{cartItem.auction.title}</h3>
        <p className="text-sm text-gray-300">Amount: ${cartItem.amount.toFixed(2)}</p>
        <p className="text-sm text-gray-400">
          Added: {format(new Date(cartItem.addedAt), 'MMM d, yyyy h:mm a')}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter delivery address"
          className="p-2 bg-gray-900 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label="Delivery address"
        />
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut}
          className={`p-2 rounded-md text-white ${
            isCheckingOut ? 'bg-gray-600 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600'
          } transition-all duration-300`}
          aria-label={isCheckingOut ? 'Processing checkout' : 'Checkout item'}
        >
          {isCheckingOut ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
};

export default CartCard;