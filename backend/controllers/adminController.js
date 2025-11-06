import {
  Admin,
  ClientAdmin,
  ClientUser,
  Retailer,
  Employee,
  Campaign,
  Payment 

} from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import XLSX from "xlsx";
import { CareerApplication,Job, JobApplication } from "../models/user.js";
/* ======================================================
   ADMIN LOGIN
====================================================== */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Admin login successful",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ADD NEW ADMIN
====================================================== */
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only existing admins can add new admins" });

    const existing =
      (await Admin.findOne({ email })) ||
      (await ClientAdmin.findOne({ email })) ||
      (await ClientUser.findOne({ email })) ||
      (await Retailer.findOne({ email }));

    if (existing)
      return res.status(409).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ name, email, password: hashedPassword });

    await newAdmin.save();
    res.status(201).json({ message: "New admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ADD CLIENT ADMIN
====================================================== */
export const addClientAdmin = async (req, res) => {
  try {
    const { name, email, contactNo, organizationName } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client admins" });

    if (!name || !email || !organizationName || !contactNo)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await ClientAdmin.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Client admin already exists" });

    //  Password = contactNo (phone number)
    const hashedPass = await bcrypt.hash(contactNo.toString(), 10);

    const newClientAdmin = new ClientAdmin({
      name,
      email,
      contactNo,
      organizationName,
      password: hashedPass,
      registrationDetails: {
        username: email,
        password: hashedPass,
      },
    });

    await newClientAdmin.save();

    res.status(201).json({
      message: "Client admin created successfully",
      clientAdmin: newClientAdmin,
    });
  } catch (error) {
    console.error("Add client admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ======================================================
   ADD CLIENT USER
====================================================== */
export const addClientUser = async (req, res) => {
  try {
    const {
      name,
      email,
      contactNo,
      roleProfile,
      parentClientAdminId,
      password,
    } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client users" });

    if (!name || !email || !parentClientAdminId || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await ClientUser.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Client user already exists" });

    const hashedPass = await bcrypt.hash(password, 10);

    const newClientUser = new ClientUser({
      name,
      email,
      contactNo,
      roleProfile,
      parentClientAdmin: parentClientAdminId,
      password: hashedPass,
    });

    await newClientUser.save();
    res.status(201).json({
      message: "Client user created successfully",
      clientUser: newClientUser,
    });
  } catch (error) {
    console.error("Add client user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   CLIENT ADMIN LOGIN
====================================================== */
export const loginClientAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const clientAdmin = await ClientAdmin.findOne({ email });
    if (!clientAdmin)
      return res.status(404).json({ message: "Client admin not found" });

    const isMatch = await bcrypt.compare(password, clientAdmin.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: clientAdmin._id, email: clientAdmin.email, role: "client-admin" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Client admin login successful",
      token,
      clientAdmin: {
        id: clientAdmin._id,
        name: clientAdmin.name,
        email: clientAdmin.email,
        organizationName: clientAdmin.organizationName,
      },
    });
  } catch (error) {
    console.error("Client admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   PROTECT MIDDLEWARE
====================================================== */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ message: "Not authorized" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supremeSecretKey");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* ======================================================
   CAMPAIGN MANAGEMENT
====================================================== */
export const addCampaign = async (req, res) => {
  try {
    const {
      name,
      client,
      type,
      region,
      state,
    } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can create campaigns" });

    if (!name || !client || !type || !region || !state)
      return res.status(400).json({ message: "All fields are required" });

    const campaign = new Campaign({
      name,
      client,
      type,
      region,
      state,
      createdBy: req.user.id,
    });

    await campaign.save();
    res.status(201).json({ message: "Campaign created successfully", campaign });
  } catch (error) {
    console.error("Add campaign error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find()
      .populate("createdBy", "name email")
      .populate("assignedEmployees", "name email")
      .populate("assignedRetailers", "name contactNo");

    res.status(200).json({ campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can delete campaigns" });

    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign)
      return res.status(404).json({ message: "Campaign not found" });

    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   EMPLOYEE MANAGEMENT
====================================================== */
export const addEmployee = async (req, res) => {
  try {
    const { name, email, contactNo, gender, address, dob, employeeType } = req.body;

  
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add employees" });
    }

   
    if (!name || !email || !contactNo) {
      return res.status(400).json({ message: "All fields are required" });
    }

  
    const existing = await Employee.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Employee already exists" });
    }

    let validEmployeeType = null;
    if (employeeType && ["Permanent", "Contractual"].includes(employeeType)) {
      validEmployeeType = employeeType;
    }

    
    const newEmployee = new Employee({
      name,
      email,
      phone: contactNo,
      gender,
      address,
      dob,
      password: contactNo, 
      createdByAdmin: req.user.id,
      employeeType: validEmployeeType,
    });

    await newEmployee.save();

    res.status(201).json({
      message: "Employee added successfully",
      employee: {
        id: newEmployee._id,
        name: newEmployee.name,
        email: newEmployee.email,
        phone: newEmployee.phone,
        employeeType: newEmployee.employeeType,
      },
    });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   BULK ADD EMPLOYEES FROM EXCEL
====================================================== */
export const bulkAddEmployees = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add employees" });

    if (!req.file)
      return res.status(400).json({ message: "Excel/CSV file is required" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    const employeesToInsert = [];

    for (let row of data) {
      const { name, email, contactNo, gender, address } = row;
      if (!name || !email || !contactNo) continue;

      const exists = await Employee.findOne({ email });
      if (exists) continue;

      const hashedPassword = await bcrypt.hash(contactNo.toString(), 10);

      employeesToInsert.push({
        name,
        email,
        phone: contactNo,
        gender,
        address,
        password: hashedPassword,
        organization: req.user.id,
      });
    }

    if (employeesToInsert.length === 0)
      return res.status(400).json({ message: "No valid employees to add" });

    const insertedEmployees = await Employee.insertMany(employeesToInsert);

    res.status(201).json({
      message: `${insertedEmployees.length} employees added successfully`,
      employees: insertedEmployees,
    });
  } catch (error) {
    console.error("Bulk add employees error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//single admin

export const getSingleAdminJob = async (req, res) => {
  try {
    // ✅ Ensure user is logged in
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Not authorized, please log in" });

    // ✅ Verify user exists in Admin collection
    const admin = await Admin.findById(req.user.id);
    if (!admin)
      return res.status(403).json({ message: "Only registered admins can view job details" });

    const { id } = req.params;

    // ✅ Find the job (allow all jobs if multiple admins manage jobs)
    const job = await Job.findById(id);

    if (!job)
      return res.status(404).json({ message: "Job not found" });

    res.status(200).json({ job });
  } catch (error) {
    console.error("Get single admin job error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ======================================================
   ASSIGN CAMPAIGN TO EMPLOYEES & RETAILERS
====================================================== */
export const assignCampaign = async (req, res) => {
  try {
    const { campaignId, employeeIds = [], retailerIds = [] } = req.body;

    // Ensure only admins can assign campaigns
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can assign campaigns" });

    if (!campaignId)
      return res.status(400).json({ message: "Campaign ID is required" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Initialize arrays if undefined
    campaign.assignedEmployees = campaign.assignedEmployees || [];
    campaign.assignedRetailers = campaign.assignedRetailers || [];

    // ======================
    // Assign Employees
    // ======================
    for (const empId of employeeIds) {
      if (!empId) continue;

      // Check if already assigned (works for both objects and plain ObjectIds)
      const existingIndex = campaign.assignedEmployees.findIndex(e => {
        const id = e.employeeId ? e.employeeId : e;
        return id.toString() === empId.toString();
      });

      if (existingIndex === -1) {
        // Not assigned yet — add as object with default status
        campaign.assignedEmployees.push({
          employeeId: empId,
          status: "pending",
          assignedAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Already assigned but may be a plain ObjectId — normalize
        const entry = campaign.assignedEmployees[existingIndex];
        if (!entry.employeeId) {
          campaign.assignedEmployees[existingIndex] = {
            employeeId: entry,
            status: "pending",
            assignedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      // Link campaign in Employee model
      await Employee.findByIdAndUpdate(empId, {
        $addToSet: { assignedCampaigns: campaign._id },
      });
    }

    // ======================
    // Assign Retailers
    // ======================
    for (const retId of retailerIds) {
      if (!retId) continue;

      const existingIndex = campaign.assignedRetailers.findIndex(r => {
        const id = r.retailerId ? r.retailerId : r;
        return id.toString() === retId.toString();
      });

      if (existingIndex === -1) {
        campaign.assignedRetailers.push({
          retailerId: retId,
          status: "pending",
          assignedAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const entry = campaign.assignedRetailers[existingIndex];
        if (!entry.retailerId) {
          campaign.assignedRetailers[existingIndex] = {
            retailerId: entry,
            status: "pending",
            assignedAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      // Link campaign in Retailer model
      await Retailer.findByIdAndUpdate(retId, {
        $addToSet: { assignedCampaigns: campaign._id },
      });

      // ===== Create Payment document if not exists =====
      const existingPayment = await Payment.findOne({
        campaign: campaign._id,
        retailer: retId,
      });

      if (!existingPayment) {
        await Payment.create({
          campaign: campaign._id,
          retailer: retId,
          totalAmount: 0,      // default total amount (can be updated later)
          amountPaid: 0,
          paymentStatus: "Pending",
        });
      }
    }

    await campaign.save();

    res.status(200).json({
      message: "Campaign assigned successfully",
      campaign,
    });
  } catch (error) {
    console.error("Assign campaign error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//update the campaign
export const updateCampaignStatus = async (req, res) => {
  try {
    // ✅ Only admin can update
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can update campaign status",
      });
    }

    const { id } = req.params;
    let { isActive } = req.body;

    //  Check field exists
    if (isActive === undefined || isActive === null) {
      return res.status(400).json({
        message: "isActive field is required (true/false)",
      });
    }

    //  Convert string to boolean if needed
    if (typeof isActive === "string") {
      isActive = isActive.toLowerCase() === "true";
    }

    //  Find campaign
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    //  Update and save
    campaign.isActive = isActive;
    await campaign.save();

    return res.status(200).json({
      message: `Campaign has been ${isActive ? "activated" : "deactivated"} successfully`,
      campaign,
    });

  } catch (error) {
    console.error("Update campaign status error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* ======================================================
   FETCH ALL EMPLOYEES
====================================================== */
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("_id name email");
    res.status(200).json({ employees });
  } catch (err) {
    console.error("Get employees error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   FETCH ALL RETAILERS
====================================================== */
export const getAllRetailers = async (req, res) => {
  try {
    const retailers = await Retailer.find().select("_id name contactNo");
    res.status(200).json({ retailers });
  } catch (err) {
    console.error("Get retailers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
/* ======================================================
   ADMIN UPDATES PAYMENT PROGRESS & UTR
====================================================== */
export const updateCampaignPayment = async (req, res) => {
  try {
    const { campaignId, retailerId, amountPaid, utrNumber } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can update payments" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const assignedRetailer = campaign.assignedRetailers.find(
      (r) => r.retailerId.toString() === retailerId.toString()
    );

    if (!assignedRetailer || assignedRetailer.status !== "accepted")
      return res.status(400).json({
        message: "Retailer has not accepted this campaign yet",
      });

    const payment = await Payment.findOne({ campaign: campaignId, retailer: retailerId });
    if (!payment) return res.status(404).json({ message: "Payment plan not found" });

    // Update amountPaid
    if (amountPaid !== undefined) {
      payment.amountPaid += amountPaid; // add the new payment
    }

    // Track UTR numbers as an array
    if (utrNumber) {
      payment.utrNumbers = payment.utrNumbers || [];
      payment.utrNumbers.push({
        utrNumber,
        amount: amountPaid || 0,
        date: new Date(),
        updatedBy: req.user._id,
      });
    }

    // Update remaining amount
    payment.remainingAmount = payment.totalAmount - payment.amountPaid;
    payment.lastUpdatedByAdmin = req.user._id;

    // Update payment status
    if (payment.amountPaid === 0) {
      payment.paymentStatus = "Pending";
    } else if (payment.amountPaid < payment.totalAmount) {
      payment.paymentStatus = "Partially Paid";
    } else {
      payment.paymentStatus = "Completed";
    }

    await payment.save();

    res.status(200).json({
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Error updating campaign payment:", error);
    res.status(500).json({ message: error.message });
  }
};
export const registerRetailer = async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};

    const { contactNo, email } = body;

    if (!email || !contactNo) {
      return res.status(400).json({
        message: "Email and contact number are required",
      });
    }

    /* ======================================================
       1️⃣ CHECK FOR EXISTING EMAIL / PHONE
    ====================================================== */
    const existingRetailer = await Retailer.findOne({
      $or: [{ contactNo }, { email }],
    });

    if (existingRetailer) {
      return res.status(400).json({
        message: "Phone number or email already registered",
      });
    }

    /* ======================================================
       2️⃣ BUILD ADDRESS, SHOP DETAILS, BANK DETAILS
    ====================================================== */
    const personalAddress = {
      address: body.address,
      city: body.city,
      state: body.state,
      geoTags: {
        lat: parseFloat(body["geoTags.lat"]) || 0,
        lng: parseFloat(body["geoTags.lng"]) || 0,
      },
    };

    const shopAddress = {
      address: body["shopDetails.shopAddress.address"] || body.address,
      address2: body.address2 || "",
      city: body["shopDetails.shopAddress.city"] || body.city,
      state: body["shopDetails.shopAddress.state"] || body.state,
      pincode: body.pincode,
      geoTags: {
        lat: parseFloat(body["shopDetails.shopAddress.geoTags.lat"]) || 0,
        lng: parseFloat(body["shopDetails.shopAddress.geoTags.lng"]) || 0,
      },
    };

    const shopDetails = {
      shopName: body["shopDetails.shopName"] || body.shopName,
      businessType: body["shopDetails.businessType"] || body.businessType,
      ownershipType: body["shopDetails.ownershipType"] || body.ownershipType,
      GSTNo: body["shopDetails.GSTNo"] || body.GSTNo,
      PANCard: body["shopDetails.PANCard"] || body.PANCard,
      dateOfEstablishment:
        body["shopDetails.dateOfEstablishment"] || body.dateOfEstablishment,
      shopAddress,
      outletPhoto: files.outletPhoto
        ? {
            data: files.outletPhoto[0].buffer,
            contentType: files.outletPhoto[0].mimetype,
          }
        : undefined,
    };

    const bankDetails = {
      bankName: body["bankDetails.bankName"] || body.bankName,
      accountNumber: body["bankDetails.accountNumber"] || body.accountNumber,
      IFSC: body["bankDetails.IFSC"] || body.IFSC,
      branchName: body["bankDetails.branchName"] || body.branchName,
    };

    /* ======================================================
       3️⃣ CREATE RETAILER OBJECT
    ====================================================== */
    const retailer = new Retailer({
      name: body.name,
      contactNo,
      email,
      dob: body.dob,
      gender: body.gender,
      govtIdType: body.govtIdType,
      govtIdNumber: body.govtIdNumber,

      govtIdPhoto: files.govtIdPhoto
        ? {
            data: files.govtIdPhoto[0].buffer,
            contentType: files.govtIdPhoto[0].mimetype,
          }
        : undefined,

      personPhoto: files.personPhoto
        ? {
            data: files.personPhoto[0].buffer,
            contentType: files.personPhoto[0].mimetype,
          }
        : undefined,

      registrationForm: files.registrationForm
        ? {
            data: files.registrationForm[0].buffer,
            contentType: files.registrationForm[0].mimetype,
          }
        : undefined,

      shopDetails,
      bankDetails,
      personalAddress,

      createdBy: body.createdBy || "AdminAdded",
      phoneVerified: true,
      partOfIndia: body.partOfIndia || "N",
    });

    /* ======================================================
       4️⃣ SAVE WITH E11000 (duplicate key) HANDLING
    ====================================================== */
    try {
      await retailer.save();
    } catch (err) {
      if (err.code === 11000) {
        const dupField = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          message: `${dupField} already exists`,
          duplicateField: dupField,
          value: err.keyValue[dupField],
        });
      }
      throw err;
    }

    /* ======================================================
       ✅ SUCCESS
    ====================================================== */
    res.status(201).json({
      message: "Retailer registered successfully",
      uniqueId: retailer.uniqueId,
    });
  } catch (error) {
    console.error("Retailer registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   ADMIN FETCHES ALL PAYMENTS FOR A CAMPAIGN
====================================================== */
export const getCampaignPayments = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const payments = await Payment.find({ campaign: campaignId })
      .populate("retailer", "name email")
      .populate("createdByClient", "name")
      .populate("lastUpdatedByAdmin", "name")
      .sort({ updatedAt: -1 });

    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ======================================================
   CREATE JOB POSTING (admin)
   POST /admin/career/jobs
   body: { title, description, location, salaryRange?, experienceRequired?, employmentType?, totalRounds? }
====================================================== */
export const createJobPosting = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can create job postings" });

    const { title, description, location, salaryRange, experienceRequired, employmentType, totalRounds } = req.body;
    if (!title || !description || !location)
      return res.status(400).json({ message: "title, description and location are required" });

    const job = new Job({
      title,
      description,
      location,
      salaryRange,
      experienceRequired,
      employmentType,
      totalRounds: totalRounds || 1,
      createdBy: req.user.id,
      isActive: true,
    });

    await job.save();
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    console.error("Create job posting error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   Get jobs created by admin
   GET /admin/career/jobs
====================================================== */
export const getAdminJobs = async (req, res) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Not authorized, please log in" });

    const admin = await Admin.findById(req.user.id);
    if (!admin)
      return res.status(403).json({ message: "Only registered admins can view jobs" });

 
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error("Get admin jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ======================================================
   Update or Change Status of a Job Posting
   PUT /admin/career/jobs/:id
   Body: { title?, description?, location?, salaryRange?, experienceRequired?, employmentType?, isActive? }
====================================================== */
export const updateJobPosting = async (req, res) => {
  try {
    if (!req.user || !req.user.id)
      return res.status(401).json({ message: "Not authorized, please log in" });

    const { id } = req.params;
    const {
      title,
      description,
      location,
      salaryRange,
      experienceRequired,
      employmentType,
      isActive,
    } = req.body;

    // ✅ Find by ID only (remove createdBy restriction if single admin)
    const job = await Job.findById(id);

    if (!job) return res.status(404).json({ message: "Job not found" });

    // ✅ Update fields dynamically
    Object.assign(job, {
      ...(title && { title }),
      ...(description && { description }),
      ...(location && { location }),
      ...(salaryRange && { salaryRange }),
      ...(experienceRequired && { experienceRequired }),
      ...(employmentType && { employmentType }),
      ...(isActive !== undefined && { isActive }),
    });

    await job.save();

    res.status(200).json({ message: "Job updated successfully", job });
  } catch (error) {
    console.error("Update job posting error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};
/* ======================================================
   Get applications for a specific job (admin)
   GET /admin/career/jobs/:jobId/applications
====================================================== */
export const getJobApplications = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can view applications" });

    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.createdBy.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized to view applications for this job" });

    const applications = await JobApplication.find({ job: jobId })
      .populate("candidate", "fullName email phoneNumber")
      .sort({ appliedAt: -1 });

    res.status(200).json({ applications });
  } catch (error) {
    console.error("Get job applications error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   Update application status / round (admin)
   PUT /admin/career/applications/:applicationId
   body: { status?, currentRound? }
====================================================== */

/* ======================================================
   UPDATE APPLICATION STATUS (ADMIN)
   PATCH /api/admin/applications/:id/status
====================================================== */
/* ======================================================
   UPDATE APPLICATION STATUS (ADMIN)
   PATCH /api/admin/applications/:id/status
====================================================== */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params; // Application ID
    const { status, currentRound } = req.body;

    // Role check
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can update application status" });
    }

    // Fetch application with candidate + job info
    const application = await JobApplication.findById(id)
      .populate("candidate", "fullName email")
      .populate("job", "title totalRounds");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update application fields
    if (status) application.status = status;
    if (currentRound !== undefined) {
      if (currentRound > application.totalRounds)
        return res.status(400).json({ message: "Current round exceeds total rounds" });
      application.currentRound = currentRound;
    }

    application.updatedAt = new Date();
    await application.save();

    // Send status update email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Supreme Careers" <${process.env.EMAIL_USER}>`,
      to: application.candidate.email,
      subject: `Application Update for ${application.job.title}`,
      html: `
        <p>Hi ${application.candidate.fullName},</p>
        <p>Your application status for the position of <b>${application.job.title}</b> has been updated.</p>
        <p><b>Status:</b> ${application.status}</p>
        ${
          currentRound
            ? `<p><b>Current Round:</b> ${application.currentRound} / ${application.totalRounds}</p>`
            : ""
        }
        <p>Thank you for your continued interest.</p>
        <p>Best regards,<br>Supreme Careers Team</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "Application status updated successfully and email sent",
      application,
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ======================================================
   MAP JOBS TO APPLICATIONS FUNCTION
====================================================== */
export const mapJobToApplications = async (jobId = null) => {
  try {
    if (jobId) {
      const applications = await JobApplication.find({ job: jobId }).select("_id");
      await Job.findByIdAndUpdate(jobId, {
        applications: applications.map((a) => a._id),
      });
      return { message: "Applications mapped to the specified job", jobId };
    }

    const jobs = await Job.find({}, "_id");
    for (const job of jobs) {
      const applications = await JobApplication.find({ job: job._id }).select("_id");
      await Job.findByIdAndUpdate(job._id, {
        applications: applications.map((a) => a._id),
      });
    }

    return { message: "All jobs mapped successfully" };
  } catch (error) {
    console.error("Error mapping jobs to applications:", error);
    throw new Error("Job-Application mapping failed");
  }
};

/* ======================================================
   MANUAL MAPPING ENDPOINT (ADMIN)
====================================================== */
export const syncJobApplications = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin")
      return res
        .status(403)
        .json({ message: "Only admins can perform this action" });

    const { jobId } = req.params;
    const result = await mapJobToApplications(jobId || null);
    res.status(200).json(result);
  } catch (error) {
    console.error("Sync job applications error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Admin download candidate resume
   GET /admin/career/applications/:applicationId/resume
====================================================== */
export const getCandidateResume = async (req, res) => {
  try {
   
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can access resumes" });
    }

    
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    
    const candidateId = application.candidate;
    if (!candidateId) {
      return res.status(404).json({ message: "Candidate not linked to this application" });
    }

    
    const candidate = await CareerApplication.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate record not found" });
    }

   
    const resume = candidate.resume;
    if (!resume?.data || !resume?.contentType) {
      return res.status(404).json({ message: "Resume not uploaded or unavailable" });
    }


    const ext = resume.contentType.split("/")[1] || "pdf";
    const filename = resume.fileName
      ? resume.fileName
      : `${candidate.fullName.replace(/\s+/g, "_")}_Resume.${ext}`;

    res.set({
      "Content-Type": resume.contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    });

   
    return res.send(resume.data);
  } catch (error) {
    console.error("Error fetching candidate resume:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
/* ======================================================
   ADMIN FORGOT PASSWORD
   POST /api/admin/forgot-password
====================================================== */
/* ======================================================
   ADMIN FORGOT PASSWORD (OTP SEND)
   POST /api/admin/forgot-password
====================================================== */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    admin.resetPasswordToken = hashedOtp;
    admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
    await admin.save();

    // Email setup (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"Supreme Admin Support" <${process.env.EMAIL_USER}>`,
      to: admin.email,
      subject: "Your OTP for Password Reset",
      html: `
        <p>Hi ${admin.name || "Admin"},</p>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully to registered email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ADMIN RESET PASSWORD (OTP VERIFY)
   POST /api/admin/reset-password
====================================================== */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "Email, OTP, and new password are required" });

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Hash the provided OTP to compare
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    if (
      admin.resetPasswordToken !== hashedOtp ||
      admin.resetPasswordExpires < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    // Clear OTP fields
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;

    await admin.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
