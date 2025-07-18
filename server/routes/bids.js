const express = require('express');
const router = express.Router();
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const authMiddleware = require('../middleware/auth');

router.post('/:auctionId', authMiddleware, async (req, res) => {
  const { amount } = req.body;
  const io = req.app.get('io');

  try {
    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid bid amount' });
    }

    const auction = await Auction.findById(req.params.auctionId);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    const now = new Date();
    if (now < new Date(auction.startTime)) {
      return res.status(400).json({ error: 'Auction has not started' });
    }

    if (now > new Date(auction.endTime) || auction.status !== 'active') {
      return res.status(400).json({ error: 'Auction has ended or is inactive' });
    }

    const minValidBid = Math.max(auction.currentBid || 0, auction.startPrice) + 1;
    if (amount < minValidBid) {
      return res.status(400).json({ error: `Bid must be at least $${minValidBid.toFixed(2)}` });
    }

    // Find previous highest bid to notify outbid users
    const previousBids = await Bid.find({ auction: req.params.auctionId })
      .sort({ amount: -1 })
      .limit(1);

    // Create new bid
    const bid = new Bid({
      amount,
      user: req.user.id,
      auction: req.params.auctionId,
      status: 'leading',
    });
    await bid.save();

    // Update auction
    auction.currentBid = amount;
    await auction.save();

    // Populate bid data
    await bid.populate('user', 'name email');
    await bid.populate('auction', 'title');

    const bidToEmit = {
      _id: bid._id,
      amount: bid.amount,
      user: bid.user,
      auction: { _id: bid.auction._id, title: bid.auction.title },
      status: bid.status,
      createdAt: bid.createdAt,
    };

    // Notify previous bidders of outbid status
    if (previousBids.length > 0 && previousBids[0].user.toString() !== req.user.id) {
      const outbid = previousBids[0];
      outbid.status = 'outbid';
      await outbid.save();
      await outbid.populate('user', 'name email');
      await outbid.populate('auction', 'title');
      const outbidToEmit = {
        _id: outbid._id,
        amount: outbid.amount,
        user: outbid.user,
        auction: { _id: outbid.auction._id, title: outbid.auction.title },
        status: outbid.status,
        createdAt: outbid.createdAt,
      };
      io.to(outbid.user._id.toString()).emit('bidUpdate', outbidToEmit);
    }

    // Emit new bid to auction room
    io.to(bid.auction._id.toString()).emit('newBid', bidToEmit);

    res.status(201).json(bidToEmit);
  } catch (err) {
    console.error('Error creating bid:', err.message);
    res.status(500).json({ error: 'Server error: Unable to process bid' });
  }
});

router.get('/my-bids', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const bids = await Bid.find({ user: req.user.id })
      .populate('user', 'name email')
      .populate('auction', 'title status startTime endTime currentBid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Bid.countDocuments({ user: req.user.id });
    const pages = Math.ceil(total / limit);

    // Compute bid status
    const enrichedBids = bids.map((bid) => {
      const auction = bid.auction;
      let status = 'pending';
      if (auction.status === 'ended') {
        status = bid.amount >= (auction.currentBid || auction.startPrice) ? 'won' : 'outbid';
      } else if (bid.amount >= (auction.currentBid || auction.startPrice)) {
        status = 'leading';
      } else {
        status = 'outbid';
      }
      return { ...bid.toObject(), status, auction: bid.auction };
    });

    res.json({ bids: enrichedBids, page, pages, total });
  } catch (err) {
    console.error('Error fetching my bids:', err.message);
    res.status(500).json({ error: 'Server error: Unable to fetch bids' });
  }
});

router.get('/:auctionId', async (req, res) => {
  try {
    const bids = await Bid.find({ auction: req.params.auctionId })
      .populate('user', 'name email')
      .populate('auction', 'title')
      .sort({ createdAt: -1 });
    res.json(bids);
  } catch (err) {
    console.error('Error fetching bids:', err.message);
    res.status(500).json({ error: 'Server error: Unable to fetch bids' });
  }
});

module.exports = router;