import express from "express";

import {
  createPartner,
  getPartners,
  getPartnerById,
  updatePartner,
  updatePartnerActiveStatus,
  getPartnersWeb,
} from "../controllers/partnersController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadSingleImage from "../middleware/uploadHandler.js";

const router = express.Router();

router.post("/", authMiddleware, uploadSingleImage, createPartner);

router.get("/", authMiddleware, getPartners);
router.get("/web", getPartnersWeb);
router.get("/:id", authMiddleware, getPartnerById);

router.put("/update/:id", authMiddleware, uploadSingleImage, updatePartner);

router.patch("/active-status/:id", authMiddleware, updatePartnerActiveStatus);

export default router;
