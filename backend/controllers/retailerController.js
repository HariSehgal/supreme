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
   REGISTER RETAILER (with phone OTP)
=============================== */
export const registerRetailer = async (req, res) => {
  try {
    const body = req.body;
    const files = req.files || {};
    const { contactNo, email } = body;

    if (!email || !contactNo)
      return res.status(400).json({ message: "Email and contact number are required" });

    // Must have verified OTP before registration
    if (otpStore.has(contactNo)) {
      return res.status(400).json({ message: "Please verify your phone number before registration" });
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
    const { contactNo } = req.body;
    if (!contactNo)
      return res.status(400).json({ message: "Phone number required" });

    const retailer = await Retailer.findOne({ contactNo });
    if (!retailer)
      return res.status(400).json({ message: "Retailer not found" });
    if (!retailer.phoneVerified)
      return res.status(400).json({ message: "Phone not verified" });

    const token = jwt.sign(
      { id: retailer._id, contactNo: retailer.contactNo, role: "retailer" },
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
    console.error("Login error:", error);
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
    if (!retailer)
      return res.status(404).json({ message: "Retailer not found" });

    res.status(200).json(retailer);
  } catch (error) {
    console.error("Get retailer error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* ===============================
   GET ALL CAMPAIGNS (JWT Protected)
=============================== */
export const getAllCampaigns = async (req, res) => {
  try {
    // JWT-protected: req.retailer added by auth middleware
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json({ message: "Campaigns fetched successfully", campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
