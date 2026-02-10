const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
