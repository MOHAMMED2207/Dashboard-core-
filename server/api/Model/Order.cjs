const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const OrderSchema = new Schema(
  {
    userId: String,
    amount: Number,
    platform: { type: String, enum: ["mobile", "desktop"] },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);


module.exports = mongoose.model("Order", OrderSchema);