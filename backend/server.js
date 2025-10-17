import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow large uploads
app.use(express.urlencoded({ extended: true }));

// ===============================
// Database Connection
// ===============================
connectDB()
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===============================
// Routes
// ===============================
app.use("/api/admin", adminRoutes);
app.use("/api/retailer", retailerRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Supreme Backend API is running");
});

// ===============================
// Global Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// ===============================
// Start Server
// ===============================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
