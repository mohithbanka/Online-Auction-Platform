import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import BidForm from '../components/BidForm';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endTime) return;

    const updateTimer = () => {
      const now = new Date();
      const end = new Date(endTime);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span className="text-cyan-400 font-semibold">{timeLeft || 'Calculating...'}</span>;
};

const BidPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Invalid auction ID.');
      setIsLoading(false);
      console.error('[BidPage] No auction ID provided');
      return;
    }

    const fetchAuction = async () => {
      setIsLoading(true);
      setError('');
      try {
        const headers = user && localStorage.getItem('token')
          ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
          : {};
        const res = await axios.get(`${BACKEND_URL}/api/auctions/${id}`, { headers });
        if (!res.data) {
          throw new Error('No auction data returned');
        }
        setAuction(res.data);
      } catch (err) {
        const message = err.response?.data?.message || err.message || 'Failed to load auction.';
        setError(message);
        console.error('[BidPage] Fetch error:', {
          message,
          status: err.response?.status,
          data: err.response?.data,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuction();
  }, [id, user]);

  const handleBidPlaced = (bid) => {
    setAuction((prev) =>
      prev
        ? {
            ...prev,
            currentBid: bid.amount,
            bids: [...(prev.bids || []), bid], // Append new bid
          }
        : null
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-gray-400">
          <svg
            className="animate-spin h-8 w-8 mx-auto text-cyan-500"
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
          <p className="mt-2 text-sm">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-red-600 text-white p-4 rounded-lg text-sm text-center max-w-md mx-auto">
          {error || 'Auction not found.'}
          <p className="mt-2">
            <Link to="/auctions" className="text-cyan-400 hover:text-cyan-300 underline">
              Back to Auctions
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const isLive =
    new Date(auction.startTime) <= new Date() && new Date(auction.endTime) >= new Date();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-slide-in">
          <Link
            to="/auctions"
            className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mb-4"
            aria-label="Back to Auctions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Auctions
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Auction Details */}
            <div className="lg:w-2/3 bg-gray-900 p-6 rounded-xl shadow-lg text-white">
              <img
                src={auction.images?.[0] || 'https://via.placeholder.com/600x400'}
                alt={auction.title || 'Auction image'}
                className="w-full h-64 sm:h-80 object-cover rounded-lg"
                loading="lazy"
              />
              <h2 className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-6">{auction.title || 'Untitled Auction'}</h2>
              <p className="text-gray-400 text-sm sm:text-base mt-4">{auction.description || 'No description available.'}</p>
              <div className="mt-6 space-y-3 text-sm">
                <p className="text-gray-400">
                  <strong>Start Time:</strong>{' '}
                  {auction.startTime ? new Date(auction.startTime).toLocaleString() : 'N/A'}
                </p>
                <p className="text-gray-400">
                  <strong>End Time:</strong>{' '}
                  {auction.endTime ? new Date(auction.endTime).toLocaleString() : 'N/A'}
                </p>
                {isLive && (
                  <p className="text-gray-400">
                    <strong>Time Remaining:</strong> <CountdownTimer endTime={auction.endTime} />
                  </p>
                )}
                <p className="text-lg font-semibold text-white">
                  <strong>Current Bid:</strong> ${(auction.currentBid || auction.startPrice || 0).toLocaleString()}
                </p>
                <p className="text-gray-400">
                  <strong>Starting Price:</strong> ${(auction.startPrice || 0).toLocaleString()}
                </p>
                {isLive && (
                  <span className="inline-block px-3 py-1 bg-green-600 text-xs text-white rounded-full">Live</span>
                )}
              </div>

              {/* Bid History */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Bid History</h3>
                {auction.bids && auction.bids.length > 0 ? (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {auction.bids
                      .slice()
                      .reverse()
                      .map((bid, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded-lg shadow-sm"
                        >
                          <div className="text-sm text-gray-200 font-medium">
                            {bid.bidderName}
                            <div className="text-xs text-gray-400">
                              {new Date(bid.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-base font-semibold text-white">
                            ${bid.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No bids yet.</p>
                )}
              </div>
            </div>

            {/* Right: Bid Form */}
            <div className="lg:w-1/3">
              <BidForm auction={auction} onBidPlaced={handleBidPlaced} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidPage;
