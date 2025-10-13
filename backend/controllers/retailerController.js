import { Retailer } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * @desc Register new retailer
 * @route POST /api/retailer/register
 * @access Public
 */
export const registerRetailer = async (req, res) => {
  try {
    const {
      name,
      contactNo,
      email,
      address,
      dob,
      gender,
      govtIdType,
      govtIdNumber,
      shopName,
      businessType,
      ownershipType,
      dateOfEstablishment,
      GSTNo,
      PANCard,
      bankName,
      accountNumber,
      IFSC,
      branchName,
      state,
      city,
      partOfIndia, // N/E/W/S
      createdBy, // RetailerSelf or Employee
      password,
    } = req.body;

    // Check existing email
    const existingRetailer = await Retailer.findOne({ email });
    if (existingRetailer) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Handle uploaded files (from Multer)
    const files = req.files || {};
    const govtIdPhoto = files.govtIdPhoto?.[0];
    const personPhoto = files.personPhoto?.[0];
    const signature = files.signature?.[0];
    const outletPhoto = files.outletPhoto?.[0];

    // Create new retailer
    const retailer = new Retailer({
      name,
      contactNo,
      email,
      address,
      dob,
      gender,
      govtIdType,
      govtIdNumber,
      govtIdPhoto: govtIdPhoto
        ? {
            data: govtIdPhoto.buffer,
            contentType: govtIdPhoto.mimetype,
          }
        : undefined,
      personPhoto: personPhoto
        ? {
            data: personPhoto.buffer,
            contentType: personPhoto.mimetype,
          }
        : undefined,
      signature: signature
        ? {
            data: signature.buffer,
            contentType: signature.mimetype,
          }
        : undefined,
      shopDetails: {
        shopName,
        businessType,
        ownershipType,
        dateOfEstablishment,
        GSTNo,
        PANCard,
        shopAddress: {
          address,
          geoTags: { lat: 0, lng: 0 }, // optional future geo tag
          state,
          city,
        },
        outletPhoto: outletPhoto
          ? {
              data: outletPhoto.buffer,
              contentType: outletPhoto.mimetype,
            }
          : undefined,
      },
      bankDetails: {
        bankName,
        accountNumber,
        IFSC,
        branchName,
      },
      partOfIndia: partOfIndia || "N",
      createdBy: createdBy || "RetailerSelf",
      password,
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

/**
 * @desc Login retailer
 * @route POST /api/retailer/login
 * @access Public
 */
export const loginRetailer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const retailer = await Retailer.findOne({ email });
    if (!retailer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, retailer.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: retailer._id, email: retailer.email, role: "retailer" },
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
        email: retailer.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc Get retailer profile
 * @route GET /api/retailer/:id
 * @access Private (requires JWT)
 */
export const getRetailerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const retailer = await Retailer.findById(id).select("-password");

    if (!retailer) {
      return res.status(404).json({ message: "Retailer not found" });
    }

    res.status(200).json(retailer);
  } catch (error) {
    console.error("Get retailer error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
