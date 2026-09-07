import express from "express";
import { getCounting,getMasterData } from "../controllers/CountingController.js";

const router = express.Router();

router.get("/counting/web", getCounting);
router.get("/master-data/web", getMasterData);

export default router;
