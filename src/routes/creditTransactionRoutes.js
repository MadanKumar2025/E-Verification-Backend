import express from "express";

import {
  createCreditTransaction,
  getCreditTransactionByUserId,
  getCreditTransactionByRefId,
} from "../controllers/creditTransactionController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/credit-details/:userId", authMiddleware, createCreditTransaction);

router.get(
  "/creditDetails/:userId",
  authMiddleware,
  getCreditTransactionByUserId,
);

router.get(
  "/creditDetails/refid/:refid",
  authMiddleware,
  getCreditTransactionByRefId,
);

export default router;
