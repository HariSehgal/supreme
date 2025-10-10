
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["client", "employee", "retailer", "admin"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Client-specific fields
    clientData: {
      firstName: String,
      lastName: String,
      deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      orderHistory: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
      ],
      preferences: {
        dietaryRestrictions: [String],
        favoriteRestaurants: [String],
      },
    },

    // Employee-specific fields
    employeeData: {
      firstName: String,
      lastName: String,
      employeeId: {
        type: String,
        unique: true,
        sparse: true,
      },
      department: {
        type: String,
        enum: ["delivery", "support", "kitchen", "management"],
      },
      vehicleInfo: {
        type: String,
        model: String,
        plateNumber: String,
      },
      availability: {
        days: [String],
        hours: {
          start: String,
          end: String,
        },
      },
      currentLocation: {
        lat: Number,
        lng: Number,
      },
      completedDeliveries: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 5,
        min: 0,
        max: 5,
      },
    },

    // Retailer-specific fields
    retailerData: {
      businessName: {
        type: String,
        required: function () {
          return this.role === "retailer";
        },
      },
      ownerName: String,
      businessLicense: String,
      restaurantAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      cuisine: [String],
      openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String },
      },
      menu: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
      ],
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalOrders: {
        type: Number,
        default: 0,
      },
      bankDetails: {
        accountNumber: String,
        ifscCode: String,
        accountHolderName: String,
      },
    },

    // Admin-specific fields
    adminData: {
      firstName: String,
      lastName: String,
      adminLevel: {
        type: String,
        enum: ["super", "moderator", "support"],
        default: "moderator",
      },
      permissions: [String],
      department: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ email: 1, role: 1 });

export default mongoose.model("User", userSchema);