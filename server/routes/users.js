// routes/users.js (Create if not exists)
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users/me/wallet - Get user's wallet balance
router.get('/me/wallet', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('walletBalance');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ walletBalance: user.walletBalance });
  } catch (err) {
    console.error('Error fetching wallet:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to fetch wallet balance' });
  }
});

// POST /api/users/me/wallet/add - Add funds to wallet
router.post('/me/wallet/add', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (req.user.role !== 'buyer') {
      return res.status(403).json({ error: 'Only buyers can add funds to wallet' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.walletBalance += amount;
    await user.save();

    const io = req.app.get('io');
    io.to(user._id.toString()).emit('walletUpdate', {
      userId: user._id,
      walletBalance: user.walletBalance,
    });

    res.json({ walletBalance: user.walletBalance });
  } catch (err) {
    console.error('Error adding funds:', err.message, err.stack);
    res.status(500).json({ error: 'Server error: Unable to add funds' });
  }
});

module.exports = router;