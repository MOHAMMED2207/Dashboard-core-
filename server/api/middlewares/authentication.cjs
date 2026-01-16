const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError.cjs");

module.exports = (req, res, next) => {
  try {
    // 1️⃣ حاول تاخد التوكن من Authorization header
    let token = req.headers.authorization?.split(" ")[1];

    // 2️⃣ لو مفيش في الهيدر، جرب من الكوكيز
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return next(new AppError("Access Denied", 403));

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
    next(new AppError("Invalid or expired token", 401));
  }
};
