import { Retailer, Campaign } from "../models/user.js";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

// ===============================
// Twilio Configuration
// ===============================
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Temporary in-memory store for OTPs with expiry
const otpStore = new Map();

/* ===============================
   SEND OTP (Phone only)
=============================== */
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

    await client.messages.create({
      body: `Your verification code is ${otp}`,
      from: fromNumber,
      to: phone.startsWith("+") ? phone : `+91${phone}`,
    });

    console.log(`✅ OTP sent to ${phone}: ${otp}`);
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP send error:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

/* ===============================
   VERIFY OTP
=============================== */
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: "Phone number and OTP required" });

    const record = otpStore.get(phone);
    if (!record) return res.status(400).json({ message: "No OTP found for this number" });
    if (Date.now() > record.expires) {
      otpStore.delete(phone);
      return res.status(400).json({ message: "OTP expired" });
    }
    if (record.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    otpStore.delete(phone);
    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ===============================
   REGISTER RETAILER
=============================== */
export const registerRetailer = async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};
    const { contactNo, email } = body;

    if (!email || !contactNo)
      return res.status(400).json({ message: "Email and contact number are required" });

    // Must verify OTP before registration
    if (otpStore.has(contactNo)) {
      return res
        .status(400)
        .json({ message: "Please verify your phone number before registration" });
    }

    const personalAddress = {
      address: body.address,
      city: body.city,
      state: body.state,
      geoTags: {
        lat: parseFloat(body.geoTags?.lat) || 0,
        lng: parseFloat(body.geoTags?.lng) || 0,
      },
    };

    const shopAddress = {
      address: body["shopDetails.shopAddress.address"] || body.shopAddress,
      city: body["shopDetails.shopAddress.city"] || body.shopCity,
      state: body["shopDetails.shopAddress.state"] || body.shopState,
      geoTags: {
        lat: parseFloat(body["shopDetails.shopAddress.geoTags.lat"]) || 0,
        lng: parseFloat(body["shopDetails.shopAddress.geoTags.lng"]) || 0,
      },
    };

    const shopDetails = {
      shopName: body["shopDetails.shopName"] || body.shopName,
      businessType: body["shopDetails.businessType"] || body.businessType,
      ownershipType: body["shopDetails.ownershipType"] || body.ownershipType,
      dateOfEstablishment: body["shopDetails.dateOfEstablishment"] || body.dateOfEstablishment,
      GSTNo: body["shopDetails.GSTNo"] || body.GSTNo,
      PANCard: body["shopDetails.PANCard"] || body.PANCard,
      shopAddress,
      outletPhoto: files.outletPhoto
        ? { data: files.outletPhoto[0].buffer, contentType: files.outletPhoto[0].mimetype }
        : undefined,
    };

    const bankDetails = {
      bankName: body["bankDetails.bankName"] || body.bankName,
      accountNumber: body["bankDetails.accountNumber"] || body.accountNumber,
      IFSC: body["bankDetails.IFSC"] || body.IFSC,
      branchName: body["bankDetails.branchName"] || body.branchName,
    };

    const existingRetailer = await Retailer.findOne({
      $or: [{ contactNo }, { email }],
    });
    if (existingRetailer)
      return res.status(400).json({ message: "Phone or email already registered" });

    const retailer = new Retailer({
      name: body.name,
      contactNo,
      email,
      dob: body.dob,
      gender: body.gender,
      govtIdType: body.govtIdType,
      govtIdNumber: body.govtIdNumber,
      govtIdPhoto: files.govtIdPhoto
        ? { data: files.govtIdPhoto[0].buffer, contentType: files.govtIdPhoto[0].mimetype }
        : undefined,
      personPhoto: files.personPhoto
        ? { data: files.personPhoto[0].buffer, contentType: files.personPhoto[0].mimetype }
        : undefined,
      signature: files.signature
        ? { data: files.signature[0].buffer, contentType: files.signature[0].mimetype }
        : undefined,
      personalAddress,
      shopDetails,
      bankDetails,
      partOfIndia: body.partOfIndia || "N",
      createdBy: body.createdBy || "RetailerSelf",
      phoneVerified: true,
    });

    await retailer.save();

    res.status(201).json({
      message: "Retailer registered successfully",
      uniqueId: retailer.uniqueId,
    });
  } catch (error) {
    console.error("Retailer registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ===============================
   LOGIN RETAILER (Phone only)
=============================== */
export const loginRetailer = async (req, res) => {
  try {
    const { contactNo, email } = req.body;

    // ✅ Both required
    if (!contactNo || !email) {
      return res.status(400).json({
        message: "Email and phone number are both required",
      });
    }

    // ✅ Find retailer using both fields
    const retailer = await Retailer.findOne({
      email,
      contactNo,
    });

    if (!retailer)
      return res.status(400).json({ message: "Retailer not found" });

    if (!retailer.phoneVerified)
      return res.status(400).json({ message: "Phone not verified" });

    // ✅ Ensure JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET missing in environment variables");
      return res.status(500).json({ message: "Server configuration error" });
    }

    // ✅ JWT
    const token = jwt.sign(
      {
        id: retailer._id,
        contactNo: retailer.contactNo,
        email: retailer.email,
        role: "retailer",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      retailer: {
        id: retailer._id,
        name: retailer.name,
        uniqueId: retailer.uniqueId,
        contactNo: retailer.contactNo,
        email: retailer.email,
      },
    });
  } catch (error) {
    console.error("Retailer login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* ===============================
   GET RETAILER PROFILE
=============================== */
export const getRetailerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const retailer = await Retailer.findById(id).select("-password");
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });

    res.status(200).json(retailer);
  } catch (error) {
    console.error("Get retailer error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ===============================
   GET CAMPAIGNS ASSIGNED TO RETAILER
=============================== */
export const getRetailerCampaigns = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const retailer = await Retailer.findById(decoded.id).populate("assignedCampaigns");
    if (!retailer) return res.status(404).json({ message: "Retailer not found" });

    res.status(200).json({
      message: "Campaigns fetched successfully",
      retailer: {
        id: retailer._id,
        name: retailer.name,
        uniqueId: retailer.uniqueId,
      },
      campaigns: retailer.assignedCampaigns, // already populated
    });
  } catch (error) {
    console.error("Get retailer campaigns error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


/* ===============================
   ACCEPT OR REJECT A CAMPAIGN
=============================== */

export const updateCampaignStatus = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const retailerId = decoded.id;
    const { campaignId } = req.params;
    let { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status is required" });

    status = status.toString().trim().toLowerCase();
    if (!["accepted", "rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status value" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (!Array.isArray(campaign.assignedRetailers) || campaign.assignedRetailers.length === 0)
      return res.status(400).json({ message: "No retailers assigned to this campaign" });

    // Find the retailer entry
    const retailerEntry = campaign.assignedRetailers.find(
      r => r.retailerId?.toString() === retailerId.toString()
    );

    if (!retailerEntry)
      return res.status(403).json({ message: "You are not assigned to this campaign" });

    // Update status and timestamp
    retailerEntry.status = status;
    retailerEntry.updatedAt = new Date();

    await campaign.save();

    res.status(200).json({
      message: `Campaign ${status} successfully`,
      campaignId,
      retailerStatus: status,
    });
  } catch (error) {
    console.error("Update campaign status error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
/* ===============================
   RETAILER: VIEW PAYMENT STATUS
=============================== */
export const getRetailerCampaignPayments = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const retailerId = decoded.id;

    const payments = await Payment.find({ retailer: retailerId }).populate("campaign", "name _id");

    if (!payments || payments.length === 0)
      return res.status(404).json({ message: "No payments found" });

    const formatted = payments.map((p) => ({
      campaignId: p.campaign._id,
      campaignName: p.campaign.name,
      totalAmount: p.totalAmount,
      amountPaid: p.amountPaid,
      remainingAmount: Math.max(p.totalAmount - p.amountPaid, 0),
      dueDate: p.dueDate,
      utrNumber: p.utrNumber || "Pending",
      paymentStatus: p.paymentStatus,
      lastUpdated: p.updatedAt,
    }));

    res.status(200).json({ payments: formatted });
  } catch (error) {
    console.error("Error fetching retailer payments:", error);
    res.status(500).json({ message: "Error fetching retailer payments", error });
  }
};
