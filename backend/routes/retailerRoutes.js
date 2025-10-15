import express from "express";
import {
  sendOtp,
  verifyOtp,
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
} from "../controllers/retailerController.js";

const router = express.Router();

// Send OTP to phone
router.post("/send-otp", sendOtp);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Register retailer (after OTP verified)
router.post("/register", registerRetailer);

// Login retailer
router.post("/login", loginRetailer);

// Get retailer profile by ID
router.get("/:id", getRetailerProfile);

export default router;
