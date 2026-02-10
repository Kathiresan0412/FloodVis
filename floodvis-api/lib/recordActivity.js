const LoginHistory = require("../models/LoginHistory");
const ActivityLog = require("../models/ActivityLog");

function getClientInfo(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    null;
  const userAgent = req.get("User-Agent") || null;
  return { ip, userAgent };
}

async function recordLogin(req, userId, success = true) {
  const { ip, userAgent } = getClientInfo(req);
  try {
    await LoginHistory.create({
      userId,
      success,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("recordLogin error:", err);
  }
}

async function recordActivity(req, userId, action, details = null) {
  const { ip, userAgent } = getClientInfo(req);
  try {
    await ActivityLog.create({
      userId,
      action,
      details: details || undefined,
      ip,
      userAgent,
    });
  } catch (err) {
    console.error("recordActivity error:", err);
  }
}

module.exports = { recordLogin, recordActivity, getClientInfo };
