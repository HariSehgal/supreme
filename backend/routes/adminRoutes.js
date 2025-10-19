import express from "express";
import multer from "multer";
import {
  loginAdmin,
  addAdmin,
  addClientAdmin,
  addClientUser,
  loginClientAdmin,
  protect,
  addCampaign,
  getAllCampaigns,
  deleteCampaign,
  addEmployee,
  bulkAddEmployees,
} from "../controllers/adminController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
// EMPLOYEE ROUTES (own organization)
// ===============================

// Single employee add
router.post("/employee", protect, addEmployee);

// Bulk upload employees via Excel/CSV
router.post("/employees/bulk", protect, upload.single("file"), bulkAddEmployees);

// ===============================
// CAMPAIGN ROUTES (admin only)
// ===============================

// Create a new campaign
router.post("/campaign", protect, addCampaign);

// Get all campaigns
router.get("/campaigns", protect, getAllCampaigns);

// Delete a campaign by ID
router.delete("/campaign/:id", protect, deleteCampaign);

export default router;
