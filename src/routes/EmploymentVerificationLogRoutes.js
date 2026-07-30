import express from "express";

import {
  createEmploymentVerificationLog,
  getEmploymentVerificationLogs,
  getEmploymentVerificationById,
  updateEmploymentVerificationLog,
} from "../controllers/EmploymentVerificationLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createEmploymentVerificationLog);

router.get("/", authMiddleware, getEmploymentVerificationLogs);

router.get("/:id", authMiddleware, getEmploymentVerificationById);

router.put("/update/:id", authMiddleware, updateEmploymentVerificationLog);

export default router;
