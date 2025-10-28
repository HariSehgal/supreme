import jwt from "jsonwebtoken";
import { Employee, Campaign } from "../models/user.js";

/* ===============================
   LOGIN EMPLOYEE
=============================== */
export const loginEmployee = async (req, res) => {
  try {
    const { email, phone } = req.body;

    const employee = await Employee.findOne({
      $or: [{ email }, { phone }],
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
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
      },
    });
  } catch (error) {
    console.error("Employee login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ===============================
   GET EMPLOYEE CAMPAIGNS
=============================== */
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

/* ===============================
   UPDATE CAMPAIGN STATUS
=============================== */
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
export const clientSetPaymentPlan = async (req, res) => {
  try {
    const { campaignId, retailerId, totalAmount, notes, dueDate } = req.body;

    // Only client roles
    if (!req.user || !["client-admin", "client-user"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only client admins or users can set payment plans" });
    }

    // Validate input
    if (!campaignId || !retailerId || !totalAmount) {
      return res.status(400).json({ message: "campaignId, retailerId, and totalAmount are required" });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Check if retailer exists
    const retailer = await Retailer.findById(retailerId);
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });

    // Ensure retailer has accepted the campaign
    const assignedRetailer = campaign.assignedRetailers.find(
      (r) => r.retailerId.toString() === retailerId.toString() && r.status === "accepted"
    );
    if (!assignedRetailer) {
      return res.status(400).json({ message: "Retailer must be assigned and accepted the campaign" });
    }

    // Check if a payment plan already exists for this retailer
    const existingPayment = await Payment.findOne({ campaign: campaignId, retailer: retailerId });
    if (existingPayment) {
      return res.status(400).json({ message: "Payment plan already exists for this retailer" });
    }

    // Create payment plan
    const payment = new Payment({
      campaign: campaignId,
      retailer: retailerId,
      totalAmount,
      amountPaid: 0,
      remainingAmount: totalAmount,
      paymentStatus: "Pending",
      lastUpdatedBy: req.user.id, // client admin/user who created
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