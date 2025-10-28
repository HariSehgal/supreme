import express from "express";
import multer from "multer";
import {
  registerCareerApplicant,
  loginCareerApplicant,
  applyToJob,
  getCandidateApplications,
} from "../controllers/careerController.js";
import { getAllJobs } from "../controllers/careerController.js";



const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ===============================
// Candidate Registration & Login
// ===============================
router.post("/register", upload.single("resume"), registerCareerApplicant);
router.post("/login", loginCareerApplicant);
router.get("/jobs", getAllJobs);
// ===============================
// Job Applications
// ===============================
router.post("/apply", applyToJob); // Candidate applies to a job
router.get("/:candidateId/applications", getCandidateApplications); // View all job applications

export default router;
