import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema, model  ,Types } = mongoose;

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

    // 🔒 For password reset functionality
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
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
    contactNo: { type: String, required: true, unique: true },
    email: String,
    password: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
    govtIdType: String,
    govtIdNumber: String,
    govtIdPhoto: { data: Buffer, contentType: String },
    personPhoto: { data: Buffer, contentType: String },
    registrationForm: { data: Buffer, contentType: String },
    shopDetails: {
      shopName: String,
      businessType: String,
      ownershipType: String,
      GSTNo: String,
      PANCard: String,
      outletPhoto: { data: Buffer, contentType: String },
      shopAddress: {
        address: String,
        address2: String,
        city: String,
        state: String,
        pincode: String,
      },
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      IFSC: String,
      branchName: String,
    },
    createdBy: {
      type: String,
      enum: ["RetailerSelf", "Employee"],
      default: "RetailerSelf",
    },
    phoneVerified: { type: Boolean, default: false },
    assignedCampaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    assignedEmployee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
    },
  },
  { timestamps: true }
);

// Hash password and generate uniqueId & retailerCode
retailerSchema.pre("save", async function (next) {
  try {
    if (!this.password && this.contactNo) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.contactNo, salt);
    }

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

/* ===============================
   EMPLOYEE SCHEMA
=============================== */
const employeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String },
    gender: String,
    address: String,
    dob: Date,
    organization: { type: Schema.Types.ObjectId, ref: "ClientAdmin" },
    createdByAdmin: { type: Schema.Types.ObjectId, ref: "Admin" },
    isFirstLogin: { type: Boolean, default: true },
    assignedCampaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
  try {
    if (this.isNew && this.phone) {
      this.password = await bcrypt.hash(this.phone.toString(), 10);
      this.isFirstLogin = true;
    }
    next();
  } catch (err) {
    next(err);
  }
});
export const Employee = model("Employee", employeeSchema);

/* ===============================
   CAMPAIGN SCHEMA
=============================== */
const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Retailer Enrolment", "Display Payment", "Incentive Payment", "Others"],
      required: true,
    },
    region: { type: String, enum: ["North", "South", "East", "West", "All"], required: true },
    state: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "Admin", required: true },

    // Assigned Retailers
    assignedRetailers: [
      {
        retailerId: { type: Types.ObjectId, ref: "Retailer", required: true },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        assignedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
      },
    ],

    // Assigned Employees
    assignedEmployees: [
      {
        employeeId: { type: Types.ObjectId, ref: "Employee" },
        status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
        assignedAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);
const paymentSchema = new mongoose.Schema(
  {
    retailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Retailer",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.totalAmount - this.amountPaid;
      },
    },
    // Track all UTR numbers as an array
    utrNumbers: [
      {
        utrNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // or ClientAdmin
      },
    ],
    paymentStatus: {
      type: String,
      enum: ["Pending", "Partially Paid", "Completed"],
      default: "Pending",
    },
    lastUpdatedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // admin who last updated
    },
  },
  { timestamps: true }
);

/* ===============================
   CAREER APPLICATION SCHEMA (UPDATED)
=============================== */
/* ===============================
   CAREER APPLICATION SCHEMA (Candidate)
=============================== */
const careerApplicationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    city: { type: String, required: true }, // ✅ Added city field
    resume: {
      data: Buffer,
      contentType: String,
      fileName: String,
    },
  },
  { timestamps: true }
);

export const CareerApplication = mongoose.model("CareerApplication", careerApplicationSchema);

/* ===============================
   JOB SCHEMA
=============================== */
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    salaryRange: { type: String },
    experienceRequired: { type: String },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract-Based"],
      default: "Full-Time",
      required: true
    }
    ,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


export const Job = mongoose.model("Job", jobSchema);


/* ===============================
   JOB APPLICATION SCHEMA (Tracks each job application)
=============================== */
const jobApplicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CareerApplication",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Under Review", "Shortlisted", "Rejected", "Selected"],
      default: "Pending",
    },
    totalRounds: { type: Number, default: 1 },
    currentRound: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);


export default mongoose.model("Payment", paymentSchema);


export const Payment = mongoose.model("Payment", paymentSchema);
export const Campaign = model("Campaign", campaignSchema);



