import express from "express";
import {
  sendOtp,
  verifyOtp,
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
  getRetailerCampaigns,
  updateCampaignStatus, // ✅ newly added controller
} from "../controllers/retailerController.js";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js"; // JWT middleware

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFiles = upload.fields([
  { name: "govtIdPhoto", maxCount: 1 },
  { name: "personPhoto", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "outletPhoto", maxCount: 1 },
  { name: "registrationForm", maxCount: 1 },
]);

const router = express.Router();

// -------------------------------
// AUTH
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/register", uploadFiles, registerRetailer);
router.post("/login", loginRetailer);

// -------------------------------
// PROTECTED ROUTES
router.get("/profile/:id", protect, getRetailerProfile);

// Fetch only campaigns assigned to this retailer
router.get("/campaigns", protect, getRetailerCampaigns);

// ✅ Retailer accepts or rejects a campaign
router.put("/campaigns/:campaignId/status", protect, updateCampaignStatus);

export default router;
