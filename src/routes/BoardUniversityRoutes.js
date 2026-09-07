import express from "express";

import {
  createBoardUniversity,
  getBoardUniversities,
  getBoardUniversityById,
  updateBoardUniversity,
  updateBoardUniversityActiveStatus,
  updateBoardUniversityApproval,
} from "../controllers/BoardUniversityController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createBoardUniversity);

router.get("/", authMiddleware, getBoardUniversities);
router.get("/:id", authMiddleware, getBoardUniversityById);

router.put("/update/:id", authMiddleware, updateBoardUniversity);

router.patch(
  "/active-status/:id",
  authMiddleware,
  updateBoardUniversityActiveStatus
);
router.patch(
  "/approval/:id",
  authMiddleware,
  updateBoardUniversityApproval
);


export default router;
