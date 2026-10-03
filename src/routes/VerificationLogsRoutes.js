import express from "express";
import {
  getVerificationLogsByCreatedBy,getAllVerificationLogs
} from "../controllers/VerificationLogsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/by-created-by/:createdBy",authMiddleware,
  getVerificationLogsByCreatedBy,
);

router.get(
  "/all",
  authMiddleware,
  getAllVerificationLogs
);

export default router;
