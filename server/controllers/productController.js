const Product = require("../models/Product");

// Create a new product (Auction Item)
exports.createProduct = async (req, res) => {
  const { title, description, startingPrice, category, endTime, image } =
    req.body;

  const product = new Product({
    sellerId:req.user._id,
    title,
    description,
    startingPrice,
    category,
    endTime,
    image,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
};

// Get all products
exports.getAllProducts = async (req, res) => {
  const products = await Product.find().populate("seller", "name email");
  res.json(products);
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "seller",
    "name email"
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};

// Update product (by seller)
exports.updateProduct = async (req, res) => {
  const { title, description, startingPrice, category, endTime, image } =
    req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if the logged-in user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.startingPrice = startingPrice || product.startingPrice;
    product.category = category || product.category;
    product.endTime = endTime || product.endTime;
    product.image = image || product.image;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Only seller can delete
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await product.remove();
    res.json({ message: "Product removed" });
  } else {
    res.status(404).json({ message: "Product not found" });
  }
};
