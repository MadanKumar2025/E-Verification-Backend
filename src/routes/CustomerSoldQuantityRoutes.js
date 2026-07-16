import express from "express";

import {
  createCustomerSoldQuantity,
  getCustomerSoldQuantities,
  getCustomerSoldQuantityById,
  updateCustomerSoldQuantity,
  updateCustomerSoldQuantityStatus,
} from "../controllers/CustomerSoldQuantityController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
 
router.post(
  "/customer-sold-quantity",
  authMiddleware,
  createCustomerSoldQuantity
);
 
router.get(
  "/customer-sold-quantity",
  authMiddleware,
  getCustomerSoldQuantities
);
 
router.get(
  "/customer-sold-quantity/:id",
  authMiddleware,
  getCustomerSoldQuantityById
);
 
router.put(
  "/customer-sold-quantity/update/:id",
  authMiddleware,
  updateCustomerSoldQuantity
);
 
router.put(
  "/customer-sold-quantity/status/:id",
  authMiddleware,
  updateCustomerSoldQuantityStatus
);

export default router;