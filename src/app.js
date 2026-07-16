import express from "express";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import AdminMenuMasterRoutes from "./routes/AdminMenuMasterRoutes.js";
import UserPermissionsRoutes from "./routes/UserPermissionsRoutes.js";
import ScreenReaderAccessRoutes from "./routes/ScreenReaderAccessRoutes.js";
import ApiFunctionMappingRoutes from "./routes/ApiFunctionMappingRoutes.js";
import discountRoutes from "./routes/DiscountRoutes.js";

import companyRoutes from "./routes/companyRoutes.js";
import ProductMasterRoutes from "./routes/ProductMasterRoutes.js";
import DiscountSchemeRoutes from "./routes/DiscountSchemeRoutes.js";
import CustomerPaymentRoutes from "./routes/CustomerPaymentRoutes.js";
import CustomerSoldQuantityRoutes from "./routes/CustomerSoldQuantityRoutes.js";

import cors from "cors";
import path from "path";

const app = express();

// middleware
// app.use(express.json());
app.use(express.json({ limit: "2gb" }));
app.use(express.urlencoded({ limit: "2gb", extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      // "http://172.16.100.149",
      // "http://40.139.229.204",
      // "http://14.139.229.204",
      // "http://test.nipb.res.in",
      // "https://test.nipb.res.in",
      // "https://www.nipb.res.in",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// routes
app.use("/api", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companyRoutes", companyRoutes);
app.use("/api/ProductMasterRoutes", ProductMasterRoutes);
app.use("/api/DiscountSchemeRoutes", DiscountSchemeRoutes);
app.use("/api/CustomerPaymentRoutes", CustomerPaymentRoutes);
app.use("/api/CustomerSoldQuantityRoutes", CustomerSoldQuantityRoutes);
app.use("/api/discountRoutes", discountRoutes);

app.use("/api/AdminMenuMasterRoutes", AdminMenuMasterRoutes);
app.use("/api/UserPermissionsRoutes", UserPermissionsRoutes);
app.use("/api/ScreenReaderAccessRoutes", ScreenReaderAccessRoutes);
app.use("/api/ApiFunctionMappingRoutes", ApiFunctionMappingRoutes);

export default app;
