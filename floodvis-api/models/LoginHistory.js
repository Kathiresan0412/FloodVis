const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    success: {
      type: Boolean,
      required: true,
      default: true,
    },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

// compound index for listing by user, newest first
loginHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
