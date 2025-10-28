import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ClientAdmin, ClientUser, Campaign, Payment } from "../models/user.js";

/* ===========================
   CLIENT ADMIN LOGIN
=========================== */
export const loginClientAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await ClientAdmin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Client Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "client_admin" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   CLIENT USER LOGIN
=========================== */
export const loginClientUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await ClientUser.findOne({ email });
    if (!user) return res.status(404).json({ message: "Client User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: "client_user" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   SET PAYMENT PLAN
=========================== */
export const clientSetPaymentPlan = async (req, res) => {
  try {
    const { campaignId, retailerId, totalAmount, notes } = req.body;

    // Verify campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Check if user is client
    if (!["client_admin", "client_user"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only client admins or users can set payments" });
    }

    // Check retailer is assigned to campaign
    const retailerAssigned = campaign.assignedRetailers.some(r => r.retailerId.toString() === retailerId);
    if (!retailerAssigned) {
      return res.status(400).json({ message: "Retailer not assigned to this campaign" });
    }

    // Create payment
    const payment = await Payment.create({
      retailer: retailerId,
      campaign: campaignId,
      totalAmount,
      amountPaid: 0,
      remainingAmount: totalAmount,
      paymentStatus: "Pending",
      lastUpdatedBy: req.user._id,
      notes,
    });

    res.status(201).json({ message: "Payment plan set successfully", payment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
