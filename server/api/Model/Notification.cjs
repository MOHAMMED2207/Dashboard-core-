const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },

    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);
