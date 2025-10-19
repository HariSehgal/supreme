import { Employee } from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ======================================================
   EMPLOYEE LOGIN
====================================================== */
export const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const employee = await Employee.findOne({ email });
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: employee._id, email: employee.email, role: "employee" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Employee login successful",
      token,
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        typeOfEmployee: employee.typeOfEmployee,
      },
    });
  } catch (error) {
    console.error("Employee login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
