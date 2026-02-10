const express = require("express");
const Contact = require("../models/Contact");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { recordActivity } = require("../lib/recordActivity");

const router = express.Router();

router.use(auth);

/**
 * POST /sos
 * Body: { lat: number, lon: number, address?: string }
 * Sends current location to all emergency and guardian contacts via SMS (Twilio).
 */
router.post("/", async (req, res) => {
  try {
    const { lat, lon, address } = req.body;
    const latNum = typeof lat === "number" ? lat : parseFloat(lat);
    const lonNum = typeof lon === "number" ? lon : parseFloat(lon);

    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) {
      return res.status(400).json({
        error: "Valid lat and lon are required to send SOS.",
      });
    }

    const user = await User.findById(req.user.id).select("name email").lean();
    const userName = (user && user.name) ? user.name : "FloodVis user";

    const contacts = await Contact.find({
      userId: req.user.id,
      $or: [{ types: "emergency" }, { types: "guardian" }],
    });

    const uniquePhones = [...new Set(contacts.map((c) => c.phone.trim()).filter(Boolean))];
    if (uniquePhones.length === 0) {
      return res.status(400).json({
        error: "No emergency or guardian contacts to notify. Add contacts first.",
      });
    }

    const mapsUrl = `https://www.google.com/maps?q=${latNum},${lonNum}`;
    const locationText = address && String(address).trim()
      ? String(address).trim()
      : `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
    const message = `SOS from ${userName}: I need help. My location: ${locationText}. Map: ${mapsUrl}`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn("[SOS] Twilio not configured (missing TWILIO_* env). Skipping SMS.");
      await recordActivity(req, req.user.id, "sos_sent", {
        lat: latNum,
        lon: lonNum,
        contactCount: uniquePhones.length,
        smsSent: false,
        reason: "twilio_not_configured",
      });
      return res.status(503).json({
        error: "SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to send alerts.",
        contactCount: uniquePhones.length,
      });
    }

    const twilio = require("twilio")(accountSid, authToken);
    const results = { sent: 0, failed: 0 };

    for (const to of uniquePhones) {
      try {
        await twilio.messages.create({
          body: message,
          from: fromNumber,
          to: to,
        });
        results.sent += 1;
      } catch (err) {
        console.error("[SOS] Twilio send failed for", to, err.message);
        results.failed += 1;
      }
    }

    await recordActivity(req, req.user.id, "sos_sent", {
      lat: latNum,
      lon: lonNum,
      contactCount: uniquePhones.length,
      smsSent: results.sent,
      smsFailed: results.failed,
    });

    if (results.sent === 0) {
      return res.status(502).json({
        error: "Could not send SMS to any contact. Check Twilio config and phone numbers.",
        contactCount: uniquePhones.length,
      });
    }

    res.status(200).json({
      ok: true,
      message: `SOS sent to ${results.sent} contact(s).`,
      sent: results.sent,
      failed: results.failed,
    });
  } catch (err) {
    console.error("SOS error:", err);
    res.status(500).json({ error: "Failed to send SOS alert." });
  }
});

module.exports = router;
