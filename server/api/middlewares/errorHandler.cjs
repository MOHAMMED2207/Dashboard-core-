// middlewares/errorHandler.cjs
module.exports = (err, req, res, next) => {
  console.error("Error:", err);
  
  // ✅ تأكد من إرسال JSON وليس HTML
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    errors: err.errors || {},
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};