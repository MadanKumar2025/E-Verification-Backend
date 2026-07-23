import express from "express";
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserStatus,
} from "../controllers/userController.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import uploadSingleImage from "../middleware/uploadHandler.js";
const router = express.Router();

// router.post("/users", authMiddleware, uploadSingleImage, createUser);
router.post("/users",authMiddleware, createUser);
router.get("/users", authMiddleware, getUsers);
router.get("/users/:id", authMiddleware, getUserById);
router.put("/users/update/:id", authMiddleware, uploadSingleImage, updateUser);
router.put("/updateStatus/:id", authMiddleware, updateUserStatus);

export default router;
