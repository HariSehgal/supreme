import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model } = mongoose;

// Common password hashing middleware
const hashPassword = async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
};

// ===== Admin Schema =====
const adminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });
adminSchema.pre("save", hashPassword);
export const Admin = model("Admin", adminSchema);

// ===== Client Admin Schema =====
const clientAdminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: String,
  password: { type: String, required: true },
  organizationName: { type: String, required: true },
  registrationDetails: {
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
}, { timestamps: true });
clientAdminSchema.pre("save", hashPassword);
export const ClientAdmin = model("ClientAdmin", clientAdminSchema);

// ===== Client User Schema =====
const clientUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: String,
  password: { type: String, required: true },
  roleProfile: { type: String, enum: ["National", "Regional", "State", "Key Account"] },
  parentClientAdmin: { type: Schema.Types.ObjectId, ref: "ClientAdmin" },
}, { timestamps: true });
clientUserSchema.pre("save", hashPassword);
export const ClientUser = model("ClientUser", clientUserSchema);

// ===== Retailer Schema =====
const retailerSchema = new Schema({
  uniqueId: { type: String, unique: true },

  // Basic details
  name: { type: String, required: true },
  contactNo: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

  // Identification
  govtIdType: String,
  govtIdNumber: String,
  govtIdPhoto: { data: Buffer, contentType: String },
  personPhoto: { data: Buffer, contentType: String },
  signature: { data: Buffer, contentType: String },

  // Shop
  shopDetails: {
    shopName: String,
    businessType: String,
    shopAddress: {
      address: String,
      geoTags: { lat: Number, lng: Number },
      state: { type: String, required: true },
      city: { type: String, required: true },
    },
    ownershipType: String,
    dateOfEstablishment: Date,
    GSTNo: String,
    PANCard: String,
    outletPhoto: { data: Buffer, contentType: String },
  },

  // Bank
  bankDetails: {
    bankName: String,
    accountNumber: String,
    IFSC: String,
    branchName: String,
  },

  // Created by
  createdBy: { type: String, enum: ["RetailerSelf", "Employee"], default: "RetailerSelf" },

  password: { type: String, required: true },
}, { timestamps: true });

// Unique ID generation
retailerSchema.pre("save", async function (next) {
  if (!this.uniqueId && this.shopDetails?.shopAddress?.state && this.shopDetails?.shopAddress?.city) {
    const partOfIndia = this.partOfIndia || "N"; // pass N/E/W/S in request
    const typeOfStore = this.shopDetails?.businessType?.charAt(0)?.toUpperCase() || "O";
    const stateCode = this.shopDetails.shopAddress.state.substring(0, 2).toUpperCase();
    const cityCode = this.shopDetails.shopAddress.city.substring(0, 3).toUpperCase();
    const count = await mongoose.models.Retailer.countDocuments({});
    const num = String(count + 1).padStart(3, "0");
    this.uniqueId = `${partOfIndia}${typeOfStore}${stateCode}${cityCode}${num}`;
  }
  next();
});

retailerSchema.pre("save", hashPassword);
export const Retailer = model("Retailer", retailerSchema);
