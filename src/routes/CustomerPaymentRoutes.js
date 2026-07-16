import express from "express";

import {
  createCustomerPayment,
  getCustomerPayments,
  getCustomerPaymentById,
  updateCustomerPayment,
  updateCustomerPaymentStatus,
} from "../controllers/CustomerPaymentController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/customer-payments", authMiddleware, createCustomerPayment);

router.get("/customer-payments", authMiddleware, getCustomerPayments);

router.get("/customer-payments/:id", authMiddleware, getCustomerPaymentById);

router.put("/customer-payments/:id", authMiddleware, updateCustomerPayment);

router.put(
  "/customer-payments/status/:id",
  authMiddleware,
  updateCustomerPaymentStatus,
);

export default router;
