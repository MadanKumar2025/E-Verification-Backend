import express from "express";
import { addPaymentAndCredits } from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/add-payment-credits", authMiddleware, addPaymentAndCredits);

export default router;
