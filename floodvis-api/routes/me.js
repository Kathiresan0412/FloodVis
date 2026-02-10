const express = require("express");
const LoginHistory = require("../models/LoginHistory");
const ActivityLog = require("../models/ActivityLog");
const auth = require("../middleware/auth");
const { getWeather } = require("../lib/weather");

const router = express.Router();
router.use(auth);

const DEFAULT_LIMIT = 50;

// GET /me/login-history
router.get("/login-history", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 100);
    const entries = await LoginHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(
      entries.map((e) => ({
        id: e._id,
        success: e.success,
        ip: e.ip,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    console.error("Get login history error:", err);
    res.status(500).json({ error: "Failed to load login history" });
  }
});

// GET /me/activity-log
router.get("/activity-log", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_LIMIT, 100);
    const entries = await ActivityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(
      entries.map((e) => ({
        id: e._id,
        action: e.action,
        details: e.details,
        ip: e.ip,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      }))
    );
  } catch (err) {
    console.error("Get activity log error:", err);
    res.status(500).json({ error: "Failed to load activity log" });
  }
});

// GET /me/weather?lat=6.92&lon=79.96
router.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const weather = await getWeather(lat, lon);
    res.json(weather);
  } catch (err) {
    console.error("Get weather error:", err);
    if (err.message?.includes("required")) {
      return res.status(400).json({ error: "Query params lat and lon are required" });
    }
    res.status(500).json({ error: "Failed to load weather" });
  }
});

module.exports = router;
