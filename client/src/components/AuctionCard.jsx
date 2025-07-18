// src/components/AuctionCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const AuctionCard = ({ auction, isMyAuctions, user }) => {
  const [showBids, setShowBids] = useState(false);

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const isSeller = isMyAuctions && user?.role === 'seller' && auction.seller._id === user._id;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105">
      <div className="p-6">
        {auction.images && auction.images.length > 0 ? (
          <img
            src={auction.images[0]}
            alt={auction.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
        <h3 className="text-lg font-semibold text-white truncate">{auction.title}</h3>
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{auction.description}</p>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-300">
            Current Bid: <span className="text-cyan-400">${auction.currentBid || auction.startPrice}</span>
          </p>
          <p className="text-sm text-gray-300">
            Ends: <span className="text-cyan-400">{formatDate(auction.endTime)}</span>
          </p>
          <p className="text-sm text-gray-300">
            Status: <span className="text-cyan-400">{auction.status}</span>
          </p>
        </div>
        <Link
          to={`/auctions/${auction._id}`}
          className="mt-4 inline-block bg-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-cyan-500 transition-all duration-300"
          aria-label={`View details for ${auction.title}`}
        >
          View Details
        </Link>
        {isSeller && (
          <div className="mt-4">
            <button
              onClick={() => setShowBids(!showBids)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-300"
              aria-label={showBids ? 'Hide bids' : 'Show bids'}
            >
              {showBids ? 'Hide Bids' : 'Show Bids'}
            </button>
            {showBids && (
              <div className="mt-2 bg-gray-900 rounded-lg p-4" aria-live="polite">
                {auction.bids && auction.bids.length > 0 ? (
                  <ul className="space-y-2">
                    {auction.bids.map((bid) => (
                      <li key={bid._id} className="text-sm text-gray-300">
                        <span className="text-cyan-400">${bid.amount}</span> by{' '}
                        <span className="font-medium">{bid.user.name}</span> at{' '}
                        {formatDate(bid.createdAt)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No bids yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

AuctionCard.propTypes = {
  auction: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string),
    startPrice: PropTypes.number.isRequired,
    currentBid: PropTypes.number,
    startTime: PropTypes.string.isRequired,
    endTime: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    seller: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
    bids: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        amount: PropTypes.number.isRequired,
        user: PropTypes.shape({
          name: PropTypes.string.isRequired,
          email: PropTypes.string.isRequired,
        }).isRequired,
        createdAt: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  isMyAuctions: PropTypes.bool,
  user: PropTypes.shape({
    _id: PropTypes.string,
    role: PropTypes.string,
  }),
};

export default AuctionCard;