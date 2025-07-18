// models/Auction.js
const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }],
  startPrice: { type: Number, required: true, min: 0.01 },
  currentBid: { type: Number, default: 0 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bid' }], // Added bids field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Auction', auctionSchema);