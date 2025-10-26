import express from "express";
import {
  loginEmployee,
  getEmployeeCampaigns,
  updateCampaignStatus, // include the status update function
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Employee login
router.post("/login", loginEmployee);

// Get all assigned campaigns
router.get("/campaigns", protect, getEmployeeCampaigns);

// Update campaign status (accept/reject)
router.put("/campaigns/:campaignId/status", protect, updateCampaignStatus);

export default router;
