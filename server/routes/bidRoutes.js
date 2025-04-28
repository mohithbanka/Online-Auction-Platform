const express = require('express');
const { placeBid, getBidsForProduct } = require('../controllers/bidController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, placeBid);

router.route('/product/:id')
  .get(getBidsForProduct);

module.exports = router;
