import express from "express";

import {
  createMasterEmployer,
  getMasterEmployers,
  getMasterEmployerById,
  updateMasterEmployer,
  updateMasterEmployerStatus,
  createMasterEmployerUser,
  getMasterEmployersAll,
} from "../controllers/MasterEmployer.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createMasterEmployer);

router.get("/", authMiddleware, getMasterEmployers);

router.get("/All", authMiddleware, getMasterEmployersAll);

router.get("/:id", authMiddleware, getMasterEmployerById);

router.put("/update/:id", authMiddleware, updateMasterEmployer);

router.put("/updateStatus/:id", authMiddleware, updateMasterEmployerStatus);

router.post(
 "/create-user",
 authMiddleware,
 createMasterEmployerUser
);
export default router;
