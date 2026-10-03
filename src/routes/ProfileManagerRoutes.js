import express from "express";

import {
  createProfileManager,
  getProfileManagers,
  getProfileManagerById,
  updateProfileManager,
  updateProfileManagerStatus,
  getProfileList,
} from "../controllers/ProfileManagerController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadSingleImage from "../middleware/uploadHandler.js";
import uploadProfileAttachments from "../middleware/uploadProfileAttachments.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  uploadProfileAttachments,
  createProfileManager,
);
router.get("/", authMiddleware, getProfileManagers);
router.get("/list", authMiddleware, getProfileList);

router.get("/:id", authMiddleware, getProfileManagerById);
router.put(
  "/update/:id",
  authMiddleware,
  uploadProfileAttachments,
  updateProfileManager,
);
router.put("/updateStatus/:id", authMiddleware, updateProfileManagerStatus);

export default router;
