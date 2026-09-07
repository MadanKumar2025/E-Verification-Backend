import express from "express";
import {
  createAgency,
  getAgencies,
  getAgencyById,
  updateAgency,
  updateAgencyStatus,
  createAgencyPublic,
  approveAgencyAndCreateUser,
} from "../controllers/AgenciesController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadAgencyDocuments from "../middleware/uploadAgencyDocuments.js";

const router = express.Router();

router.post("/", authMiddleware, uploadAgencyDocuments, createAgency);
router.get("/", authMiddleware, getAgencies);

router.get("/:id", authMiddleware, getAgencyById);

router.put("/update/:id", authMiddleware, uploadAgencyDocuments, updateAgency);

// Update Agency Status
router.put("/updateStatus/:id", authMiddleware, updateAgencyStatus);

router.post("/public", uploadAgencyDocuments, createAgencyPublic);

router.post("/approve", authMiddleware, approveAgencyAndCreateUser);

export default router;
