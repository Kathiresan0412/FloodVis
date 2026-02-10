const express = require("express");
const Contact = require("../models/Contact");
const auth = require("../middleware/auth");
const { recordActivity } = require("../lib/recordActivity");

const router = express.Router();
const VALID_TYPES = ["family", "emergency", "guardian"];

router.use(auth);

function toContactDto(c) {
  return {
    id: String(c._id),
    name: c.name,
    relation: c.relation,
    phone: c.phone,
    types: c.types || [],
  };
}

// GET /contacts?type=family|emergency|guardian — list contacts, optional filter by type
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { userId: req.user.id };
    if (type && VALID_TYPES.includes(type)) {
      filter.types = type;
    }
    const contacts = await Contact.find(filter).sort({ createdAt: 1 });
    res.json(contacts.map(toContactDto));
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

// POST /contacts — create contact with types
router.post("/", async (req, res) => {
  try {
    const { name, relation, phone, types } = req.body;
    if (!name || !relation || !phone) {
      return res
        .status(400)
        .json({ error: "Name, relation, and phone are required" });
    }
    const normalizedTypes = Array.isArray(types)
      ? types.filter((t) => VALID_TYPES.includes(t))
      : [];
    const contact = await Contact.create({
      userId: req.user.id,
      name: name.trim(),
      relation: relation.trim(),
      phone: phone.trim(),
      types: normalizedTypes,
    });
    await recordActivity(req, req.user.id, "contact_add", {
      contactId: contact._id,
      name: contact.name,
      types: contact.types,
    });
    res.status(201).json(toContactDto(contact));
  } catch (err) {
    console.error("Create contact error:", err);
    res.status(500).json({ error: "Failed to add contact" });
  }
});

// PUT /contacts/:id — update contact (name, relation, phone, types) or add types
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, relation, phone, types, addTypes } = req.body;
    const contact = await Contact.findOne({ _id: id, userId: req.user.id });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    if (name !== undefined) contact.name = String(name).trim();
    if (relation !== undefined) contact.relation = String(relation).trim();
    if (phone !== undefined) contact.phone = String(phone).trim();
    if (Array.isArray(types)) {
      contact.types = types.filter((t) => VALID_TYPES.includes(t));
    }
    if (Array.isArray(addTypes)) {
      const toAdd = addTypes.filter((t) => VALID_TYPES.includes(t) && !contact.types.includes(t));
      contact.types = [...contact.types, ...toAdd];
    }
    if (Array.isArray(req.body.removeTypes)) {
      const toRemove = req.body.removeTypes.filter((t) => VALID_TYPES.includes(t));
      contact.types = (contact.types || []).filter((t) => !toRemove.includes(t));
    }
    await contact.save();
    if (contact.types.length === 0) {
      await Contact.deleteOne({ _id: contact._id });
      await recordActivity(req, req.user.id, "contact_remove", {
        contactId: contact._id,
        name: contact.name,
      });
      return res.status(204).send();
    }
    await recordActivity(req, req.user.id, "contact_update", {
      contactId: contact._id,
      name: contact.name,
    });
    res.json(toContactDto(contact));
  } catch (err) {
    console.error("Update contact error:", err);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// DELETE /contacts/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findOne({ _id: id, userId: req.user.id });
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    await recordActivity(req, req.user.id, "contact_remove", {
      contactId: contact._id,
      name: contact.name,
    });
    await Contact.deleteOne({ _id: id });
    res.status(204).send();
  } catch (err) {
    console.error("Delete contact error:", err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
