import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const BidForm = ({ auction, onBidPlaced = () => {} }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [bidAmount, setBidAmount] = useState('');
  const [minBid, setMinBid] = useState(0);
  const [bids, setBids] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [optimisticBidId, setOptimisticBidId] = useState(null);
  const abortControllerRef = useRef(null);

  const auctionId = useMemo(() => auction?._id?.toString(), [auction?._id]);

  useEffect(() => {
    // console.log('[BidForm] Auction:', { auctionId, user: user?.id, auction });
    abortControllerRef.current = new AbortController();
    return () => abortControllerRef.current.abort();
  }, [auctionId, user?.id, auction]);

  useEffect(() => {
    if (!socket || !auctionId || !user?._id) {
      // console.log('[BidForm] Cannot join auction room:', {
      //   socket: !!socket,
      //   auctionId,
      //   userId: user?._id,
      // });
      return;
    }

    const handleConnect = () => {
      if (socket.connected) {
        socket.emit('joinAuction', auctionId);
        // console.log(`[BidForm] Joined auction room: ${auctionId}`);
      } else {
        // console.log('[BidForm] Socket not connected on connect event');
      }
    };

    if (socket.connected) {
      socket.emit('joinAuction', auctionId);
      // console.log(`[BidForm] Joined auction room: ${auctionId}`);
    } else {
      // console.log('[BidForm] Socket not connected initially');
    }

    socket.on('connect', handleConnect);
    socket.on('connect_error', (error) => {
      console.error('[BidForm] Socket connect error:', error.message);
      toast.error('WebSocket connection failed');
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error');
      if (socket.connected) {
        socket.emit('leaveAuction', auctionId);
        // console.log(`[BidForm] Left auction room: ${auctionId}`);
      }
    };
  }, [socket, auctionId, user?._id]);

  useEffect(() => {
    if (!auction) {
      // console.log('[BidForm] No auction data');
      return;
    }

    const initialMin =
      Math.max(auction.currentBid || auction.startPrice || 0, auction.startPrice || 0) + 1;
    // console.log('[BidForm] Setting initial min bid:', initialMin);
    setMinBid(initialMin);
    setBidAmount(initialMin.toString());
  }, [auction]);

  useEffect(() => {
    const fetchBids = async () => {
      if (!auctionId) {
        // console.log('[BidForm] No auctionId for fetching bids');
        return;
      }

      try {
        // console.log('[BidForm] Fetching bids for auction:', auctionId);
        const res = await axios.get(`${BACKEND_URL}/api/bids/${auctionId}`, {
          signal: abortControllerRef.current.signal,
        });
        const sortedBids = (res.data || []).sort((a, b) => b.amount - a.amount);
        setBids(sortedBids);
        // console.log('[BidForm] Bids fetched:', sortedBids);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('[BidForm] Error fetching bids:', err.message);
          toast.error('Failed to load bid history');
        }
      }
    };

    fetchBids();
  }, [auctionId]);

  useEffect(() => {
    if (!socket || !auctionId) {
      // console.log('[BidForm] Cannot set up newBid listener:', {
      //   socket: !!socket,
      //   auctionId,
      // });
      return;
    }

    const handleNewBid = (newBid) => {
      // console.log('[BidForm] Received newBid:', newBid);
      if (newBid.auction !== auctionId) {
        // console.log('[BidForm] Bid ignored, wrong auction:', newBid.auction);
        return;
      }

      setBids((prev) => {
        if (prev.some((bid) => bid._id === newBid._id)) {
          // console.log('[BidForm] Duplicate bid ignored:', newBid._id);
          return prev;
        }

        if (
          optimisticBidId &&
          newBid.user?._id === user?._id &&
          newBid.amount === Number(bidAmount) &&
          newBid.auction === auctionId
        ) {
          // console.log('[BidForm] Ignoring own bid from socket:', newBid._id);
          setOptimisticBidId(null);
          return prev.filter((bid) => bid._id !== optimisticBidId);
        }

        const updatedBids = [...prev, newBid].sort((a, b) => b.amount - a.amount);
        // console.log('[BidForm] Updated bids:', updatedBids);
        return updatedBids;
      });
    };

    socket.on('newBid', handleNewBid);
    socket.on('reconnect', async () => {
      // console.log('[BidForm] Socket reconnected, refetching bids');
      try {
        const res = await axios.get(`${BACKEND_URL}/api/bids/${auctionId}`, {
          signal: abortControllerRef.current.signal,
        });
        setBids((res.data || []).sort((a, b) => b.amount - a.amount));
        // console.log('[BidForm] Bids refetched on reconnect:', res.data);
        setOptimisticBidId(null);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('[BidForm] Error refetching bids:', err.message);
          toast.error('Failed to refresh bids');
        }
      }
    });

    return () => {
      socket.off('newBid', handleNewBid);
      socket.off('reconnect');
    };
  }, [socket, auctionId, user?._id, optimisticBidId, bidAmount]);

  useEffect(() => {
    if (bids.length > 0) {
      const highestBid = Math.max(...bids.map((bid) => bid.amount));
      const newMin = highestBid + 1;
      // console.log('[BidForm] Updating min bid:', newMin);
      setMinBid(newMin);
      if (Number(bidAmount) < newMin) {
        setBidAmount(newMin.toString());
      }
    }
  }, [bids]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (processing || !user || !auctionId) {
      // console.log('[BidForm] Submit blocked:', { processing, user, auctionId });
      toast.error('Cannot place bid at this time');
      return;
    }

    const numericAmount = Number(bidAmount);
    if (numericAmount < minBid) {
      // console.log('[BidForm] Bid too low:', numericAmount, '<', minBid);
      toast.error(`Bid must be at least $${minBid}`);
      return;
    }

    setProcessing(true);
    // console.log('[BidForm] Submitting bid:', numericAmount);

    const tempId = `temp-${Date.now()}`;
    const optimisticBid = {
      _id: tempId,
      amount: numericAmount,
      user: {
        name: user.name || 'You',
        _id: user._id,
        id: user.id || user._id,
      },
      auction: auctionId,
      createdAt: new Date().toISOString(),
    };
    setOptimisticBidId(tempId);
    setBids((prev) => {
      const updatedBids = [...prev, optimisticBid].sort((a, b) => b.amount - a.amount);
      // console.log('[BidForm] Optimistic bids:', updatedBids);
      return updatedBids;
    });

    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/bids/${auctionId}`,
        { amount: numericAmount },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          signal: abortControllerRef.current.signal,
        }
      );
      // console.log('[BidForm] Bid response:', res.data);

      setBids((prev) => {
        const updatedBids = prev
          .filter((bid) => bid._id !== tempId)
          .concat(res.data)
          .sort((a, b) => b.amount - a.amount);
        // console.log('[BidForm] Bids after server response:', updatedBids);
        return updatedBids;
      });
      setOptimisticBidId(null);
      setMinBid(res.data.amount + 1);
      toast.success('Bid placed successfully!');
      onBidPlaced(res.data);
    } catch (err) {
      console.error('[BidForm] Bid error:', err);
      setBids((prev) => prev.filter((bid) => bid._id !== tempId));
      setOptimisticBidId(null);
      if (!axios.isCancel(err)) {
        const errorMessage = err.response?.data?.error || 'Failed to place bid';
        toast.error(errorMessage);
        try {
          const res = await axios.get(`${BACKEND_URL}/api/bids/${auctionId}`, {
            signal: abortControllerRef.current.signal,
          });
          setBids((res.data || []).sort((a, b) => b.amount - a.amount));
          // console.log('[BidForm] Bids refetched after error:', res.data);
        } catch (fetchErr) {
          if (!axios.isCancel(fetchErr)) {
            console.error('[BidForm] Error refetching bids:', fetchErr.message);
          }
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!user || user.role !== 'buyer') {
    return (
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-center text-gray-400">
        <p>
          Please{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
            log in
          </Link>{' '}
          as a buyer to place bids.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-6 rounded-xl shadow-lg text-white"
      >
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Place Your Bid</h3>
        <div className="mb-4">
          <label
            htmlFor="bidAmount"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Bid Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              $
            </span>
            <input
              id="bidAmount"
              type="number"
              min={minBid}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm disabled:opacity-50"
              placeholder="Enter bid amount"
              required
              disabled={processing}
              aria-label="Bid amount"
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">Minimum bid: ${minBid.toLocaleString()}</p>
        </div>
        <button
          type="submit"
          disabled={processing}
          className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition-all duration-300 ${
            processing
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500'
          }`}
          aria-label="Place Bid"
        >
          {processing ? (
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
            'Place Bid'
          )}
        </button>
      </form>
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white">
        <h4 className="text-lg font-semibold text-cyan-400 mb-4">Bidding History</h4>
        {bids.length > 0 ? (
          <ul className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
            {bids.map((bid) => (
              <li
                key={bid._id}
                className={`flex justify-between items-center py-2 px-4 rounded-lg ${
                  bid._id.startsWith('temp')
                    ? 'bg-yellow-800 bg-opacity-50'
                    : 'bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200">
                    {bid.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({new Date(bid.createdAt).toLocaleString()})
                  </span>
                </div>
                <span className="font-semibold text-white">${bid.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm">No bids placed yet</p>
        )}
      </div>
    </div>
  );
};

export default BidForm;