import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginEmployee,
  getEmployeeCampaigns,
  updateCampaignStatus, 
  clientSetPaymentPlan
} from "../controllers/employeeController.js";


const router = express.Router();

/* ================================
   EMPLOYEE ROUTES
================================ */
// Employee login
router.post("/employee/login", loginEmployee);

// Get all assigned campaigns
router.get("/employee/campaigns", protect, getEmployeeCampaigns);

// Update campaign status (accept/reject)
router.put("/employee/campaigns/:campaignId/status", protect, updateCampaignStatus);

/* ================================
   CLIENT ROUTES
================================ */
// Client login


// Client sets or updates payment plan
router.post("/client/campaigns/payment", protect, clientSetPaymentPlan);

export default router;
