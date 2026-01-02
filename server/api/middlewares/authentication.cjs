const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError.cjs");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next(new AppError("Access Denied", 403));

    const token = authHeader.split(" ")[1];
    if (!token) return next(new AppError("Access Denied", 403));

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role }; // minimal payload

    next();
  } catch (err) {
    // Pass error to global handler
    next(new AppError("Invalid or expired token", 401));
  }
};
