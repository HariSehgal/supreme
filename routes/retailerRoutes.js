import express from "express";
import { Retailer } from "../models/user.js";

const router = express.Router();

// Create Retailer
router.post("/", async (req, res) => {
  try {
    const retailer = await Retailer.create(req.body);
    res.status(201).json(retailer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
