const jwt = require("jsonwebtoken");
const User = require("../models/User");
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console(),
  ],
});

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    logger.warn("No token provided in request");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("role").lean();
    if (!user) {
      logger.warn(`User not found for token: ${decoded.id}`);
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (err) {
    logger.error("Auth middleware error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

module.exports = { authMiddleware, restrictTo };