import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Base User schema
const baseUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contactNo: { type: String }, // optional for admin
  password: { type: String, required: true }, // hashed
  role: { type: String, enum: ["client_admin", "client_user", "admin", "retailer"], required: true }
}, { discriminatorKey: "role", timestamps: true });

const User = model("User", baseUserSchema);

// Client Admin
const clientAdminSchema = new Schema({
  organizationName: { type: String, required: true },
  registrationDetails: {
    username: { type: String, required: true },
    password: { type: String, required: true } // hashed
  }
});
const ClientAdmin = User.discriminator("client_admin", clientAdminSchema);

// Client User
const clientUserSchema = new Schema({
  roleProfile: { type: String, enum: ["National", "Regional", "State", "Key Account"] },
  parentClientAdmin: { type: Schema.Types.ObjectId, ref: "User" }
});
const ClientUser = User.discriminator("client_user", clientUserSchema);

// Admin (simplified)
const adminSchema = new Schema({
  // no extra fields; uses base schema's email, password, role
});
const Admin = User.discriminator("admin", adminSchema);

// Retailer
const retailerSchema = new Schema({
  shopDetails: {
    shopName: String,
    businessType: String,
    shopAddress: {
      address: String,
      geoTags: { lat: Number, lng: Number }
    },
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
});
const Retailer = User.discriminator("retailer", retailerSchema);

export { User, ClientAdmin, ClientUser, Admin, Retailer };
