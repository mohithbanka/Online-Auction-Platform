const Order = require('../models/Order');
const Product = require('../models/Product');
const Bid = require('../models/Bid');

// Create an order after auction ends
exports.createOrder = async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (new Date() < product.endTime) {
    return res.status(400).json({ message: 'Auction still ongoing' });
  }

  const highestBid = await Bid.findOne({ product: productId }).sort({ bidAmount: -1 });

  if (!highestBid) {
    return res.status(400).json({ message: 'No bids placed for this product' });
  }

  const order = new Order({
    buyer: highestBid.bidder,
    seller: product.seller,
    product: productId,
    price: highestBid.bidAmount,
    status: 'Pending',
  });

  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('buyer', 'name email')
    .populate('seller', 'name email')
    .populate('product', 'title');

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};
