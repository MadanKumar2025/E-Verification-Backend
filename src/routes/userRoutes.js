import express from "express";
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  updateUserStatus,
  getUsersToken,
  changePassword,
} from "../controllers/userController.js";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import uploadSingleImage from "../middleware/uploadHandler.js";
const router = express.Router();

// router.post("/users", authMiddleware, uploadSingleImage, createUser);
router.post("/users",authMiddleware, createUser);
router.get("/users", authMiddleware, getUsers);
router.get("/getUsersToken", authMiddleware, getUsersToken);
router.get("/users/:id", authMiddleware, getUserById);
router.put("/users/update/:id", authMiddleware, uploadSingleImage, updateUser);
router.put("/updateStatus/:id", authMiddleware, updateUserStatus);
router.post("/users/change-password", authMiddleware, changePassword);


export default router;
