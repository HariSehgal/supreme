// backend/routes/adminRoutes.js
import express from "express";
import { loginAdmin, addAdmin, addClientAdmin, addClientUser, protect } from "../controllers/adminController.js";

const router = express.Router();

// ===== Admin login =====
router.post("/login", loginAdmin);

// ===== Add new admin =====
router.post("/add", protect, addAdmin);

// ===== Add client admin =====
router.post("/client-admin", protect, addClientAdmin);

// ===== Add client user =====
router.post("/client-user", protect, addClientUser);

export default router;
