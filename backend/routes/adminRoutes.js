import express from "express";
import {
  loginAdmin,
  addAdmin,
  addClientAdmin,
  addClientUser,
  loginClientAdmin,
  protect,
} from "../controllers/adminController.js";

const router = express.Router();

// Admin login
router.post("/login", loginAdmin);

// Admin adds new admin
router.post("/add-admin", protect, addAdmin);

// Admin adds client admin
router.post("/add-client-admin", protect, addClientAdmin);

// Admin adds client user
router.post("/add-client-user", protect, addClientUser);

// Client admin login
router.post("/client-admin-login", loginClientAdmin);

export default router;
