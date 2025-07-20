// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Support pagination
    const notifications = await Notification.find({ user: req.user.id })
      .populate('auction', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.user.toString() !== req.user.id) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    if (notification.read) {
      return res.json(notification); // Already read, no update needed
    }
    notification.read = true;
    await notification.save();
    // Emit socket event
    const io = req.app.get('io');
    io.to(req.user.id.toString()).emit('notificationRead', {
      _id: notification._id,
      read: true,
    });
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
      read: false,
    });
    if (notifications.length === 0) {
      return res.json({ message: 'No unread notifications' });
    }
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    // Emit socket events for each updated notification
    const io = req.app.get('io');
    notifications.forEach((notification) => {
      io.to(req.user.id.toString()).emit('notificationRead', {
        _id: notification._id,
        read: true,
      });
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/clear-read', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id,
      read: true,
    });
    if (notifications.length === 0) {
      return res.json({ message: 'No read notifications to clear' });
    }
    await Notification.deleteMany({ user: req.user.id, read: true });
    res.json({ message: 'Read notifications cleared' });
  } catch (err) {
    console.error('Error clearing read notifications:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;