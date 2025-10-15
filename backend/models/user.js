import mongoose from "mongoose";

const { Schema, model } = mongoose;

/* ===============================
   STATE CODE MAP
=============================== */
const stateCodes = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OD",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TS",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN",
  Chandigarh: "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DN",
  Delhi: "DL",
  "Jammu and Kashmir": "JK",
  Ladakh: "LA",
  Lakshadweep: "LD",
  Puducherry: "PY",
};

/* ===============================
   ADMIN SCHEMA
=============================== */
const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);
export const Admin = model("Admin", adminSchema);

/* ===============================
   CLIENT ADMIN SCHEMA
=============================== */
const clientAdminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNo: String,
    password: { type: String, required: true },
    organizationName: { type: String, required: true },
    registrationDetails: {
      username: { type: String, required: true },
      password: { type: String, required: true },
    },
  },
  { timestamps: true }
);
export const ClientAdmin = model("ClientAdmin", clientAdminSchema);

/* ===============================
   CLIENT USER SCHEMA
=============================== */
const clientUserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    contactNo: String,
    password: { type: String, required: true },
    roleProfile: {
      type: String,
      enum: ["National", "Regional", "State", "Key Account"],
    },
    parentClientAdmin: { type: Schema.Types.ObjectId, ref: "ClientAdmin" },
  },
  { timestamps: true }
);
export const ClientUser = model("ClientUser", clientUserSchema);

/* ===============================
   RETAILER SCHEMA
=============================== */
const retailerSchema = new Schema(
  {
    uniqueId: { type: String, unique: true },
    retailerCode: { type: String, unique: true },

    name: { type: String, required: true },
    contactNo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },

    govtIdType: String,
    govtIdNumber: String,
    govtIdPhoto: { data: Buffer, contentType: String },
    personPhoto: { data: Buffer, contentType: String },
    signature: { data: Buffer, contentType: String },

    // OTP Verification fields
    otp: { type: String },
    otpVerified: { type: Boolean, default: false },
    otpExpiry: { type: Date },

    shopDetails: {
      type: {
        shopName: String,
        businessType: String,
        shopAddress: {
          type: {
            address: String,
            geoTags: { lat: Number, lng: Number },
            state: { type: String, required: true },
            city: { type: String, required: true },
          },
          default: {
            address: "",
            geoTags: { lat: 0, lng: 0 },
            state: "NA",
            city: "NA",
          },
        },
        ownershipType: String,
        GSTNo: String,
        PANCard: String,
        outletPhoto: { data: Buffer, contentType: String },
      },
      default: {
        shopName: "",
        businessType: "",
        shopAddress: {
          address: "",
          geoTags: { lat: 0, lng: 0 },
          state: "NA",
          city: "NA",
        },
      },
    },

    bankDetails: {
      type: {
        bankName: String,
        accountNumber: String,
        IFSC: String,
        branchName: String,
      },
      default: {},
    },

    createdBy: {
      type: String,
      enum: ["RetailerSelf", "Employee"],
      default: "RetailerSelf",
    },

    password: { type: String, required: true },
  },
  { timestamps: true }
);

/* ===============================
   AUTO-GENERATE UNIQUE IDs
=============================== */
retailerSchema.pre("save", async function (next) {
  try {
    if (!this.password) this.password = this.contactNo;

    if (!this.uniqueId) {
      const state = this.shopDetails?.shopAddress?.state || "NA";
      const city = this.shopDetails?.shopAddress?.city || "NA";
      const partOfIndia = this.partOfIndia || "N";
      const typeOfStore =
        (this.shopDetails?.businessType || "O").charAt(0).toUpperCase();
      const stateCode = stateCodes[state] || "XX";
      const cityCode = city.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      this.uniqueId = `${partOfIndia}${typeOfStore}${stateCode}${cityCode}${randomNum}`;
    }

    if (!this.retailerCode) {
      const timestampPart = Date.now().toString().slice(-6);
      const randPart = Math.floor(100 + Math.random() * 900);
      this.retailerCode = `R${timestampPart}${randPart}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

export const Retailer = model("Retailer", retailerSchema);
