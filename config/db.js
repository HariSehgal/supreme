import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://anubhav:KnVhdRa9gnVO2jB1@cluster0.8jzyu64.mongodb.net/?retryWrites=true&w=majority&appName=supreme"
    );
    console.log("DB connected");
  } catch (err) {
    console.error("DB connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB; // ✅ default export
