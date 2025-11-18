import jwt from "jsonwebtoken";
import { Employee, Campaign,EmployeeReport } from "../models/user.js";
import bcrypt from "bcryptjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

    // ---------------------------
    // CREATE PDF DOCUMENT
    // ---------------------------
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    let y = height - 50;

    const write = (text, size = 12) => {
      if (y < 60) {
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - 50;
        newPage.drawText(text, { x: 40, y, size, font });
        y -= size + 8;
        return;
      }

      page.drawText(text, {
        x: 40,
        y,
        size,
        font
      });
      y -= size + 8;
    };

    // ---------------------------
    // HEADER
    // ---------------------------
    write("Employee Visit Report", 22);
    y -= 10;

    // ---------------------------
    // EMPLOYEE DETAILS
    // ---------------------------
    write("Employee Details", 16);
    write(`Name: ${report.employeeId?.name || "N/A"}`);
    write(`Email: ${report.employeeId?.email || "N/A"}`);
    write(`Phone: ${report.employeeId?.phone || "N/A"}`);

    y -= 10;

    // ---------------------------
    // CAMPAIGN DETAILS
    // ---------------------------
    write("Campaign Details", 16);
    write(`Campaign: ${report.campaignId?.name || "N/A"}`);
    write(`Type: ${report.campaignId?.type || "N/A"}`);

    y -= 10;

    // ---------------------------
    // RETAILER DETAILS
    // ---------------------------
    write("Retailer Details", 16);
    write(`Name: ${report.retailerId?.name || "N/A"}`);
    write(`Contact: ${report.retailerId?.contactNo || "N/A"}`);

    const addr = report.retailerId?.shopDetails?.shopAddress;
    write(
      `Address: ${
        addr
          ? `${addr.address || ""}, ${addr.city || ""}, ${addr.state || ""}, ${addr.pincode || ""}`
          : "N/A"
      }`
    );

    y -= 10;

    // ---------------------------
    // REPORT DETAILS
    // ---------------------------
    write("Report Details", 16);
    write(`Visit Type: ${report.visitType || "N/A"}`);
    write(`Attended: ${report.attended ? "Yes" : "No"}`);
    write(`Reason: ${report.notVisitedReason || "N/A"}`);
    write(`Report Type: ${report.reportType || "N/A"}`);
    write(`Frequency: ${report.frequency || "N/A"}`);

    write(
      `Date Range: ${
        report.fromDate ? new Date(report.fromDate).toLocaleDateString() : "N/A"
      } to ${
        report.toDate ? new Date(report.toDate).toLocaleDateString() : "N/A"
      }`
    ); // FIXED "→"

    y -= 10;

    // ---------------------------
    // LOCATION
    // ---------------------------
    write("Location", 16);
    write(`Latitude: ${report.location?.latitude || "N/A"}`);
    write(`Longitude: ${report.location?.longitude || "N/A"}`);

    // ---------------------------
    // ATTACHED IMAGES
    // ---------------------------
    if (report.images?.length) {
      for (let img of report.images) {
        if (!img?.data) continue;

        const imgPage = pdfDoc.addPage();

        let embedded;
        try {
          if (img.contentType.includes("png")) {
            embedded = await pdfDoc.embedPng(img.data);
          } else {
            embedded = await pdfDoc.embedJpg(img.data);
          }
        } catch (e) {
          continue;
        }

        const dims = embedded.scale(0.4);

        imgPage.drawImage(embedded, {
          x: 50,
          y: 150,
          width: dims.width,
          height: dims.height
        });
      }
    }

    // ---------------------------
    // BILL COPY
    // ---------------------------
    if (report.billCopy?.data) {
      const billPage = pdfDoc.addPage();

      let embedded;
      try {
        if (report.billCopy.contentType.includes("png")) {
          embedded = await pdfDoc.embedPng(report.billCopy.data);
        } else {
          embedded = await pdfDoc.embedJpg(report.billCopy.data);
        }
      } catch {}

      if (embedded) {
        const dims = embedded.scale(0.4);

        billPage.drawImage(embedded, {
          x: 50,
          y: 150,
          width: dims.width,
          height: dims.height
        });
      }
    }

    // ---------------------------
    // SEND PDF
    // ---------------------------
    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${reportId}.pdf`
    );

    return res.end(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("PDF Download Error:", error);

    return res.status(500).json({
      message: "Failed generating report PDF",
      error: error.message
    });
  }
};
