// src/components/AuctionDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AuctionDetail = () => {
  const { id } = useParams();
  const { user, walletBalance, loading } = useAuth();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');

  useEffect(() => {
    const fetchAuction = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auctions/${id}`, {
          headers: user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
        });
        setAuction(res.data);
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to load auction. Please try again.';
        setError(message);
        toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuction();
  }, [id, user]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'buyer') {
      toast.error('Please log in as a buyer to place a bid', { position: 'top-right', theme: 'dark' });
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/auctions/${id}/bids`,
        { amount: parseFloat(bidAmount) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAuction({ ...auction, bids: [...(auction.bids || []), res.data], currentBid: res.data.amount });
      setBidAmount('');
      toast.success('Bid placed successfully', { position: 'top-right', theme: 'dark' });
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to place bid';
      toast.error(message, { position: 'top-right', theme: 'dark' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const isSeller = user?.role === 'seller' && auction?.seller._id === user._id;
  const minBid = auction ? (auction.currentBid > 0 ? auction.currentBid : auction.startPrice) : 0;
  const canBid = user?.role === 'buyer' && walletBalance > minBid && auction?.status === 'active';

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-cyan-400 mx-auto"
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
          <p className="mt-2 text-gray-400">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-red-600 text-white p-3 rounded-lg text-sm text-center max-w-md mx-auto" role="alert">
          {error}
          <div className="mt-2">
            <Link to="/auctions" className="text-cyan-400 hover:underline" aria-label="Back to auctions">
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-900 to-cyan-700 p-6 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400">{auction.title}</h2>
          <p className="mt-2 text-sm text-gray-300">{auction.description}</p>
        </div>
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {auction.images && auction.images.length > 0 ? (
                <img
                  src={auction.images[0]}
                  alt={auction.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-300">
                Current Bid: <span className="text-cyan-400">${auction.currentBid || auction.startPrice}</span>
              </p>
              <p className="text-sm text-gray-300">
                Start Time: <span className="text-cyan-400">{formatDate(auction.startTime)}</span>
              </p>
              <p className="text-sm text-gray-300">
                End Time: <span className="text-cyan-400">{formatDate(auction.endTime)}</span>
              </p>
              <p className="text-sm text-gray-300">
                Status: <span className="text-cyan-400">{auction.status}</span>
              </p>
              <p className="text-sm text-gray-300">
                Seller: <span className="text-cyan-400">{auction.seller.name}</span>
              </p>
              {user?.role === 'buyer' && (
                <p className="text-sm text-gray-300">
                  Your Wallet Balance: <span className="text-cyan-400">${walletBalance.toFixed(2)}</span>
                </p>
              )}
            </div>
          </div>
          {user?.role === 'buyer' && (
            <form onSubmit={handlePlaceBid} className="mt-6 space-y-4">
              <div>
                <label htmlFor="bidAmount" className="block text-sm text-gray-300">
                  Your Bid (Min: ${(minBid + 0.01).toFixed(2)})
                </label>
                <input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={(minBid + 0.01).toFixed(2)}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-4 py-2 mt-1 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Enter bid amount"
                  aria-label="Bid amount"
                  disabled={isLoading || !canBid}
                />
                {!canBid && walletBalance <= minBid && (
                  <p className="text-sm text-red-400 mt-1">
                    Insufficient wallet balance. <Link to="/profile" className="text-cyan-400 hover:underline">Add funds</Link>
                  </p>
                )}
              </div>
              <button
                type="submit"
                className={`w-full px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                  isLoading || !canBid || !bidAmount || bidAmount <= minBid
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
                disabled={isLoading || !canBid || !bidAmount || bidAmount <= minBid}
                aria-label="Place bid"
              >
                {isLoading ? 'Placing Bid...' : 'Place Bid'}
              </button>
            </form>
          )}
          {isSeller && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-cyan-400">Bids</h3>
              {auction.bids && auction.bids.length > 0 ? (
                <ul className="mt-2 bg-gray-800 rounded-lg p-4 space-y-2" aria-live="polite">
                  {auction.bids.map((bid) => (
                    <li key={bid._id} className="text-sm text-gray-300">
                      <span className="text-cyan-400">${bid.amount}</span> by{' '}
                      <span className="font-medium">{bid.user.name}</span> at{' '}
                      {formatDate(bid.createdAt)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-400">No bids yet.</p>
              )}
            </div>
          )}
          <div className="mt-6">
            <Link
              to="/auctions"
              className="inline-block bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300"
              aria-label="Back to auctions"
            >
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;