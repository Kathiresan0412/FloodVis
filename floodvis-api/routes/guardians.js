const express = require("express");
const Guardian = require("../models/Guardian");
const auth = require("../middleware/auth");
const { recordActivity } = require("../lib/recordActivity");

const router = express.Router();

// All guardian routes require a logged-in user
router.use(auth);

// GET /guardians - list current user's guardians
router.get("/", async (req, res) => {
  try {
    const guardians = await Guardian.find({ userId: req.user.id }).sort({
      createdAt: 1,
    });
    res.json(
      guardians.map((g) => ({
        id: g._id,
        name: g.name,
        relation: g.relation,
        phone: g.phone,
      }))
    );
  } catch (err) {
    console.error("Get guardians error:", err);
    res.status(500).json({ error: "Failed to load guardians" });
  }
});

// POST /guardians - add a guardian
router.post("/", async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    if (!name || !relation || !phone) {
      return res
        .status(400)
        .json({ error: "Name, relation, and phone are required" });
    }

    const guardian = await Guardian.create({
      userId: req.user.id,
      name,
      relation,
      phone,
    });

    await recordActivity(req, req.user.id, "guardian_add", {
      guardianId: guardian._id,
      name: guardian.name,
    });

    res.status(201).json({
      id: guardian._id,
      name: guardian.name,
      relation: guardian.relation,
      phone: guardian.phone,
    });
  } catch (err) {
    console.error("Create guardian error:", err);
    res.status(500).json({ error: "Failed to add guardian" });
  }
});

// DELETE /guardians/:id - delete one guardian
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Guardian.findOne({
      _id: id,
      userId: req.user.id,
    });
    if (!existing) {
      return res.status(404).json({ error: "Guardian not found" });
    }

    await recordActivity(req, req.user.id, "guardian_remove", {
      guardianId: existing._id,
      name: existing.name,
    });

    await Guardian.deleteOne({ _id: id });
    res.status(204).send();
  } catch (err) {
    console.error("Delete guardian error:", err);
    res.status(500).json({ error: "Failed to delete guardian" });
  }
});

module.exports = router;

