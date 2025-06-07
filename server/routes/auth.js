const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber, gender, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      console.warn('[Auth] Registration failed: User already exists:', email);
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({ name, email, password, phoneNumber, gender, role });
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // console.log('[Auth] User registered:', { email, role });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name,
        email,
        phoneNumber,
        gender,
        role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Auth] Registration error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      console.warn('[Auth] Login failed: Invalid credentials:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // console.log('[Auth] User logged in:', { email, role });

    res.json({
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// CHECK AUTH
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.warn('[Auth] User not found:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }
    // console.log('[Auth] Auth check successful:', { id: user._id, email: user.email });
    res.json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Auth] Auth check error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE PROFILE
router.put('/me', authenticate, async (req, res) => {
  const { name, email, phoneNumber, gender } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      console.warn('[Auth] User not found for update:', req.user.id);
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (gender) user.gender = gender;
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.warn('[Auth] Email already in use:', email);
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();
    // console.log('[Auth] User updated:', { id: user._id, email: user.email });

    res.json({
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('[Auth] Update error:', err.message, err.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;