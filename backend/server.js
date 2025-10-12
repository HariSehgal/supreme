import express from "express";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = 5000;

app.use(express.json());


connectDB();


app.use("/api/admin", adminRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
