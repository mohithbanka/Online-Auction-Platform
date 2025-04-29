const Product = require("../models/Product");

// Create a new product (Auction Item)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, startingPrice, category, endTime, image } =
      req.body;

    const product = new Product({
      sellerId: req.user._id,
      title,
      description,
      startingPrice,
      category,
      endTime,
      image,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("sellerId", "name email");
    res.json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching products", error: error.message });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "sellerId",
      "name email"
    );

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching product", error: error.message });
  }
};

// Update product (by seller)
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, startingPrice, category, endTime, image } =
      req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (
      !product.sellerId ||
      product.sellerId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this product" });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.startingPrice = startingPrice || product.startingPrice;
    product.category = category || product.category;
    product.endTime = endTime || product.endTime;
    product.image = image || product.image;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating product", error: error.message });
  }
};

// Delete product (by seller)
// Delete product (by seller)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (
      !product.sellerId ||
      product.sellerId.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne(); // ✅ Updated

    res.json({ message: "Product removed successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};
