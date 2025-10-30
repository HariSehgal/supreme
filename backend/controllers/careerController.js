import { CareerApplication, JobApplication, Job } from "../models/user.js";
import nodemailer from "nodemailer";

/* ===============================
   APPLY TO A JOB (Candidate)
=============================== */
export const applyToJob = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const { fullName, email, phone, city, coverLetter, jobId } = req.body; // ✅ Added city
    const resumeFile = req.file;

    // ✅ 1. Validate inputs
    if (!fullName || !email || !jobId)
      return res
        .status(400)
        .json({ message: "Full name, email, and job ID are required" });

    if (!resumeFile)
      return res.status(400).json({ message: "Resume file is required" });

    // ✅ 2. Validate job existence
    const job = await Job.findById(jobId);
    if (!job || !job.isActive)
      return res.status(404).json({ message: "Job not found or inactive" });

    // ✅ 3. Create or update candidate record
    let candidate = await CareerApplication.findOne({ email });

    if (!candidate) {
      candidate = await CareerApplication.create({
        fullName,
        email,
        phone,
        city, // ✅ Added city here
        resume: {
          data: resumeFile.buffer,
          contentType: resumeFile.mimetype,
          fileName: resumeFile.originalname,
        },
      });
    } else {
      candidate.fullName = fullName;
      candidate.phone = phone;
      candidate.city = city; // ✅ Added city update
      candidate.resume = {
        data: resumeFile.buffer,
        contentType: resumeFile.mimetype,
        fileName: resumeFile.originalname,
      };
      await candidate.save();
    }

    // ✅ 4. Prevent duplicate applications
    const existingApp = await JobApplication.findOne({
      candidate: candidate._id,
      job: job._id,
    });

    if (existingApp)
      return res
        .status(400)
        .json({ message: "You have already applied for this job." });

    // ✅ 5. Create a new job application record
    const newApplication = await JobApplication.create({
      candidate: candidate._id,
      job: job._id,
      status: "Pending",
      totalRounds: 1,
      currentRound: 0,
    });

    // ✅ 6. Send confirmation email to candidate
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Career Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Application Received for ${job.title}`,
      html: `
        <h2>Application Submitted Successfully</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for applying for the position of <strong>${job.title}</strong>.</p>
        <p>Your resume has been securely stored in our system and will be reviewed soon.</p>
        <p><strong>City:</strong> ${city}</p> <!-- ✅ Added city info in email -->
        <p><strong>Status:</strong> Pending</p>
        <br/>
        <p>Best regards,<br/>HR Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // ✅ 7. Respond success
    res.status(201).json({
      message: "Application submitted successfully. Confirmation email sent.",
      applicationId: newApplication._id,
    });
  } catch (err) {
    console.error("Error in applyToJob:", err);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

/* ===============================
   GET ALL JOB POSTINGS (for Candidates)
=============================== */
export const getAllJobs = async (req, res) => {
  try {
    const { location, department, employmentType, search } = req.query;

    const filters = { isActive: true };

    if (location) filters.location = { $regex: location, $options: "i" };
    if (department) filters.department = { $regex: department, $options: "i" };
    if (employmentType)
      filters.employmentType = { $regex: employmentType, $options: "i" };
    if (search) filters.title = { $regex: search, $options: "i" };

    const jobs = await Job.find(filters)
      .sort({ createdAt: -1 })
      .select(
        "title location department employmentType salaryRange createdAt"
      );

    if (!jobs.length)
      return res.status(404).json({ message: "No job postings available" });

    res.status(200).json({
      message: "Job postings retrieved successfully",
      count: jobs.length,
      jobs,
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
    const { email } = req.params;

    const applications = await JobApplication.find({ email }).select(
      "jobRole status createdAt"
    );

    if (!applications.length)
      return res
        .status(404)
        .json({ message: "No job applications found for this candidate" });

    res.status(200).json({
      message: "Applications retrieved successfully",
      count: applications.length,
      applications,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
