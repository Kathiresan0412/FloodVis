const express = require("express");
const Guardian = require("../models/Guardian");
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const { recordActivity } = require("../lib/recordActivity");

const router = express.Router();

router.use(auth);

function toGuardianDto(c) {
  return {
    id: String(c._id),
    name: c.name,
    relation: c.relation,
    phone: c.phone,
    types: c.types || [],
  };
}

// GET /guardians — list guardians (Contacts with type guardian); migrate from Guardian if needed
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find({
      userId: req.user.id,
      types: "guardian",
    }).sort({ createdAt: 1 });

    if (contacts.length === 0) {
      const oldGuardians = await Guardian.find({ userId: req.user.id }).sort({
        createdAt: 1,
      });
      if (oldGuardians.length > 0) {
        for (const g of oldGuardians) {
          await Contact.create({
            userId: req.user.id,
            name: g.name,
            relation: g.relation,
            phone: g.phone,
            types: ["guardian"],
          });
        }
        await Guardian.deleteMany({ userId: req.user.id });
        const migrated = await Contact.find({
          userId: req.user.id,
          types: "guardian",
        }).sort({ createdAt: 1 });
        return res.json(migrated.map(toGuardianDto));
      }
    }

    res.json(contacts.map(toGuardianDto));
  } catch (err) {
    console.error("Get guardians error:", err);
    res.status(500).json({ error: "Failed to load guardians" });
  }
});

// POST /guardians — add guardian (create Contact with type guardian)
router.post("/", async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    if (!name || !relation || !phone) {
      return res
        .status(400)
        .json({ error: "Name, relation, and phone are required" });
    }

    const contact = await Contact.create({
      userId: req.user.id,
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      types: ["guardian"],
    });

    await recordActivity(req, req.user.id, "guardian_add", {
      guardianId: contact._id,
      name: contact.name,
    });

    res.status(201).json(toGuardianDto(contact));
  } catch (err) {
    console.error("Create guardian error:", err);
    res.status(500).json({ error: "Failed to add guardian" });
  }
});

// PUT /guardians/:id — update guardian (Contact with type guardian)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation, phone } = req.body;
    const contact = await Contact.findOne({
      _id: id,
      userId: req.user.id,
      types: "guardian",
    });
    if (!contact) {
      return res.status(404).json({ error: "Guardian not found" });
    }
    if (name !== undefined) contact.name = String(name).trim();
    if (relation !== undefined) contact.relation = String(relation).trim();
    if (phone !== undefined) contact.phone = String(phone).trim();
    await contact.save();

    await recordActivity(req, req.user.id, "guardian_update", {
      guardianId: contact._id,
      name: contact.name,
    });

    res.json(toGuardianDto(contact));
  } catch (err) {
    console.error("Update guardian error:", err);
    res.status(500).json({ error: "Failed to update guardian" });
  }
});

// DELETE /guardians/:id — remove guardian (remove type guardian from Contact or delete if no other types)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({ _id: id, userId: req.user.id });
    if (!contact) {
      return res.status(404).json({ error: "Guardian not found" });
    }

    await recordActivity(req, req.user.id, "guardian_remove", {
      guardianId: contact._id,
      name: contact.name,
    });

    const otherTypes = (contact.types || []).filter((t) => t !== "guardian");
    if (otherTypes.length > 0) {
      contact.types = otherTypes;
      await contact.save();
    } else {
      await Contact.deleteOne({ _id: id });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete guardian error:", err);
    res.status(500).json({ error: "Failed to delete guardian" });
  }
});

module.exports = router;
