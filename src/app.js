import express from "express";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import AdminMenuMasterRoutes from "./routes/AdminMenuMasterRoutes.js";
import UserPermissionsRoutes from "./routes/UserPermissionsRoutes.js";
import ScreenReaderAccessRoutes from "./routes/ScreenReaderAccessRoutes.js";
import ApiFunctionMappingRoutes from "./routes/ApiFunctionMappingRoutes.js";

import Agencies from "./routes/AgenciesRoutes.js";
import SubscriptionPlan from "./routes/SubscriptionPlanRoutes.js";
import ProfileManager  from "./routes/ProfileManagerRoutes.js";

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

app.use("/api/AdminMenuMasterRoutes", AdminMenuMasterRoutes);
app.use("/api/UserPermissionsRoutes", UserPermissionsRoutes);
app.use("/api/ScreenReaderAccessRoutes", ScreenReaderAccessRoutes);
app.use("/api/ApiFunctionMappingRoutes", ApiFunctionMappingRoutes);

export default app;
