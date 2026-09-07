import express from "express";

import {
  createMasterEmployer,
  getMasterEmployers,
  getMasterEmployerById,
  updateMasterEmployer,
  updateMasterEmployerStatus,
  createMasterEmployerUser,
  getMasterEmployersAll,
  createMasterEmployerPublic,
  getMasterEmployerByIdOne,
  updateMasterEmployerApproval
} from "../controllers/MasterEmployer.js";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadAgencyDocuments from "../middleware/uploadAgencyDocuments.js";

const router = express.Router();

router.post("/", authMiddleware, uploadAgencyDocuments, createMasterEmployer);

router.get("/", authMiddleware, getMasterEmployers);

router.get("/All", authMiddleware, getMasterEmployersAll);

router.get("/:id", authMiddleware, getMasterEmployerById);
router.get("/One/:id", authMiddleware, getMasterEmployerByIdOne);

router.put(
  "/update/:id",
  authMiddleware,
  uploadAgencyDocuments,
  updateMasterEmployer,
);

router.put("/updateStatus/:id", authMiddleware, updateMasterEmployerStatus);

router.post("/create-user", authMiddleware, createMasterEmployerUser);

router.put("/updateMasterEmployerApproval/:id", authMiddleware, updateMasterEmployerApproval);
// This is use for public api

router.post("/public", uploadAgencyDocuments, createMasterEmployerPublic);

export default router;
