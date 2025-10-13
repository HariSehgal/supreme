import express from "express";
import { registerRetailer, loginRetailer, getRetailerProfile } from "../controllers/retailerController.js";
import { upload } from "../middleware/upload.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post(
  "/register",
  upload.fields([
    { name: "govtIdPhoto", maxCount: 1 },
    { name: "personPhoto", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "outletPhoto", maxCount: 1 },
  ]),
  registerRetailer
);


router.post("/login", loginRetailer);
router.get("/:id", protect, getRetailerProfile);

export default router;
