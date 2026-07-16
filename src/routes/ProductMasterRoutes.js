import express from "express";

import {
  createProductMaster,
  getProductMasters,
  getProductMasterById,
  updateProductMaster,
  updateProductMasterStatus,
  getProductMasterByCompanyID,
} from "../controllers/ProductMasterController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/products", authMiddleware, createProductMaster);

router.get("/products", authMiddleware, getProductMasters);

router.get("/products/:id", authMiddleware, getProductMasterById);

router.put("/update/:id", authMiddleware, updateProductMaster);

router.put("/status/:id", authMiddleware, updateProductMasterStatus);

router.get("/products/company/:companyID", getProductMasterByCompanyID);

export default router;
