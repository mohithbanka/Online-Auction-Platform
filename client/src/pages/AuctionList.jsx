import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuctionCard from '../components/AuctionCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const categorizeAuctions = (auctions) => {
  const now = new Date();
  const live = [];
  const upcoming = [];
  const past = [];

  auctions.forEach((auction) => {
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    if (start <= now && end >= now) live.push(auction);
    else if (start > now) upcoming.push(auction);
    else past.push(auction);
  });

  return { live, upcoming, past };
};

const AuctionList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortOption, setSortOption] = useState('startTime-desc');

  useEffect(() => {
    const fetchAuctions = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auctions`, {
          headers: user ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {},
        });
        setAuctions(res.data);
      } catch (err) {
        setError('Failed to load auctions. Please try again.');
        console.error('[AuctionList] Fetch error:', err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAuctions();
  }, [user]);

  // Client-side filter and sort
  const filteredAuctions = auctions
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

  const { live, upcoming, past } = categorizeAuctions(filteredAuctions);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="py-8 animate-slide-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 mb-4">
            Explore Auctions
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl">
            Discover rare artifacts, luxury collectibles, and exclusive digital assets.
          </p>
        </div>

        {/* Search, Sort, and Create */}
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
          {user?.role === 'seller' && (
            <button
              onClick={() => navigate('/create-auction')}
              className="w-full sm:w-auto bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
              aria-label="Create Auction"
            >
              Create Auction
            </button>
          )}
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center text-gray-400 py-8">
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-2">Loading auctions...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded-lg text-sm text-center mb-8">
            {error}
          </div>
        )}

        {/* Auction Sections */}
        {!isLoading && !error && filteredAuctions.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p>No auctions match your search.</p>
          </div>
        )}
        {[
          { label: '🟢 Live Auctions', data: live, color: 'text-green-400' },
          { label: '🟡 Upcoming Auctions', data: upcoming, color: 'text-blue-400' },
          { label: '🔴 Past Auctions', data: past, color: 'text-red-400' },
        ].map(
          (section) =>
            section.data.length > 0 && (
              <div key={section.label} className="mb-10">
                <h2 className={`text-xl font-semibold mb-4 ${section.color}`}>
                  {section.label}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.data.map((auction) => (
                    <AuctionCard key={auction._id} auction={auction} />
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
};

export default AuctionList;