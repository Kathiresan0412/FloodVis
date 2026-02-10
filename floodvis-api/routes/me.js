const express = require("express");
const LoginHistory = require("../models/LoginHistory");
const ActivityLog = require("../models/ActivityLog");
const LocationHistory = require("../models/LocationHistory");
const auth = require("../middleware/auth");
const { getWeather } = require("../lib/weather");

const router = express.Router();
router.use(auth);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// GET /me/login-history?page=1&pageSize=10
router.get("/login-history", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * pageSize;

    const [total, entries] = await Promise.all([
      LoginHistory.countDocuments({ userId: req.user.id }),
      LoginHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      items: entries.map((e) => ({
        id: String(e._id),
        success: e.success,
        ip: e.ip,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      })),
      page,
      pageSize,
      total,
      hasMore: skip + entries.length < total,
    });
  } catch (err) {
    console.error("Get login history error:", err);
    res.status(500).json({ error: "Failed to load login history" });
  }
});

// GET /me/activity-log?page=1&pageSize=10
router.get("/activity-log", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * pageSize;

    const [total, entries] = await Promise.all([
      ActivityLog.countDocuments({ userId: req.user.id }),
      ActivityLog.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      items: entries.map((e) => ({
        id: String(e._id),
        action: e.action,
        details: e.details,
        ip: e.ip,
        userAgent: e.userAgent,
        createdAt: e.createdAt,
      })),
      page,
      pageSize,
      total,
      hasMore: skip + entries.length < total,
    });
  } catch (err) {
    console.error("Get activity log error:", err);
    res.status(500).json({ error: "Failed to load activity log" });
  }
});

// POST /me/location-history — store current location (when it changes). Keeps last 7 days.
router.post("/location-history", async (req, res) => {
  try {
    const { lat, lon, name } = req.body;
    if (lat == null || lon == null || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
      return res.status(400).json({ error: "lat and lon are required" });
    }
    const latNum = Number(lat);
    const lonNum = Number(lon);
    await LocationHistory.create({
      userId: req.user.id,
      lat: latNum,
      lon: lonNum,
      name: name != null && String(name).trim() ? String(name).trim() : null,
    });
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    await LocationHistory.deleteMany({
      userId: req.user.id,
      createdAt: { $lt: cutoff },
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Post location history error:", err);
    res.status(500).json({ error: "Failed to save location" });
  }
});

// GET /me/location-history?page=1&pageSize=10 — last 7 days of locations with name (paginated)
router.get("/location-history", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      Math.max(1, parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE
    );
    const skip = (page - 1) * pageSize;
    const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
    const filter = { userId: req.user.id, createdAt: { $gte: cutoff } };

    const [total, entries] = await Promise.all([
      LocationHistory.countDocuments(filter),
      LocationHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      items: entries.map((e) => ({
        id: String(e._id),
        lat: e.lat,
        lon: e.lon,
        name: e.name,
        createdAt: e.createdAt,
      })),
      page,
      pageSize,
      total,
      hasMore: skip + entries.length < total,
    });
  } catch (err) {
    console.error("Get location history error:", err);
    res.status(500).json({ error: "Failed to load location history" });
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
