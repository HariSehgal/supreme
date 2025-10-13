import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


connectDB();


app.use("/api/admin", adminRoutes);
app.use("/api/retailer", retailerRoutes); 

app.get("/", (req, res) => {
  res.send("Supreme Backend API is running ");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
