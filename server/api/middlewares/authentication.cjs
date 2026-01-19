// في ملف middlewares/authentication.cjs
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError.cjs");

module.exports = (req, res, next) => {
  try {
    let token = req.headers.authorization?.split(" ")[1];

    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
    next();
  }
};