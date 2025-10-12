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
const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);
adminSchema.pre("save", hashPassword);
export const Admin = model("Admin", adminSchema);

// ===== Client Admin Schema =====
const clientAdminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNo: String,
    password: { type: String, required: true },
    organizationName: { type: String, required: true },
    registrationDetails: {
      username: { type: String, required: true },
      password: { type: String, required: true }
    }
  },
  { timestamps: true }
);
clientAdminSchema.pre("save", hashPassword);
export const ClientAdmin = model("ClientAdmin", clientAdminSchema);

// ===== Client User Schema =====
const clientUserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNo: String,
    password: { type: String, required: true },
    roleProfile: {
      type: String,
      enum: ["National", "Regional", "State", "Key Account"]
    },
    parentClientAdmin: { type: Schema.Types.ObjectId, ref: "ClientAdmin" }
  },
  { timestamps: true }
);
clientUserSchema.pre("save", hashPassword);
export const ClientUser = model("ClientUser", clientUserSchema);

// ===== Retailer Schema =====
const retailerSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    shopDetails: {
      shopName: String,
      businessType: String,
      shopAddress: { address: String, geoTags: { lat: Number, lng: Number } },
      ownershipType: String,
      dateOfEstablishment: Date,
      GSTNo: String,
      PANCard: String
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      IFSC: String,
      branchName: String
    }
  },
  { timestamps: true }
);
retailerSchema.pre("save", hashPassword);
export const Retailer = model("Retailer", retailerSchema);
