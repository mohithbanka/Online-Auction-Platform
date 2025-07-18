// routes/auctions.js
const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const authMiddleware = require('../middleware/auth');

// GET /api/auctions/my - Fetch authenticated seller's auctions with bids
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const category = req.query.category || 'live';

    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can view their auctions' });
    }

    let query = { seller: req.user.id };
    const now = new Date();
    if (category === 'live') {
      query = {
        ...query,
        status: 'active',
        startTime: { $lte: now },
        endTime: { $gte: now },
      };
    } else if (category === 'upcoming') {
      query = {
        ...query,
        status: 'active',
        startTime: { $gt: now },
      };
    } else if (category === 'past') {
      query = { ...query, status: 'ended' };
    }

    const auctions = await Auction.find(query)
      .populate('seller', 'name email')
      .populate({
        path: 'bids',
        select: 'amount user createdAt',
        populate: { path: 'user', select: 'name email' },
      })
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Auction.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({ auctions, page, pages, total });
  } catch (err) {
    console.error('Error fetching my auctions:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to fetch auctions' });
  }
});

// GET /api/auctions/:id/bids - Fetch bids for a specific auction (seller only)
router.get('/:id/bids', authMiddleware, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    const auction = await Auction.findById(req.params.id)
      .select('seller bids')
      .populate({
        path: 'bids',
        select: 'amount user createdAt',
        populate: { path: 'user', select: 'name email' },
      })
      .lean();

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auction.seller._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the auction seller can view bids' });
    }

    res.json(auction.bids || []);
  } catch (err) {
    console.error('Error fetching auction bids:', err.message, err.stack);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }
    res.status(500).json({ error: 'Server error: Unable to fetch bids' });
  }
});

// GET /api/auctions - Fetch all auctions
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const category = req.query.category || 'all';

    let query = {};
    const now = new Date();
    if (category === 'live') {
      query = {
        status: 'active',
        startTime: { $lte: now },
        endTime: { $gte: now },
      };
    } else if (category === 'upcoming') {
      query = {
        status: 'active',
        startTime: { $gt: now },
      };
    } else if (category === 'past') {
      query = { status: 'ended' };
    }

    const auctions = await Auction.find(query)
      .populate('seller', 'name email')
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Auction.countDocuments(query);
    const pages = Math.ceil(total / limit);

    res.json({ auctions, page, pages, total });
  } catch (err) {
    console.error('Error fetching auctions:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to fetch auctions' });
  }
});

// GET /api/auctions/:id - Fetch a single auction by ID
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    const auction = await Auction.findById(req.params.id)
      .populate('seller', 'name email')
      .populate({
        path: 'bids',
        select: 'amount user createdAt',
        populate: { path: 'user', select: 'name email' },
      })
      .lean();

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    auction.bids = auction.bids || [];
    res.json(auction);
  } catch (err) {
    console.error('Error fetching auction:', err.message, err.stack);
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }
    res.status(500).json({ error: 'Server error: Unable to fetch auction' });
  }
});

// POST /api/auctions - Create a new auction
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, images, startPrice, startTime, endTime } = req.body;

  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }
    if (!startPrice || startPrice <= 0 || isNaN(startPrice)) {
      return res.status(400).json({ error: 'Start price must be a positive number' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start and end times are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    if (end <= now) {
      return res.status(400).json({ error: 'End time must be in the future' });
    }
    if (images && images.length > 0) {
      const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)$/i;
      const invalidImage = images.some((url) => !urlRegex.test(url));
      if (invalidImage) {
        return res.status(400).json({ error: 'All image URLs must be valid' });
      }
    }
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers can create auctions' });
    }

    const auction = new Auction({
      title,
      description,
      images: images || [],
      startPrice,
      startTime,
      endTime,
      seller: req.user.id,
      status: 'active',
      currentBid: 0,
      bids: [],
    });

    await auction.save();
    await auction.populate('seller', 'name email');
    const io = req.app.get('io');
    io.emit('newAuction', auction);
    res.status(201).json(auction);
  } catch (err) {
    console.error('Error creating auction:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to create auction' });
  }
});

// routes/auctions.js
// const express = require('express');
// const router = express.Router();
// const Auction = require('../models/Auction');
// const Bid = require('../models/Bid');
// const authMiddleware = require('../middleware/auth');

// ... Existing routes (GET /my, GET /, GET /:id, POST /) remain unchanged ...

// POST /api/auctions/:id/bids - Place a bid on an auction
router.post('/:id/bids', authMiddleware, async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid auction ID' });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid bid amount is required' });
    }

    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    if (auction.status !== 'active') {
      return res.status(400).json({ error: 'Auction is not active' });
    }

    const now = new Date();
    if (now < new Date(auction.startTime) || now > new Date(auction.endTime)) {
      return res.status(400).json({ error: 'Auction is not currently active' });
    }

    if (amount <= auction.currentBid || amount <= auction.startPrice) {
      return res.status(400).json({ error: 'Bid must be higher than current bid or start price' });
    }

    const bid = new Bid({
      amount,
      user: req.user.id,
      auction: auction._id,
    });

    await bid.save();

    auction.bids.push(bid._id);
    auction.currentBid = amount;
    if (auction.winner) {
      auction.winner = req.user.id;
    }
    await auction.save();

    await bid.populate('user', 'name email');
    await auction.populate('seller', 'name email');
    await auction.populate({
      path: 'bids',
      select: 'amount user createdAt',
      populate: { path: 'user', select: 'name email' },
    });

    const io = req.app.get('io');
    io.emit('newBid', {
      auctionId: auction._id,
      bid: {
        _id: bid._id,
        amount: bid.amount,
        user: { name: bid.user.name, email: bid.user.email },
        createdAt: bid.createdAt,
      },
    });

    res.status(201).json(bid);
  } catch (err) {
    console.error('Error placing bid:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to place bid' });
  }
});

// module.exports = router;

module.exports = router;