import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import clientRoutes from "./routes/clientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";

dotenv.config();
connectDB();

const app = express();
app.use(express.json());

// Routes
app.use("/api/client", clientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/retailer", retailerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
