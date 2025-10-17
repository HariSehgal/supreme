import express from "express";
import {
  sendOtp,
  verifyOtp,
  registerRetailer,
  loginRetailer,
  getRetailerProfile,
} from "../controllers/retailerController.js";
import multer from "multer";

// ===============================
// Multer Setup
// ===============================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Fields that can be uploaded
const uploadFiles = upload.fields([
  { name: "govtIdPhoto", maxCount: 1 },
  { name: "personPhoto", maxCount: 1 },
  { name: "signature", maxCount: 1 },
  { name: "outletPhoto", maxCount: 1 },
  { name: "registrationForm", maxCount: 1 },
]);

const router = express.Router();

// Send OTP to phone
router.post("/send-otp", sendOtp);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Register retailer (with Multer to handle files)
router.post("/register", uploadFiles, registerRetailer);

// Login retailer
router.post("/login", loginRetailer);

// Get retailer profile by ID
router.get("/profile/:id", getRetailerProfile);

export default router;
