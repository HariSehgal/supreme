import express from "express";
import { loginEmployee } from "../controllers/employeeController.js";

const router = express.Router();

// Employee login
router.post("/employee-login", loginEmployee);

export default router;
