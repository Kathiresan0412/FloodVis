const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relation: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    /** One contact can be in multiple lists: family, emergency, guardian */
    types: {
      type: [{ type: String, enum: ["family", "emergency", "guardian"] }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ userId: 1, types: 1 });

module.exports = mongoose.model("Contact", contactSchema);
