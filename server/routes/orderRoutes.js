const express = require("express");
const { createOrder, getOrderById } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, createOrder);

router.route("/:id").get(protect, getOrderById);

module.exports = router;
