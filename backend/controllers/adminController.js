import {
  Admin,
  ClientAdmin,
  ClientUser,
  Retailer,
  Employee,
  Campaign,
} from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import XLSX from "xlsx";

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
    const { name, email, contactNo, organizationName, password } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client admins" });

    if (!name || !email || !organizationName || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await ClientAdmin.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Client admin already exists" });

    const hashedPass = await bcrypt.hash(password, 10);

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
    const { name, email, contactNo, gender, address, dob } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add employees" });

    if (!name || !email || !contactNo)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await Employee.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Employee already exists" });

    const newEmployee = new Employee({
      name,
      email,
      phone: contactNo,
      gender,
      address,
      dob,
      organization: req.user.id,
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee added successfully", employee: newEmployee });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({ message: "Server error" });
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

      await Retailer.findByIdAndUpdate(retId, {
        $addToSet: { assignedCampaigns: campaign._id },
      });
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
