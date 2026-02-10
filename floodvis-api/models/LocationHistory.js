const mongoose = require("mongoose");

const locationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    name: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

locationHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("LocationHistory", locationHistorySchema);
