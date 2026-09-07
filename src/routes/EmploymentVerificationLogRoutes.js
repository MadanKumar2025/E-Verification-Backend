import express from "express";

import {
  createEmploymentVerificationLog,
  getEmploymentVerificationLogs,
  getEmploymentVerificationById,
  verifyEmploymentVerification,
  rejectEmploymentVerification,
  getEmploymentVerificationLogByEmploymentDetailsId,
  getEmploymentVerificationLogByEmploymentDetailsIdWeb,
  sendEmailMessage,
  verifyEmploymentVerificationWeb,
  rejectEmploymentVerificationWeb,
  getEmploymentVerificationLogsBasemployerId,
  saveEmployerEmail,
  getEmploymentDetailsId
} from "../controllers/EmploymentVerificationLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createEmploymentVerificationLog);
router.get("/", authMiddleware, getEmploymentVerificationLogs);
router.get("/:id", authMiddleware, getEmploymentVerificationById);
router.patch(
  "/employment-verification/:id/verify",
  authMiddleware,
  verifyEmploymentVerification,
);
router.patch(
  "/employment-verification/:id/reject",
  authMiddleware,
  rejectEmploymentVerification,
);

router.get(
  "/getEmploymentVerificationDetailsById/:id",
  authMiddleware,
  getEmploymentDetailsId
);

router.get(
  "/getEmploymentDetailsId/:employmentDetailsId",
  authMiddleware,
  getEmploymentVerificationLogByEmploymentDetailsId,
);
router.get(
  "/getEmploymentDetailsId/:employerId/:status",
  authMiddleware,
  getEmploymentVerificationLogsBasemployerId,
);

// This API is used for public access.

router.post("/send-email",authMiddleware, sendEmailMessage);
router.get(
  "/public/getEmploymentDetailsId/:employmentDetailsId",
  getEmploymentVerificationLogByEmploymentDetailsIdWeb,
);
router.patch(
  "/public/employment-verification/:id/:userId/verify",
  verifyEmploymentVerificationWeb,
);
router.patch(
  "/public/employment-verification/:id/:userId/reject",
  rejectEmploymentVerificationWeb,
);


router.post(
  "/save-employer-email",
  saveEmployerEmail,
);

export default router;
