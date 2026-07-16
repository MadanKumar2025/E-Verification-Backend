import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { checkCustomerDiscount } from "../controllers/DiscountController.js";

const router = express.Router();

// Check Customer Discount
router.post(
  "/check-discount",
  authMiddleware,
  checkCustomerDiscount
);

export default router;