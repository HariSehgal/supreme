import express from "express";
import { ClientAdmin, ClientUser } from "../models/user.js";

const router = express.Router();

// Create Client Admin
router.post("/admin", async (req, res) => {
  try {
    const admin = await ClientAdmin.create(req.body);
    res.status(201).json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Client User
router.post("/user", async (req, res) => {
  try {
    const user = await ClientUser.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
