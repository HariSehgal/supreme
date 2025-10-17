import { Admin, ClientAdmin, ClientUser, Retailer, Campaign } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role || "admin" },
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
    ADD NEW ADMIN (only existing admin can do)
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

    if (existing) return res.status(409).json({ message: "Email already exists" });

    const newAdmin = new Admin({
      name,
      email,
      password,
      role: "admin",
      _adminKey: process.env.ADMIN_CREATION_KEY,
    });

    await newAdmin.save();
    res.status(201).json({ message: "New admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("Add admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ADD CLIENT ADMIN (only admins)
====================================================== */
export const addClientAdmin = async (req, res) => {
  try {
    const { name, email, contactNo, organizationName, password } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client admins" });

    if (!name || !email || !organizationName || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await ClientAdmin.findOne({ email });
    if (existing) return res.status(409).json({ message: "Client admin already exists" });

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
    ADD CLIENT USER (only admins)
====================================================== */
export const addClientUser = async (req, res) => {
  try {
    const { name, email, contactNo, roleProfile, parentClientAdminId, password } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client users" });

    if (!name || !email || !parentClientAdminId || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const existing = await ClientUser.findOne({ email });
    if (existing) return res.status(409).json({ message: "Client user already exists" });

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
    res.status(201).json({ message: "Client user created successfully", clientUser: newClientUser });
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
    if (!clientAdmin) return res.status(404).json({ message: "Client admin not found" });

    const isMatch = await bcrypt.compare(password, clientAdmin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

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
    CAMPAIGN MANAGEMENT (only admins)
====================================================== */

// Add new campaign
export const addCampaign = async (req, res) => {
  try {
    const { name, client, type, region, state } = req.body;

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

// Get all campaigns
export const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("createdBy", "name email");
    res.status(200).json({ campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a campaign
export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can delete campaigns" });

    const campaign = await Campaign.findByIdAndDelete(id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    res.status(200).json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Delete campaign error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
