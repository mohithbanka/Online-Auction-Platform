import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MyBids = () => {
  const { user } = useAuth();
  const { socket, connectionStatus, on, off } = useSocket();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bidsPerPage = 12;

  // Fetch user's bids
  const fetchBids = useCallback(
    async (pageNum = 1, append = false) => {
      if (!user) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        const res = await axios.get(`${BACKEND_URL}/api/bids/my-bids`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: pageNum, limit: bidsPerPage },
        });
        const newBids = res.data.bids || [];
        setBids((prev) => (append ? [...prev, ...newBids] : newBids));
        setTotalPages(res.data.pages || 1);
        console.log('[MyBids] Fetched bids:', {
          count: newBids.length,
          page: pageNum,
          totalPages: res.data.pages,
        });
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to fetch bids';
        console.error('[MyBids] Fetch error:', message);
        setError(message);
        toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    fetchBids(1, false);
  }, [fetchBids]);

  // Subscribe to real-time bid updates
  useEffect(() => {
    if (!socket || connectionStatus !== 'connected') return;

    const handleBidUpdate = (updatedBid) => {
      setBids((prevBids) =>
        prevBids.map((bid) =>
          bid._id === updatedBid._id ? { ...bid, ...updatedBid } : bid
        )
      );
      if (updatedBid.status === 'outbid') {
        toast.warn(`You've been outbid on ${updatedBid.auction.title}`, {
          position: 'top-right',
          autoClose: 3000,
          theme: 'dark',
        });
      } else if (updatedBid.status === 'won') {
        toast.success(`You won the auction for ${updatedBid.auction.title}!`, {
          position: 'top-right',
          autoClose: 3000,
          theme: 'dark',
        });
      }
    };

    on('bidUpdate', handleBidUpdate);

    return () => {
      off('bidUpdate', handleBidUpdate);
    };
  }, [socket, connectionStatus, on, off]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBids(nextPage, true);
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 text-lg pt-10">
        Please log in to view your bids.{' '}
        <Link to="/login" className="text-cyan-500 hover:underline">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-black text-white">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">My Bids</h1>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
          {Array(bidsPerPage)
            .fill()
            .map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded"></div>
              </div>
            ))}
        </div>
      )}

      {error && (
        <div className="text-center bg-red-600 text-white p-3 rounded-lg mb-4" role="alert">
          {error}
          <button
            onClick={() => fetchBids(1, false)}
            className="ml-4 text-cyan-400 hover:underline"
            aria-label="Retry loading bids"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bids.length === 0 && (
        <div className="text-center text-gray-400">
          You haven't placed any bids yet.{' '}
          <Link to="/auctions" className="text-cyan-500 hover:underline">
            Browse auctions
          </Link>
        </div>
      )}

      {!loading && !error && bids.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
          {bids.map((bid) => (
            <div
              key={bid._id}
              className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              role="article"
            >
              <h2 className="text-xl font-semibold mb-2">{bid.auction.title}</h2>
              <p className="text-gray-400 mb-1">
                Bid Amount: <span className="text-white">${bid.amount.toFixed(2)}</span>
              </p>
              <p className="text-gray-400 mb-1">
                Status:{' '}
                <span
                  className={`${
                    bid.status === 'won'
                      ? 'text-green-500'
                      : bid.status === 'outbid'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  } capitalize`}
                >
                  {bid.status}
                </span>
              </p>
              <p className="text-gray-400 mb-4">
                Placed on: {new Date(bid.createdAt).toLocaleDateString()}
              </p>
              <Link
                to={`/auctions/${bid.auction._id}`}
                className="inline-block bg-cyan-500 text-black px-4 py-2 rounded hover:bg-cyan-600 transition-colors"
                aria-label={`View auction ${bid.auction.title}`}
              >
                View Auction
              </Link>
            </div>
          ))}
        </div>
      )}

      {!loading && page < totalPages && bids.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
            aria-label="Load more bids"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBids;