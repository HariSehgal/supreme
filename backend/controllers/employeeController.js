import jwt from "jsonwebtoken";
import { Employee, Campaign,EmployeeReport } from "../models/user.js";
import bcrypt from "bcryptjs";
import PDFKit from "pdfkit";
const PDFDocument = PDFKit;
/* ======================================================
   UPDATE EMPLOYEE PROFILE
====================================================== */
export const updateEmployeeProfile = async (req, res) => {
  try {
    const { id } = req.user; // From JWT
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    /* --------------------------------------------------
       🔥 Step 1: Apply Contractual vs Permanent Rules
    -------------------------------------------------- */
    const isContractual = employee.employeeType === "Contractual";

    if (isContractual) {
      // ❌ Remove permanent-only fields
      const blocked = [
        "highestQualification",
        "maritalStatus",
        "fathersName",
        "fatherDob",
        "motherName",
        "motherDob",
        "spouseName",
        "spouseDob",
        "child1Name",
        "child1Dob",
        "child2Name",
        "child2Dob",
        "uanNumber",
        "esiNumber",
        "pfNumber",
        "esiDispensary",
        "experiences",
      ];

      blocked.forEach((f) => delete req.body[f]);

      
      const blockedFiles = [
        "familyPhoto",
        "esiForm",
        "pfForm",
        "employmentForm",
        "cv",
      ];
      blockedFiles.forEach((f) => delete req.files?.[f]);
    }

    /* --------------------------------------------------
       🔥 Step 2: Destructure Incoming Fields
    -------------------------------------------------- */
    const {
      gender,
      dob,
      highestQualification,
      maritalStatus,
      fathersName,
      fatherDob,
      motherName,
      motherDob,
      spouseName,
      spouseDob,
      child1Name,
      child1Dob,
      child2Name,
      child2Dob,
      alternatePhone,
      aadhaarNumber,
      panNumber,
      uanNumber,
      esiNumber,
      pfNumber,
      esiDispensary,
      contractLength,
      newPassword,
    } = req.body;

    Object.assign(employee, {
      gender,
      dob,
      highestQualification,
      maritalStatus,
      fathersName,
      fatherDob,
      motherName,
      motherDob,
      spouseName,
      spouseDob,
      child1Name,
      child1Dob,
      child2Name,
      child2Dob,
      alternatePhone,
      aadhaarNumber,
      panNumber,
      uanNumber,
      esiNumber,
      pfNumber,
      esiDispensary,
      contractLength,
    });

    /* --------------------------------------------------
       🔥 Step 3: Parse Nested JSON Fields
    -------------------------------------------------- */
    if (req.body.correspondenceAddress) {
      employee.correspondenceAddress = JSON.parse(req.body.correspondenceAddress);
    }
    if (req.body.permanentAddress) {
      employee.permanentAddress = JSON.parse(req.body.permanentAddress);
    }
    if (req.body.bankDetails) {
      employee.bankDetails = JSON.parse(req.body.bankDetails);
    }
    if (req.body.experiences && !isContractual) {
      employee.experiences = JSON.parse(req.body.experiences);
    }

    /* --------------------------------------------------
       🔥 Step 4: Handle Files Uploading
    -------------------------------------------------- */
    const files = req.files || {};
    if (!employee.files) employee.files = {};

    const fileFields = [
      "aadhaarFront",
      "aadhaarBack",
      "panCard",
      "personPhoto",
      "familyPhoto",
      "bankProof",
      "esiForm",
      "pfForm",
      "employmentForm",
      "cv",
    ];

    fileFields.forEach((field) => {
      if (files[field]) {
        employee.files[field] = {
          data: files[field][0].buffer,
          contentType: files[field][0].mimetype,
        };
      }
    });

    /* --------------------------------------------------
       🔥 Step 5: Password Change (Optional)
    -------------------------------------------------- */
    if (newPassword && newPassword.trim().length >= 6) {
      employee.password = await bcrypt.hash(newPassword, 10);
    }

    // Mark first login as completed
    employee.isFirstLogin = false;

    await employee.save();

    res.status(200).json({
      message: "Profile updated successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        isFirstLogin: employee.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("❌ Error updating employee profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   LOGIN EMPLOYEE
====================================================== */
export const loginEmployee = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const employee = await Employee.findOne({
      $or: [{ email }, { phone }],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: employee._id, role: "employee" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        isFirstLogin: employee.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("Employee login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   GET EMPLOYEE CAMPAIGNS
====================================================== */
export const getEmployeeCampaigns = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const campaigns = await Campaign.find({
      "assignedEmployees.employeeId": employee._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Campaigns fetched successfully",
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
      },
      campaigns,
    });
  } catch (error) {
    console.error("Get employee campaigns error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   UPDATE CAMPAIGN STATUS
====================================================== */
export const updateCampaignStatus = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { campaignId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const campaign = await Campaign.findOne({
      _id: campaignId,
      "assignedEmployees.employeeId": employeeId,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found or not assigned to this employee" });
    }

    const employeeEntry = campaign.assignedEmployees.find(
      (e) => e.employeeId.toString() === employeeId
    );

    if (!employeeEntry) {
      return res.status(404).json({ message: "Employee not assigned to this campaign" });
    }

    employeeEntry.status = status;
    employeeEntry.updatedAt = new Date();

    await campaign.save();

    res.status(200).json({
      message: `Campaign ${status} successfully`,
      campaignId,
      employeeStatus: employeeEntry.status,
    });
  } catch (error) {
    console.error("Update campaign status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   CLIENT PAYMENT PLAN
====================================================== */
export const clientSetPaymentPlan = async (req, res) => {
  try {
    const { campaignId, retailerId, totalAmount, notes, dueDate } = req.body;

    if (!req.user || !["client-admin", "client-user"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only client admins or users can set payment plans" });
    }

    if (!campaignId || !retailerId || !totalAmount) {
      return res.status(400).json({ message: "campaignId, retailerId, and totalAmount are required" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const retailer = await Retailer.findById(retailerId);
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });

    const assignedRetailer = campaign.assignedRetailers.find(
      (r) => r.retailerId.toString() === retailerId.toString() && r.status === "accepted"
    );

    if (!assignedRetailer) {
      return res.status(400).json({ message: "Retailer must be assigned and accepted the campaign" });
    }

    const existingPayment = await Payment.findOne({ campaign: campaignId, retailer: retailerId });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment plan already exists for this retailer" });
    }


    const payment = new Payment({
      campaign: campaignId,
      retailer: retailerId,
      totalAmount,
      amountPaid: 0,
      remainingAmount: totalAmount,
      paymentStatus: "Pending",
      lastUpdatedBy: req.user.id,
      notes,
      dueDate,
    });

    await payment.save();

    res.status(201).json({
      message: "Payment plan created successfully",
      payment,
    });
  } catch (error) {
    console.error("Client set payment plan error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const submitEmployeeReport = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const {
      campaignId,
      retailerId,
      visitType,
      attended,
      notVisitedReason,
      otherReasonText,
      reportType,
      frequency,
      fromDate,
      toDate,
      extraField,
      stockType,
      brand,
      product,
      sku,
      productType,
      quantity,
      latitude,
      longitude
    } = req.body;

    // Basic Validation
    if (!campaignId || !retailerId) {
      return res.status(400).json({ message: "campaignId and retailerId are required" });
    }

    // Create Report Document
    const report = new EmployeeReport({
      employeeId,
      campaignId,
      retailerId,
      visitType,
      attended,
      notVisitedReason,
      otherReasonText,
      reportType,
      frequency,
      fromDate,
      toDate,
      extraField,
      stockType,
      brand,
      product,
      sku,
      productType,
      quantity,
      location: {
        latitude: Number(latitude) || null,
        longitude: Number(longitude) || null,
      },
    });

    /* ----------------------------
       🔥 Handle Images Upload
    ---------------------------- */
    const files = req.files || {};

    // Multiple images
    if (files.images) {
      report.images = files.images.map((file) => ({
        data: file.buffer,
        contentType: file.mimetype,
        fileName: file.originalname,
      }));
    }

    // Single bill copy
    if (files.billCopy && files.billCopy[0]) {
      const file = files.billCopy[0];
      report.billCopy = {
        data: file.buffer,
        contentType: file.mimetype,
        fileName: file.originalname,
      };
    }

    await report.save();

    res.status(201).json({
      message: "Report submitted successfully",
      report,
    });

  } catch (error) {
    console.error("Submit report error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getEmployeeReports = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const reports = await EmployeeReport.find({ employeeId })
      .populate("retailerId", "name shopDetails")
      .populate("campaignId", "name type")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Reports fetched successfully",
      reports,
    });

  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const downloadEmployeeReport = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { reportId } = req.body;

    if (!reportId) {
      return res.status(400).json({ message: "reportId is required" });
    }

    // Fetch EXACT report
    const report = await EmployeeReport.findOne({
      _id: reportId,
      employeeId
    })
      .populate("employeeId", "name email phone")
      .populate("campaignId", "name type")
      .populate("retailerId", "name contactNo shopDetails");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 40 });

    // Set Response Headers before piping
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${report._id}.pdf`
    );

    doc.pipe(res);

    /* -------------------------
       HEADER
    --------------------------*/
    doc.fontSize(20).text("Employee Visit Report", { align: "center" });
    doc.moveDown();

    /* -------------------------
       EMPLOYEE INFO
    --------------------------*/
    doc.fontSize(14).text("Employee Details", { underline: true });
    doc.fontSize(11);
    doc.text(`Name: ${report.employeeId?.name || "N/A"}`);
    doc.text(`Email: ${report.employeeId?.email || "N/A"}`);
    doc.text(`Phone: ${report.employeeId?.phone || "N/A"}`);
    doc.moveDown();

    /* -------------------------
       CAMPAIGN INFO
    --------------------------*/
    doc.fontSize(14).text("Campaign Details", { underline: true });
    doc.fontSize(11);
    doc.text(`Campaign: ${report.campaignId?.name || "N/A"}`);
    doc.text(`Type: ${report.campaignId?.type || "N/A"}`);
    doc.moveDown();

    /* -------------------------
       RETAILER INFO
    --------------------------*/
    doc.fontSize(14).text("Retailer Details", { underline: true });
    doc.fontSize(11);
    doc.text(`Name: ${report.retailerId?.name || "N/A"}`);
    doc.text(`Contact: ${report.retailerId?.contactNo || "N/A"}`);

    const addr = report.retailerId?.shopDetails?.shopAddress;
    doc.text(
      `Address: ${
        addr
          ? `${addr.address || ""}, ${addr.city || ""}, ${addr.state || ""}, ${
              addr.pincode || ""
            }`
          : "N/A"
      }`
    );
    doc.moveDown();

    /* -------------------------
       REPORT DETAILS
    --------------------------*/
    doc.fontSize(14).text("Report Details", { underline: true });
    doc.fontSize(11);
    doc.text(`Visit Type: ${report.visitType || "N/A"}`);
    doc.text(`Attended: ${report.attended ? "Yes" : "No"}`);
    doc.text(`Reason: ${report.notVisitedReason || "N/A"}`);
    doc.text(`Report Type: ${report.reportType || "N/A"}`);
    doc.text(`Frequency: ${report.frequency || "N/A"}`);
    doc.text(
      `Date Range: ${
        report.fromDate
          ? new Date(report.fromDate).toLocaleDateString()
          : "N/A"
      } → ${
        report.toDate ? new Date(report.toDate).toLocaleDateString() : "N/A"
      }`
    );
    doc.moveDown();

    /* -------------------------
       GEOLOCATION
    --------------------------*/
    doc.fontSize(14).text("Location", { underline: true });
    doc.fontSize(11);
    doc.text(`Latitude: ${report.location?.latitude || "N/A"}`);
    doc.text(`Longitude: ${report.location?.longitude || "N/A"}`);
    doc.moveDown();

    /* -------------------------
       IMAGES
    --------------------------*/
    if (report.images?.length) {
      doc.addPage();
      doc.fontSize(14).text("Attached Images", { underline: true });

      for (let img of report.images) {
        try {
          if (img?.data) {
            doc.addPage();
            doc.image(img.data, {
              fit: [500, 500],
              align: "center",
            });
            doc.text(img.fileName || "Image", { align: "center" });
          }
        } catch (err) {
          doc.text("[Failed to load image]");
        }
      }
    }

    /* -------------------------
       BILL COPY
    --------------------------*/
    if (report.billCopy?.data) {
      doc.addPage();
      doc.fontSize(14).text("Bill Copy", { underline: true });

      try {
        doc.image(report.billCopy.data, {
          fit: [500, 500],
          align: "center",
        });
      } catch {
        doc.text("[Failed to load bill copy]");
      }
    }

    doc.end();
  } catch (error) {
    console.error("PDF Download Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Failed to generate report PDF",
        error: error.message,
      });
    }
    try {
      res.end();
    } catch {}
  }
};
