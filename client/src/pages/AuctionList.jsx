// src/components/AuctionList.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../components/AuctionCard';
import { toast } from 'react-toastify';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const categorizeAuctions = (auctions) => {
  const now = new Date();
  const live = [];
  const upcoming = [];
  const past = [];

  auctions.forEach((auction) => {
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    if (start <= now && end >= now && auction.status === 'active') {
      live.push(auction);
    } else if (start > now && auction.status === 'active') {
      upcoming.push(auction);
    } else {
      past.push(auction);
    }
  });

  return { live, upcoming, past };
};

const AuctionList = ({ isMyAuctions = false }) => {
  const { user } = useAuth();
  const { socket, connectionStatus, on, off } = useSocket();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState('startTime-desc');
  const [currentTab, setCurrentTab] = useState('live');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const auctionsPerPage = 12;

  const fetchAuctions = useCallback(
    async (pageNum = 1, append = false, category = 'live') => {
      setIsLoading(true);
      setError('');
      try {
        const endpoint = isMyAuctions
          ? `${BACKEND_URL}/api/auctions/my`
          : `${BACKEND_URL}/api/auctions`;
        const res = await axios.get(endpoint, {
          headers: user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
          params: { page: pageNum, limit: auctionsPerPage, category },
        });
        const newAuctions = res.data.auctions || [];
        setAuctions((prev) => (append ? [...prev, ...newAuctions] : newAuctions));
        setTotalPages(res.data.pages || 1);
        console.log('[AuctionList] Fetched auctions:', {
          count: newAuctions.length,
          page: pageNum,
          category,
          totalPages: res.data.pages,
          endpoint,
        });
      } catch (err) {
        let message = err.response?.data?.error || 'Failed to load auctions. Please try again.';
        if (err.response?.status === 401 || err.response?.status === 403) {
          message = 'Please log in as a seller to view your auctions.';
          navigate('/login');
        }
        setError(message);
        toast.error(message, { position: 'top-right', autoClose: 3000, theme: 'dark' });
        console.error('[AuctionList] Fetch error:', err.message, err.stack);
      } finally {
        setIsLoading(false);
      }
    },
    [user, isMyAuctions, navigate]
  );

  useEffect(() => {
    fetchAuctions(1, false, currentTab);
  }, [fetchAuctions, currentTab]);

  useEffect(() => {
    if (!socket || connectionStatus !== 'connected') return;

    const handleAuctionUpdate = (updatedAuction) => {
      setAuctions((prevAuctions) =>
        prevAuctions.map((auction) =>
          auction._id === updatedAuction._id ? { ...auction, ...updatedAuction } : auction
        )
      );
      toast.info(`Auction "${updatedAuction.title}" updated`, {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    };

    const handleAuctionEnded = ({ auctionId }) => {
      setAuctions((prevAuctions) => {
        const updatedAuctions = prevAuctions.map((auction) =>
          auction._id === auctionId ? { ...auction, status: 'ended' } : auction
        );
        return currentTab === 'past'
          ? updatedAuctions
          : updatedAuctions.filter((a) => a._id !== auctionId);
      });
      toast.info(`Auction ended`, {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    };

    const handleNewAuction = (newAuction) => {
      if (isMyAuctions && newAuction.seller._id !== user?._id) return;
      if (currentTab === 'live' || currentTab === 'upcoming') {
        const now = new Date();
        const start = new Date(newAuction.startTime);
        const end = new Date(newAuction.endTime);
        if (
          (currentTab === 'live' && start <= now && end >= now && newAuction.status === 'active') ||
          (currentTab === 'upcoming' && start > now && newAuction.status === 'active')
        ) {
          setAuctions((prevAuctions) => [newAuction, ...prevAuctions]);
          toast.info(`New auction "${newAuction.title}" added`, {
            position: 'top-right',
            autoClose: 2000,
            theme: 'dark',
          });
        }
      }
    };

    const handleNewBid = ({ auctionId, bid }) => {
      if (!isMyAuctions || user?.role !== 'seller') return;
      setAuctions((prevAuctions) =>
        prevAuctions.map((auction) =>
          auction._id === auctionId
            ? {
                ...auction,
                bids: [...(auction.bids || []), bid],
                currentBid: bid.amount,
              }
            : auction
        )
      );
      toast.info(`New bid of $${bid.amount} on "${prevAuctions.find(a => a._id === auctionId)?.title}"`, {
        position: 'top-right',
        autoClose: 2000,
        theme: 'dark',
      });
    };

    on('auctionUpdate', handleAuctionUpdate);
    on('auctionEnded', handleAuctionEnded);
    on('newAuction', handleNewAuction);
    on('newBid', handleNewBid);

    return () => {
      off('auctionUpdate', handleAuctionUpdate);
      off('auctionEnded', handleAuctionEnded);
      off('newAuction', handleNewAuction);
      off('newBid', handleNewBid);
    };
  }, [socket, connectionStatus, on, off, currentTab, isMyAuctions, user]);

  const filteredAuctions = useMemo(() => {
    return auctions
      .filter((a) => a.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const [field, order] = sortOption.split('-');
        const multiplier = order === 'asc' ? 1 : -1;
        if (field === 'startTime') {
          return multiplier * (new Date(a.startTime) - new Date(b.startTime));
        }
        if (field === 'currentBid') {
          return multiplier * ((a.currentBid || 0) - (b.currentBid || 0));
        }
        return 0;
      });
  }, [auctions, searchTerm, sortOption]);

  const { live, upcoming, past } = useMemo(() => categorizeAuctions(filteredAuctions), [filteredAuctions]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAuctions(nextPage, true, currentTab);
  };

  const currentAuctions = currentTab === 'live' ? live : currentTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 animate-slide-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4">
            {isMyAuctions ? 'My Auctions' : 'Explore Auctions'}
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            {isMyAuctions
              ? 'Manage your created auctions and view bids'
              : 'Discover rare artifacts, luxury collectibles, and exclusive digital assets.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search auctions by title..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search auctions"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            aria-label="Sort auctions"
          >
            <option value="startTime-desc">Newest First</option>
            <option value="startTime-asc">Oldest First</option>
            <option value="currentBid-desc">Highest Bid</option>
            <option value="currentBid-asc">Lowest Bid</option>
          </select>
          {user?.role === 'seller' && !isMyAuctions && (
            <button
              onClick={() => navigate('/create-auction')}
              className="w-full sm:w-auto bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
              aria-label="Create Auction"
            >
              Create Auction
            </button>
          )}
        </div>

        <div className="flex border-b border-gray-700 mb-6" role="tablist">
          {[
            { id: 'live', label: `🟢 Live (${live.length})` },
            { id: 'upcoming', label: `🟡 Upcoming (${upcoming.length})` },
            { id: 'past', label: `🔴 Past (${past.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                setPage(1);
                setAuctions([]);
              }}
              className={`px-4 py-2 text-sm font-medium ${
                currentTab === tab.id
                  ? 'border-b-2 border-cyan-500 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
              }`}
              role="tab"
              aria-selected={currentTab === tab.id}
              aria-label={`View ${tab.id} auctions`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
            {Array(auctionsPerPage)
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
          <div className="bg-red-600 text-white p-3 rounded-lg text-sm text-center mb-8" role="alert">
            {error}
            <button
              onClick={() => fetchAuctions(1, false, currentTab)}
              className="ml-4 text-cyan-400 hover:underline"
              aria-label="Retry loading auctions"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && currentAuctions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>No {currentTab} auctions found.</p>
            <Link
              to={isMyAuctions ? '/auctions' : '/auctions'}
              className="text-cyan-500 hover:underline"
              aria-label={isMyAuctions ? 'Browse all auctions' : 'View all auctions'}
            >
              {isMyAuctions ? 'Browse all auctions' : 'View all auctions'}
            </Link>
          </div>
        )}
        {!isLoading && !error && currentAuctions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
            {currentAuctions.map((auction) => (
              <AuctionCard key={auction._id} auction={auction} isMyAuctions={isMyAuctions} user={user} />
            ))}
          </div>
        )}

        {!isLoading && page < totalPages && currentAuctions.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
              aria-label="Load more auctions"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionList;