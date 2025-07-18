const mongoose = require("mongoose");
const { faker } = require("@faker-js/faker");
const dotenv = require("dotenv");

const User = require("./models/User");
const Auction = require("./models/Auction");
const Bid = require("./models/Bid");
const Cart = require("./models/Cart");
const Notification = require("./models/Notification");
const Order = require("./models/Order");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

const clearDB = async () => {
  try {
    await User.deleteMany({});
    await Auction.deleteMany({});
    await Bid.deleteMany({});
    await Cart.deleteMany({});
    await Notification.deleteMany({});
    await Order.deleteMany({});
    console.log("Cleared all collections");
  } catch (err) {
    console.error("Error clearing database:", err);
  }
};

const createUsers = async (count) => {
  const users = [];
  const roles = ["buyer", "seller"];
  for (let i = 0; i < count; i++) {
    const role = roles[i % 2];
    const phoneNumber = `+1${faker.string.numeric(10)}`; // Generates +1 followed by 10 digits
    try {
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: "Password123!",
        phoneNumber,
        gender: faker.helpers.arrayElement(["male", "female", "other"]),
        role,
        isEmailVerified: faker.datatype.boolean(),
      });
      users.push(user);
    } catch (err) {
      console.error(`Error creating user ${i + 1}:`, err.message);
    }
  }
  try {
    await User.insertMany(users, { ordered: false }); // Continue even if some fail
    console.log(`Created ${users.length} users`);
  } catch (err) {
    console.error("Error inserting users:", err.message);
  }
  return users;
};

const createAuctions = async (users, count) => {
  const auctions = [];
  const sellers = users.filter((u) => u.role === "seller");
  for (let i = 0; i < count; i++) {
    const startTime = faker.date.recent({ days: 5 });
    const endTime = faker.date.soon({ days: 5, refDate: startTime });
    try {
      const auction = new Auction({
        title: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        images: [faker.image.url({ width: 300, height: 300 })],
        startPrice: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        reservePrice: parseFloat(faker.commerce.price({ min: 50, max: 600 })),
        currentBid: 0,
        startTime,
        endTime,
        status: endTime < new Date() ? "ended" : "active",
        seller: faker.helpers.arrayElement(sellers)._id,
      });
      auctions.push(auction);
    } catch (err) {
      console.error(`Error creating auction ${i + 1}:`, err.message);
    }
  }
  try {
    await Auction.insertMany(auctions, { ordered: false });
    console.log(`Created ${auctions.length} auctions`);
  } catch (err) {
    console.error("Error inserting auctions:", err.message);
  }
  return auctions;
};

const createBids = async (users, auctions, count) => {
  const bids = [];
  const buyers = users.filter((u) => u.role === "buyer");
  const activeAuctions = auctions.filter((a) => a.status === "active");
  for (let i = 0; i < count; i++) {
    const auction = faker.helpers.arrayElement(activeAuctions);
    const currentBid = auction.currentBid || auction.startPrice;
    try {
      const bid = new Bid({
        amount: currentBid + parseFloat(faker.commerce.price({ min: 10, max: 100 })),
        user: faker.helpers.arrayElement(buyers)._id,
        auction: auction._id,
        createdAt: faker.date.between({ from: auction.startTime, to: new Date() }),
      });
      bids.push(bid);
      auction.currentBid = bid.amount;
    } catch (err) {
      console.error(`Error creating bid ${i + 1}:`, err.message);
    }
  }
  try {
    await Bid.insertMany(bids, { ordered: false });
    await Auction.bulkWrite(
      auctions.map((auction) => ({
        updateOne: {
          filter: { _id: auction._id },
          update: { currentBid: auction.currentBid },
        },
      }))
    );
    console.log(`Created ${bids.length} bids`);
  } catch (err) {
    console.error("Error inserting bids:", err.message);
  }
  return bids;
};

const createCartItems = async (users, auctions, count) => {
  const cartItems = [];
  const buyers = users.filter((u) => u.role === "buyer");
  const activeAuctions = auctions.filter((a) => a.status === "active");
  for (let i = 0; i < count; i++) {
    const auction = faker.helpers.arrayElement(activeAuctions);
    try {
      const cartItem = new Cart({
        user: faker.helpers.arrayElement(buyers)._id,
        auction: auction._id,
        amount: auction.currentBid || auction.startPrice,
      });
      cartItems.push(cartItem);
    } catch (err) {
      console.error(`Error creating cart item ${i + 1}:`, err.message);
    }
  }
  try {
    await Cart.insertMany(cartItems, { ordered: false });
    console.log(`Created ${cartItems.length} cart items`);
  } catch (err) {
    console.error("Error inserting cart items:", err.message);
  }
  return cartItems;
};

const createNotifications = async (users, auctions, count) => {
  const notifications = [];
  const notificationTypes = ["bid", "win", "outbid", "info"];
  for (let i = 0; i < count; i++) {
    const auction = faker.helpers.arrayElement(auctions);
    try {
      const notification = new Notification({
        user: faker.helpers.arrayElement(users)._id,
        message: faker.helpers.arrayElement([
          `Your bid was placed on "${auction.title}"`,
          `You won the auction for "${auction.title}"!`,
          `You were outbid on "${auction.title}"`,
          `New auction "${auction.title}" is live!`,
        ]),
        auction: auction._id,
        type: faker.helpers.arrayElement(notificationTypes),
        read: faker.datatype.boolean(),
        createdAt: faker.date.recent({ days: 10 }),
      });
      notifications.push(notification);
    } catch (err) {
      console.error(`Error creating notification ${i + 1}:`, err.message);
    }
  }
  try {
    await Notification.insertMany(notifications, { ordered: false });
    console.log(`Created ${notifications.length} notifications`);
  } catch (err) {
    console.error("Error inserting notifications:", err.message);
  }
  return notifications;
};

const createOrders = async (users, auctions, count) => {
  const orders = [];
  const endedAuctions = auctions.filter((a) => a.status === "ended");
  const buyers = users.filter((u) => u.role === "buyer");
  for (let i = 0; i < count; i++) {
    const auction = faker.helpers.arrayElement(endedAuctions);
    try {
      const order = new Order({
        user: faker.helpers.arrayElement(buyers)._id,
        auction: auction._id,
        amount: auction.currentBid || auction.startPrice,
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zip: faker.location.zipCode("#####"),
          country: faker.location.country(),
        },
        paymentStatus: faker.helpers.arrayElement(["pending", "completed", "failed"]),
        orderStatus: faker.helpers.arrayElement(["placed", "shipped", "delivered", "cancelled"]),
        paymentId: faker.string.uuid(),
      });
      orders.push(order);
    } catch (err) {
      console.error(`Error creating order ${i + 1}:`, err.message);
    }
  }
  try {
    await Order.insertMany(orders, { ordered: false });
    console.log(`Created ${orders.length} orders`);
  } catch (err) {
    console.error("Error inserting orders:", err.message);
  }
  return orders;
};

const seedDatabase = async () => {
  await connectDB();
  // await clearDB();

  const users = await createUsers(100);
  const auctions = await createAuctions(users, 200);
  await createBids(users, auctions, 500);
  await createCartItems(users, auctions, 10);
  await createNotifications(users, auctions, 300);
  await createOrders(users, auctions, 100);

  console.log("Database seeding completed!");
  mongoose.connection.close();
};

seedDatabase().catch((err) => {
  console.error("Seeding error:", err);
  mongoose.connection.close();
});