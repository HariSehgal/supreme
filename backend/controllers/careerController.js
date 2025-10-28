import { CareerApplication, JobApplication, Job } from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/* ===============================
   REGISTER CANDIDATE
=============================== */
export const registerCareerApplicant = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    if (!fullName || !phoneNumber || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await CareerApplication.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const resume = req.file
      ? { data: req.file.buffer, contentType: req.file.mimetype }
      : undefined;

    const candidate = new CareerApplication({
      fullName,
      phoneNumber,
      email,
      password,
      resume,
    });

    await candidate.save();
    res.status(201).json({
      message: "Registration successful",
      candidateId: candidate._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   LOGIN CANDIDATE
=============================== */
export const loginCareerApplicant = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await CareerApplication.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   APPLY TO A JOB (Candidate)
=============================== */
export const applyToJob = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId)
      return res.status(400).json({ message: "Candidate ID and Job ID are required" });

    const job = await Job.findById(jobId);
    if (!job || !job.isActive)
      return res.status(404).json({ message: "Job not found or inactive" });

    const existingApp = await JobApplication.findOne({
      candidate: candidateId,
      job: jobId,
    });
    if (existingApp)
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });

    const newApplication = new JobApplication({
      candidate: candidateId,
      job: jobId,
      totalRounds: 1,
      currentRound: 0,
      status: "Pending",
    });

    await newApplication.save();

    res.status(201).json({
      message: "Job application submitted successfully",
      applicationId: newApplication._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET ALL APPLICATIONS (Candidate)
=============================== */
export const getCandidateApplications = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const applications = await JobApplication.find({ candidate: candidateId })
      .populate("job", "title location employmentType")
      .select("status currentRound totalRounds appliedAt updatedAt");

    if (!applications || applications.length === 0)
      return res.status(404).json({ message: "No job applications found" });

    res.status(200).json({
      message: "Applications retrieved successfully",
      data: applications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET ALL JOB POSTINGS (for Candidates)
=============================== */
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });

    if (!jobs || jobs.length === 0)
      return res.status(404).json({ message: "No job postings available" });

    res.status(200).json({
      message: "Job postings retrieved successfully",
      jobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
