import { Admin, ClientAdmin, ClientUser, Retailer } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ===== Admin Login =====
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

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Add New Admin =====
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only existing admins can add new admins" });

    const existingAdmin = await Admin.findOne({ email });
    const existingClientAdmin = await ClientAdmin.findOne({ email });
    const existingClientUser = await ClientUser.findOne({ email });
    const existingRetailer = await Retailer.findOne({ email });

    if (existingAdmin || existingClientAdmin || existingClientUser || existingRetailer) {
      return res.status(409).json({ message: "Email already exists in the system" });
    }

    const newAdmin = new Admin({
      name,
      email,
      password, // plain password; schema middleware hashes it
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

// ===== Add Client Admin =====
export const addClientAdmin = async (req, res) => {
  try {
    const { name, email, contactNo, organizationName, username, password } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add clients" });

    const existing = await ClientAdmin.findOne({ email });
    if (existing) return res.status(409).json({ message: "Client admin already exists" });

    const newClientAdmin = new ClientAdmin({
      name,
      email,
      contactNo,
      organizationName,
      registrationDetails: { username, password },
      password,
    });

    await newClientAdmin.save();
    res.status(201).json({ message: "Client admin created successfully", clientAdmin: newClientAdmin });
  } catch (error) {
    console.error("Add client admin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Add Client User =====
export const addClientUser = async (req, res) => {
  try {
    const { name, email, contactNo, roleProfile, parentClientAdminId, password } = req.body;

    if (!req.user || req.user.role !== "admin")
      return res.status(403).json({ message: "Only admins can add client users" });

    const existing = await ClientUser.findOne({ email });
    if (existing) return res.status(409).json({ message: "Client user already exists" });

    const newClientUser = new ClientUser({
      name,
      email,
      contactNo,
      roleProfile,
      parentClientAdmin: parentClientAdminId,
      password,
    });

    await newClientUser.save();
    res.status(201).json({ message: "Client user created successfully", clientUser: newClientUser });
  } catch (error) {
    console.error("Add client user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===== Protect Middleware =====
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supremeSecretKey");
    req.user = decoded; 
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
