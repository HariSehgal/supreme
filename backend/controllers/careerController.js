import { CareerApplication, JobApplication, Job } from "../models/user.js";
import nodemailer from "nodemailer";
import fetch from "node-fetch";

/* ============================================================
   APPLY TO A JOB (Candidate)
============================================================ */
export const applyToJob = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  try {
    const { fullName, email, phone, city, coverLetter, jobId } = req.body;
    const resumeFile = req.file;

    // 1️⃣ Validate inputs
    if (!fullName || !email || !jobId)
      return res.status(400).json({
        message: "Full name, email, and job ID are required",
      });

    if (!resumeFile)
      return res.status(400).json({ message: "Resume file is required" });

    // 2️⃣ Check job existence
    const job = await Job.findById(jobId);
    if (!job || !job.isActive)
      return res.status(404).json({ message: "Job not found or inactive" });

    // 3️⃣ Create or update candidate record
    let candidate = await CareerApplication.findOne({ email });

    if (!candidate) {
      candidate = await CareerApplication.create({
        fullName,
        email,
        phone,
        city,
        resume: {
          data: resumeFile.buffer,
          contentType: resumeFile.mimetype,
          fileName: resumeFile.originalname,
        },
      });
    } else {
      Object.assign(candidate, {
        fullName,
        phone,
        city,
        resume: {
          data: resumeFile.buffer,
          contentType: resumeFile.mimetype,
          fileName: resumeFile.originalname,
        },
      });
      await candidate.save();
    }

    // 4️⃣ Prevent duplicate job applications
    const existingApp = await JobApplication.findOne({
      candidate: candidate._id,
      job: job._id,
    });

    if (existingApp)
      return res
        .status(400)
        .json({ message: "You have already applied for this job." });

    // 5️⃣ Create a new job application record
    const newApplication = await JobApplication.create({
      candidate: candidate._id,
      job: job._id,
      status: "Pending",
      totalRounds: 1,
      currentRound: 0,
    });

    // 6️⃣ Send confirmation email
    const htmlContent = `
      <h2>Application Submitted Successfully</h2>
      <p>Dear ${fullName},</p>
      <p>Thank you for applying for the position of <strong>${job.title}</strong>.</p>
      <p>Your resume has been securely stored in our system and will be reviewed soon.</p>
      <p><strong>City:</strong> ${city}</p>
      <p><strong>Status:</strong> Pending</p>
      <br/>
      <p>Best regards,<br/>HR Team</p>
    `;

    // ✅ Use Resend in production (Render)
    if (process.env.NODE_ENV === "production") {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Career Portal <onboarding@resend.dev>",
            to: [email],
            subject: `Application Received for ${job.title}`,
            html: htmlContent,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Resend email failed:", errorText);
        } else {
          console.log(`✅ Resend email sent successfully to ${email}`);
        }
      } catch (emailErr) {
        console.error("Resend error:", emailErr.message);
      }
    } else {
      // ✅ Use Gmail locally
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Career Portal" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Application Received for ${job.title}`,
          html: htmlContent,
        });

        console.log(`✅ Local email sent to ${email}`);
      } catch (emailErr) {
        console.error("Local email error:", emailErr.message);
      }
    }

    // 7️⃣ Respond success
    res.status(201).json({
      message: "Application submitted successfully.",
      applicationId: newApplication._id,
    });
  } catch (err) {
    console.error("❌ Error in applyToJob:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

/* ============================================================
   GET ALL JOB POSTINGS (for Candidates)
============================================================ */
export const getAllJobs = async (req, res) => {
  try {
    const { location, department, employmentType, search } = req.query;

    // Base filter: only active jobs
    const filters = { isActive: true };

    if (location) filters.location = { $regex: location, $options: "i" };
    if (department) filters.department = { $regex: department, $options: "i" };
    if (employmentType) filters.employmentType = { $regex: employmentType, $options: "i" };
    if (search) filters.title = { $regex: search, $options: "i" };

    // Include all necessary fields in selection
    const jobs = await Job.find(filters)
      .sort({ createdAt: -1 })
      .select(
        "title description location department employmentType salaryRange experienceRequired createdAt"
      );

    if (!jobs.length) {
      return res.status(404).json({ message: "No job postings available" });
    }

    res.status(200).json({
      message: "Job postings retrieved successfully",
      count: jobs.length,
      jobs,
    });
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ============================================================
   GET ALL APPLICATIONS (Candidate)
============================================================ */
export const getCandidateApplications = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email)
      return res.status(400).json({ message: "Email parameter required." });

    // ✅ Corrected field lookup (linked via CareerApplication)
    const candidate = await CareerApplication.findOne({ email });
    if (!candidate)
      return res
        .status(404)
        .json({ message: "Candidate not found for provided email." });

    const applications = await JobApplication.find({ candidate: candidate._id })
      .populate("job", "title location department employmentType")
      .select("status createdAt");

    if (!applications.length)
      return res
        .status(404)
        .json({ message: "No job applications found for this candidate." });

    res.status(200).json({
      message: "Applications retrieved successfully.",
      count: applications.length,
      applications,
    });
  } catch (err) {
    console.error("❌ Error fetching applications:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
