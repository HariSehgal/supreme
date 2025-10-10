import express from "express";
import { createAdmin, loginAdmin, getAdmins } from "../controllers/adminController.js";

const router = express.Router();

// Create admin
router.post("/", createAdmin);

// Admin login
router.post("/login", loginAdmin);

// Get all admins
router.get("/", getAdmins);

export default router;
