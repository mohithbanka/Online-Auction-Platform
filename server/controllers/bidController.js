const Bid = require("../models/Bid");
const Product = require("../models/Product");

// Place a new bid

exports.placeBid = async (req, res) => {
  try {
    const { productId, bidAmount } = req.body;

    if (!productId || !bidAmount) {
      return res
        .status(400)
        .json({ message: "Product ID and amount are required" });
    }

    const bid = new Bid({
      bidderId: req.user._id, // ✅ Authenticated user ID
      productId,
      bidAmount,
      time: new Date(), // Optional: can be auto-set in schema too
    });

    const createdBid = await bid.save();
    res.status(201).json(createdBid);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to place bid", error: error.message });
  }
};

// Get all bids for a product
exports.getBidsForProduct = async (req, res) => {
  const bids = await Bid.find({ productId: req.params.id }).sort({
    bidAmount: -1,
  });
  res.json(bids);
};
