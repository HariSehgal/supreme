import express from "express";
import multer from "multer";
import {
  // Auth controllers
  loginAdmin,
  addAdmin,
  addClientAdmin,
  addClientUser,
  loginClientAdmin,
registerRetailer,  
  // Forgot / Reset Password controllers
  forgotPassword,
  resetPassword,

  // Middleware
  protect,
  updateCampaignStatus,

  // Campaign controllers
  addCampaign,
  getAllCampaigns,
  deleteCampaign,
  assignCampaign,
  updateCampaignPayment,
getSingleAdminJob,
  // Employee & Retailer controllers
  addEmployee,
  bulkAddEmployees,
  getAllEmployees,
  getAllRetailers,
updateJobPosting,
  // Job management controllers
  getAdminJobs,
  createJobPosting,
  getJobApplications,
  updateApplicationStatus,   // ✅ renamed to match new controller logic
  getCandidateResume,
} from "../controllers/adminController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* ===========================================================
   ADMIN AUTH ROUTES
=========================================================== */
router.post("/login", loginAdmin);
router.post("/add-admin", protect, addAdmin);
router.post("/add-client-admin", protect, addClientAdmin);
router.post("/add-client-user", protect, addClientUser);
router.post("/client-admin-login", loginClientAdmin);


/* ===========================================================
   PASSWORD RESET ROUTES
=========================================================== */
// 🔹 Step 1: Request password reset link
router.post("/forgot-password", forgotPassword);

// 🔹 Step 2: Reset password using token
router.post("/reset-password", resetPassword);

/* ===========================================================
   EMPLOYEE ROUTES
=========================================================== */
router.post("/employees", protect, addEmployee);
router.post("/employees/bulk", protect, upload.single("file"), bulkAddEmployees);
router.get("/employees", protect, getAllEmployees);

/* ===========================================================
   RETAILER ROUTES
=========================================================== */
router.get("/retailers", protect, getAllRetailers);
router.post(
  "/retailers",
  protect,
  upload.fields([
    { name: "govtIdPhoto", maxCount: 1 },
    { name: "personPhoto", maxCount: 1 },
    { name: "registrationForm", maxCount: 1 },
    { name: "outletPhoto", maxCount: 1 },
  ]),
  registerRetailer
);
/* ===========================================================
   CAMPAIGN ROUTES
=========================================================== */
router.post("/campaigns", protect, addCampaign);
router.get("/campaigns", protect, getAllCampaigns);
router.delete("/campaigns/:id", protect, deleteCampaign);
router.post("/campaigns/assign", protect, assignCampaign);
router.post("/campaigns/payment", protect, updateCampaignPayment);
router.get("/admin/career/jobs/:id", protect, getSingleAdminJob);
router.patch("/campaigns/:id/status", protect, updateCampaignStatus);

/* ===========================================================
   JOB MANAGEMENT ROUTES
=========================================================== */
router.post("/jobs", protect, createJobPosting);
router.get("/jobs", protect, getAdminJobs);
router.get("/applications", protect, getJobApplications);
router.put("/applications/:id/status", protect, updateApplicationStatus);
router.get("/applications/:id/resume", protect, getCandidateResume);
router.get("/career/jobs/:id", protect, getSingleAdminJob);
router.put("/jobs/:id", protect, updateJobPosting);
/* ===========================================================
   EXPORT ROUTER
=========================================================== */
export default router;
