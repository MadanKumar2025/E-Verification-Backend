import express from "express";
import { loginUser, forgotPassword } from "../controllers/authController.js";

const router = express.Router();

router.route("/login").post(loginUser);
router.post("/forgot-password", forgotPassword);
export default router;
 
