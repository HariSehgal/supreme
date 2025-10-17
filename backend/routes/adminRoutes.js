import express from "express";
import {
  loginAdmin,
  addAdmin,
  addClientAdmin,
  addClientUser,
  loginClientAdmin,
  protect,
  // Campaign controllers
  addCampaign,
  getAllCampaigns,
  
  deleteCampaign,
} from "../controllers/adminController.js";

const router = express.Router();

// ===============================
// ADMIN AUTH ROUTES
// ===============================

// Admin login
router.post("/login", loginAdmin);

// Admin adds new admin
router.post("/add-admin", protect, addAdmin);

// Admin adds client admin
router.post("/add-client-admin", protect, addClientAdmin);

// Admin adds client user
router.post("/add-client-user", protect, addClientUser);

// Client admin login
router.post("/client-admin-login", loginClientAdmin);

// ===============================
// CAMPAIGN ROUTES (admin only)
// ===============================

// Create a new campaign
router.post("/campaign", protect, addCampaign);

// Get all campaigns
router.get("/campaigns", protect, getAllCampaigns);

// Get campaign by ID


// Update a campaign by ID


// Delete a campaign by ID
router.delete("/campaign/:id", protect, deleteCampaign);

export default router;
