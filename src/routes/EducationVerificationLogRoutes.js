import express from "express";

import {
  createEducationVerificationLog,
  getEducationVerificationLogs,
  getEducationVerificationById,
  updateEducationVerificationLog,
  //   updateEducationVerificationStatus,
} from "../controllers/EducationVerificationLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createEducationVerificationLog);

router.get("/", authMiddleware, getEducationVerificationLogs);

router.get("/:id", authMiddleware, getEducationVerificationById);

router.put("/update/:id", authMiddleware, updateEducationVerificationLog);

// router.put(
//   "/updateStatus/:id",
//   authMiddleware,
//   updateEducationVerificationStatus,
// );

export default router;
