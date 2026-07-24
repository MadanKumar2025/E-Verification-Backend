import express from "express";

import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  updateSubscriptionStatus,
} from "../controllers/SubscriptionPlanController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createSubscription);
router.get("/", authMiddleware, getSubscriptions);
router.get("/:id", authMiddleware, getSubscriptionById);
router.put("/update/:id", authMiddleware, updateSubscription);
router.put("/updateStatus/:id", authMiddleware, updateSubscriptionStatus);

export default router;
