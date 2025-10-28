import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  loginClientAdmin,
  loginClientUser,
  clientSetPaymentPlan,
} from "../controllers/clientController.js";

const router = express.Router();

// CLIENT LOGIN
router.post("/admin/login", loginClientAdmin);
router.post("/user/login", loginClientUser);

// CLIENT PAYMENT PLAN
router.post("/campaigns/payment", protect, clientSetPaymentPlan);

export default router;
