import express from "express";
import {
  createAgency,
  getAgencies,
  getAgencyById,
  updateAgency,
  updateAgencyStatus,
} from "../controllers/AgenciesController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createAgency);
router.get("/", authMiddleware, getAgencies);

router.get("/:id", authMiddleware, getAgencyById);
router.put("/update/:id", authMiddleware, updateAgency);

// Update Agency Status
router.put("/updateStatus/:id", authMiddleware, updateAgencyStatus);

export default router;
