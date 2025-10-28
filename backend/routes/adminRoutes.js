import express from "express";
import multer from "multer";
import {
  // Auth controllers
  loginAdmin,
  addAdmin,
  addClientAdmin,
  addClientUser,
  loginClientAdmin,

  // Middleware
  protect,

  // Campaign controllers
  addCampaign,
  getAllCampaigns,
  deleteCampaign,
  assignCampaign,
  updateCampaignPayment,

  // Employee & Retailer controllers
  addEmployee,
  bulkAddEmployees,
  getAllEmployees,
  getAllRetailers,

  // Job management controllers
  getAdminJobs,            // Get all jobs
  createJobPosting,        // Create a job
  getJobApplications,      // Get all job applications
  updateCandidateStatus,   // Update application status
  getCandidateResume,      // View/download resume
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
   EMPLOYEE ROUTES
   =========================================================== */
router.post("/employees", protect, addEmployee);
router.post("/employees/bulk", protect, upload.single("file"), bulkAddEmployees);
router.get("/employees", protect, getAllEmployees);

/* ===========================================================
   RETAILER ROUTES
   =========================================================== */
router.get("/retailers", protect, getAllRetailers);

/* ===========================================================
   CAMPAIGN ROUTES
   =========================================================== */
router.post("/campaigns", protect, addCampaign);
router.get("/campaigns", protect, getAllCampaigns);
router.delete("/campaigns/:id", protect, deleteCampaign);
router.post("/campaigns/assign", protect, assignCampaign);
router.post("/campaigns/payment", protect, updateCampaignPayment);

/* ===========================================================
   JOB MANAGEMENT ROUTES
   =========================================================== */
// ✅ Create a new job posting
router.post("/jobs", protect, createJobPosting);

// ✅ Get all job postings (for admin view)
router.get("/jobs", protect, getAdminJobs);

// ✅ Get all candidate job applications
router.get("/applications", protect, getJobApplications);

// ✅ Update a candidate’s application status
router.put("/applications/:id/status", protect, updateCandidateStatus);

// ✅ View or download candidate resume
router.get("/applications/:id/resume", protect, getCandidateResume);

/* ===========================================================
   EXPORT ROUTER
   =========================================================== */
export default router;
