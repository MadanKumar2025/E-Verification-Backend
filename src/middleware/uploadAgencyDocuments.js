import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/agencyDocuments";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter,
});

const uploadAgencyDocuments = (req, res, next) => {
  upload.fields([
    {
      name: "panCardPDF",
      maxCount: 1,
    },
    {
      name: "gstCertificatePDF",
      maxCount: 1,
    },
    {
      name: "companyRegistrationPDF",
      maxCount: 1,
    },
  ])(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  });
};

export default uploadAgencyDocuments;
