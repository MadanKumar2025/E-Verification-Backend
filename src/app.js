import express from "express";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import AdminMenuMasterRoutes from "./routes/AdminMenuMasterRoutes.js";
import UserPermissionsRoutes from "./routes/UserPermissionsRoutes.js";
import ScreenReaderAccessRoutes from "./routes/ScreenReaderAccessRoutes.js";
import ApiFunctionMappingRoutes from "./routes/ApiFunctionMappingRoutes.js";
import MasterEmployer from "./routes/MasterEmployerRoutes.js";

import Agencies from "./routes/AgenciesRoutes.js";
import SubscriptionPlan from "./routes/SubscriptionPlanRoutes.js";
import ProfileManager from "./routes/ProfileManagerRoutes.js";
import EducationVerificationLog from "./routes/EducationVerificationLogRoutes.js";
import EmploymentVerificationLogRoutes from "./routes/EmploymentVerificationLogRoutes.js";
import BoardUniversityRoutes from "./routes/BoardUniversityRoutes.js";
import CountingRoutes from "./routes/CountingRoutes.js";
import partnersRoutes from "./routes/partnersRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import creditTransactionRoutes from "./routes/creditTransactionRoutes.js";
import VerificationLogsRoutes from "./routes/VerificationLogsRoutes.js";

import cors from "cors";
import path from "path";

const app = express();

// middleware
// app.use(express.json());
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// routes
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/Agencies", Agencies);
app.use("/api/SubscriptionPlan", SubscriptionPlan);
app.use("/api/ProfileManager", ProfileManager);
app.use("/api/EducationVerificationLog", EducationVerificationLog);
app.use("/api/MasterEmployer", MasterEmployer);
app.use("/api/EmploymentVerificationLog", EmploymentVerificationLogRoutes);
app.use("/api/BoardUniversity", BoardUniversityRoutes);
app.use("/api/CountingRoutes", CountingRoutes);
app.use("/api/partners", partnersRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/creditTransaction", creditTransactionRoutes);
app.use("/api/VerificationLogs", VerificationLogsRoutes);

app.use("/api/AdminMenuMasterRoutes", AdminMenuMasterRoutes);
app.use("/api/UserPermissionsRoutes", UserPermissionsRoutes);
app.use("/api/ScreenReaderAccessRoutes", ScreenReaderAccessRoutes);
app.use("/api/ApiFunctionMappingRoutes", ApiFunctionMappingRoutes);

export default app;
