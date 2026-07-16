import express from "express";

import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  updateCompanyStatus,
} from "../controllers/companyController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/companies", authMiddleware, createCompany);

router.get("/companies", authMiddleware, getCompanies);

router.get("/companies/:id", authMiddleware, getCompanyById);

router.put("/update/:id", authMiddleware, updateCompany);
router.put("/status/:id", authMiddleware, updateCompanyStatus);

export default router;
