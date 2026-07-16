import express from "express";

import {
  createDiscountScheme,
  getDiscountSchemes,
  getDiscountSchemeById,
  updateDiscountScheme,
  updateDiscountSchemeStatus,getDiscountSchemeByCompanyId
} from "../controllers/DiscountSchemeController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/discount-schemes", authMiddleware, createDiscountScheme);
router.get("/discount-schemes", authMiddleware, getDiscountSchemes);
router.get("/discount-schemes/:id", authMiddleware, getDiscountSchemeById);
router.get("/discount-schemes/CompanyId/:companyId", authMiddleware, getDiscountSchemeByCompanyId);
router.put(
  "/update/:id",
  authMiddleware,
  updateDiscountScheme,
);
router.put(
  "/status/:id",
  authMiddleware,
  updateDiscountSchemeStatus,
);

export default router;
