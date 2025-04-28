const Bid = require('../models/Bid');
const Product = require('../models/Product');

// Place a new bid
exports.placeBid = async (req, res) => {
  const { productId, bidAmount } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (new Date() > product.endTime) {
    return res.status(400).json({ message: 'Auction already ended' });
  }

  const bid = new Bid({
    product: productId,
    bidder: req.user._id,
    bidAmount,
  });

  const createdBid = await bid.save();
  res.status(201).json(createdBid);
};

// Get all bids for a product
exports.getBidsForProduct = async (req, res) => {
  const bids = await Bid.find({ product: req.params.id }).populate('bidder', 'name email').sort({ bidAmount: -1 });

  res.json(bids);
};
