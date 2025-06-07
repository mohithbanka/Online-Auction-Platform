import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import CartCard from '../components/CartCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    // console.log('[Cart] Fetching cart items');
    const fetchCartItems = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // console.log('[Cart] No token found');
          setCartItems([]);
          return;
        }
        const res = await axios.get(`${BACKEND_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const validItems = (res.data || []).filter((item) => item?._id && item?.auction);
        setCartItems(validItems);
        // console.log('[Cart] Cart items fetched:', validItems);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load cart items.';
        setError(message);
        console.error('[Cart] Error fetching cart items:', {
          message,
          status: err.response?.status,
        });
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  const handleSelectItem = (id) => {
    // console.log('[Cart] Toggling item selection:', id);
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDeleteItem = async (id) => {
    // console.log('[Cart] Deleting item:', id);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      await axios.delete(`${BACKEND_URL}/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems((prev) => prev.filter((item) => item._id !== id));
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      toast.success('Item removed from cart', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (err) {
      console.error('[Cart] Error deleting item:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
      toast.error('Failed to remove item', {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  const applyCoupon = async () => {
    // console.log('[Cart] Applying coupon:', couponCode);
    setIsApplyingCoupon(true);
    try {
      // Mock API call (replace with real API if available)
      if (couponCode === 'DISCOUNT10') {
        setDiscount(10);
        toast.success('Coupon applied: $10 off', {
          position: 'top-right',
          autoClose: 2000,
        });
      } else {
        throw new Error('Invalid coupon code');
      }
    } catch (err) {
      setDiscount(0);
      toast.error(err.message || 'Failed to apply coupon', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const calculateSummary = () => {
    const totalItems = selectedItems.length;
    const subtotal = selectedItems.reduce((sum, id) => {
      const item = cartItems.find((item) => item._id === id);
      return sum + (item?.amount || 0);
    }, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax - discount;
    return { totalItems, subtotal, tax, total };
  };

  const handleCheckout = async () => {
    // console.log('[Cart] Initiating checkout:', selectedItems);
    if (selectedItems.length === 0) {
      toast.error('Please select items to checkout', {
        position: 'top-right',
        autoClose: 2000,
      });
      return;
    }
    setIsCheckingOut(true);
    try {
      // Placeholder for checkout API or redirect
      // e.g., await axios.post(`${BACKEND_URL}/api/checkout`, { items: selectedItems });
      toast.success('Proceeding to checkout', {
        position: 'top-right',
        autoClose: 2000,
      });
      // Example redirect: window.location.href = '/checkout';
    } catch (err) {
      console.error('[Cart] Checkout error:', {
        message: err.response?.data?.message || err.message,
        status: err.response?.status,
      });
      toast.error('Checkout failed', {
        position: 'top-right',
        autoClose: 2000,
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const { totalItems, subtotal, tax, total } = calculateSummary();

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
          <p className="mt-2 text-sm">Loading cart...</p>
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
            <Link to="/auctions" className="text-cyan-400 hover:text-cyan-300 underline">
              Browse Auctions
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-8">Your Cart</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side: Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-center text-gray-400">
                <p>Your cart is empty.</p>
                <p className="mt-2">
                  <Link to="/auctions" className="text-cyan-400 hover:text-cyan-300 underline">
                    Explore Auctions
                  </Link>
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {cartItems.map((item) => (
                  <CartCard
                    key={item._id}
                    cartItem={item}
                    onSelect={handleSelectItem}
                    onDelete={handleDeleteItem}
                    isSelected={selectedItems.includes(item._id)}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Right Side: Order Summary */}
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Order Summary</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Total Items</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax (10%)</span>
                <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span>Order Total</span>
                <span>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon Code"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm disabled:opacity-50"
                  disabled={isApplyingCoupon}
                  aria-label="Coupon code"
                />
                <button
                  onClick={applyCoupon}
                  disabled={isApplyingCoupon || !couponCode}
                  className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${
                    isApplyingCoupon || !couponCode
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                  aria-label="Apply coupon"
                >
                  {isApplyingCoupon ? 'Applying...' : 'Apply'}
                </button>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || selectedItems.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
                  isCheckingOut || selectedItems.length === 0
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500'
                }`}
                aria-label="Proceed to checkout"
              >
                {isCheckingOut ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin mr-2 h-5 w-5 text-white"
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
                    Processing...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;