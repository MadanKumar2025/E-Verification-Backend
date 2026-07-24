import express from "express";

import {
  createProfileManager,
  getProfileManagers,
  getProfileManagerById,
  updateProfileManager,
  updateProfileManagerStatus,
} from "../controllers/ProfileManagerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createProfileManager);
router.get("/", authMiddleware, getProfileManagers);
router.get("/:id", authMiddleware, getProfileManagerById);
router.put("/update/:id", authMiddleware, updateProfileManager);
router.put("/updateStatus/:id", authMiddleware, updateProfileManagerStatus);

export default router;
