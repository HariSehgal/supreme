import express from "express";
import {
  loginEmployee,
  getEmployeeCampaigns,
  updateCampaignStatus,
  updateEmployeeProfile,
  clientSetPaymentPlan,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js"; // ✅ your existing upload.js

const router = express.Router();

/* ================================
   EMPLOYEE ROUTES
================================ */

// 🔹 Employee login
router.post("/employee/login", loginEmployee);

// 🔹 Complete / Update profile (multipart with memory storage)
router.put(
  "/employee/profile",
  protect,
  upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "personPhoto", maxCount: 1 },
    { name: "familyPhoto", maxCount: 1 },
    { name: "bankProof", maxCount: 1 },
    { name: "esiForm", maxCount: 1 },
    { name: "pfForm", maxCount: 1 },
    { name: "employmentForm", maxCount: 1 },
    { name: "cv", maxCount: 1 },
  ]),
  updateEmployeeProfile
);

// 🔹 Get assigned campaigns
router.get("/employee/campaigns", protect, getEmployeeCampaigns);

// 🔹 Update campaign status
router.put("/employee/campaigns/:campaignId/status", protect, updateCampaignStatus);

// 🔹 Client sets payment plan
router.post("/client/campaigns/payment", protect, clientSetPaymentPlan);

export default router;
