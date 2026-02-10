const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;
const authRoutes = require("./routes/auth");
const guardianRoutes = require("./routes/guardians");
const contactRoutes = require("./routes/contacts");
const meRoutes = require("./routes/me");

app.use(cors());
app.use(express.json());

// Simple health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "FloodVis API running" });
});

// Auth routes
app.use("/auth", authRoutes);

// Guardians routes (protected)
app.use("/guardians", guardianRoutes);

// Contacts routes — family, emergency, guardian (protected)
app.use("/contacts", contactRoutes);

// Current user: login history & activity log (protected)
app.use("/me", meRoutes);

// Connect to MongoDB and start server
async function start() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error("Missing MONGODB_URI in .env file");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
}

start();

