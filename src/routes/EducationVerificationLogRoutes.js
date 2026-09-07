import express from "express";

import {
  createEducationVerificationLog,
  getEducationVerificationLogs,
  getEducationVerificationById,
  updateEducationVerificationLog,
  getEducationVerificationLogByEducationId,
  sendEducationVerificationEmail,
  verifyEducationVerification,
  rejectEducationVerification,
  getEducationVerificationLogByEducationIdWeb,
  verifyEducationVerificationWeb,
  rejectEducationVerificationWeb,
  getEducationVerificationLogsByBoardId,
  getEducationVerificationDetailsById,
  verifyEducationVerificationNew,
  rejectEducationVerificationNew,
  sendEmailBornd,
} from "../controllers/EducationVerificationLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createEducationVerificationLog);
router.get("/", authMiddleware, getEducationVerificationLogs);
router.get("/:id", authMiddleware, getEducationVerificationById);

router.get(
  "/getEducationVerificationLogByEducationId/:educationId",
  authMiddleware,
  getEducationVerificationLogByEducationId,
);
router.get(
  "/getEducationVerificationDetailsById/:id",
  authMiddleware,
  getEducationVerificationDetailsById,
);

router.put("/update/:id", authMiddleware, updateEducationVerificationLog);
router.post("/send-email", authMiddleware, sendEducationVerificationEmail);

router.patch(
  "/Education-verification/:id/verify",
  authMiddleware,
  verifyEducationVerification,
);
router.patch(
  "/Education-verification-new/:id/verify",
  authMiddleware,
  verifyEducationVerificationNew,
);

router.patch(
  "/Education-verification-new/:id/reject",
  authMiddleware,
  rejectEducationVerificationNew,
);


router.patch(
  "/Education-verification/:id/reject",
  authMiddleware,
  rejectEducationVerification,
);

router.get(
  "/education-verification-logs/:boardId/:status",
  getEducationVerificationLogsByBoardId,
);

// This API is used for public access.

router.get(
  "/public/getEducationDetailsId/:educationId",
  getEducationVerificationLogByEducationIdWeb,
);

router.patch(
  "/public/education-verification/:id/:userId/verify",
  verifyEducationVerificationWeb,
);

router.patch(
  "/public/education-verification/:id/:userId/reject",
  rejectEducationVerificationWeb,
);

router.post("/send-emailBornd", authMiddleware, sendEmailBornd);

export default router;
