import Agency from "../models/AgenciesSchema.js";
import User from "../models/User.js";
import Subscription from "../models/SubscriptionPlanSchema.js";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

// export const createAgency = async (req, res) => {
//   try {
//     const {
//       agencyName,
//       gstNo,
//       address,
//       city,
//       state,
//       country,
//       tan,
//       email,
//       mobile,
//       subscriptionId,
//       password,
//     } = req.body;

//     if (!agencyName || agencyName.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Agency Name is required",
//       });
//     }

//     // ADDRESS VALIDATION

//     if (!address || address.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Address is required",
//       });
//     }

//     // CITY VALIDATION

//     if (!city || city.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "City is required",
//       });
//     }

//     // STATE VALIDATION

//     if (!state || state.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "State is required",
//       });
//     }

//     if (!tan || tan.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "TAN Number is required",
//       });
//     }

//     const normalizedTan = tan.trim().toUpperCase();

//     const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

//     // if (!tanRegex.test(normalizedTan)) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Invalid TAN Number",
//     //   });
//     // }

//     if (!subscriptionId) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription is required",
//       });
//     }

//     const subscription = await Subscription.findById(subscriptionId);

//     if (!subscription) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Subscription",
//       });
//     }

//     if (!subscription.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription is not active",
//       });
//     }

//     if (!email || email.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();

//     const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//     if (!emailRegex.test(normalizedEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email format",
//       });
//     }

//     if (!password || password.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Password is required",
//       });
//     }

//     const normalizedMobile = String(mobile || "").trim();

//     if (!normalizedMobile || !/^[0-9]{10}$/.test(normalizedMobile)) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number must be exactly 10 digits",
//       });
//     }

//     const panCardFile = req.files?.panCardPDF?.[0];

//     if (!panCardFile) {
//       return res.status(400).json({
//         success: false,
//         message: "PAN Card PDF is required",
//       });
//     }

//     const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

//     const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

//     // DUPLICATE EMAIL - AGENCY

//     const agencyEmail = await Agency.findOne({
//       email: normalizedEmail,
//     });

//     if (agencyEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "Agency email already exists",
//       });
//     }

//     // DUPLICATE EMAIL - USER

//     const userEmail = await User.findOne({
//       email: normalizedEmail,
//     });

//     if (userEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "User email already exists",
//       });
//     }

//     // NORMALIZE GST

//     const normalizedGstNo = gstNo?.trim()?.toUpperCase() || null;

//     // GST DUPLICATE CHECK

//     if (normalizedGstNo) {
//       const gstExists = await Agency.findOne({
//         gstNo: normalizedGstNo,
//       });

//       if (gstExists) {
//         return res.status(400).json({
//           success: false,
//           message: "GST Number already exists",
//         });
//       }
//     }

//     // NORMALIZE TAN

//     // TAN DUPLICATE CHECK

//     const tanExists = await Agency.findOne({
//       tan: normalizedTan,
//     });

//     if (tanExists) {
//       return res.status(400).json({
//         success: false,
//         message: "TAN Number already exists",
//       });
//     }

//     // CREATED BY

//     const createdBy = req.user?.id || null;

//     // FILE PATHS

//     const panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;

//     const gstCertificatePDF = gstCertificateFile
//       ? `/uploads/agencyDocuments/${gstCertificateFile.filename}`
//       : undefined;

//     const companyRegistrationPDF = companyRegistrationFile
//       ? `/uploads/agencyDocuments/${companyRegistrationFile.filename}`
//       : undefined;

//     // CREATE AGENCY DATA

//     const agencyData = {
//       agencyName: agencyName.trim(),
//       address: address.trim(),
//       city: city.trim(),
//       state: state.trim(),
//       country: country?.trim() || "India",
//       email: normalizedEmail,
//       mobile: normalizedMobile,
//       tan: normalizedTan,
//       subscriptionId: subscription._id,
//       credits: subscription.credits,

//       panCardPDF,

//       gstCertificatePDF,

//       companyRegistrationPDF,

//       isActive: true,
//       createdBy,
//       createdDate: new Date(),
//     };

//     if (normalizedGstNo) {
//       agencyData.gstNo = normalizedGstNo;
//     }

//     const agency = await Agency.create(agencyData);

//     const user = await User.create({
//       name: agencyName.trim(),
//       email: normalizedEmail,
//       password,
//       mobileNo: normalizedMobile,
//       UserRole: "Agency",

//       refid: agency._id,
//       refModel: "Agency",
//       createby: createdBy,

//       isActive: true,
//     });

//     // SEND EMAIL

//     try {
//       const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: Number(process.env.SMTP_PORT),
//         secure: Number(process.env.SMTP_PORT) === 465,
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: normalizedEmail,
//         subject: "Agency Account Created Successfully",
//         html: `
//           <div
//             style="
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//             "
//           >

//             <h2>
//               Hello ${agencyName.trim()}
//             </h2>

//             <p>
//               Your Agency account has been
//               created successfully.
//             </p>

//             <table
//               border="1"
//               cellpadding="8"
//               cellspacing="0"
//               style="
//                 border-collapse: collapse;
//               "
//             >

//               <tr>
//                 <td>
//                   <strong>Agency Name</strong>
//                 </td>

//                 <td>
//                   ${agencyName}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Email</strong>
//                 </td>

//                 <td>
//                   ${normalizedEmail}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Password</strong>
//                 </td>

//                 <td>
//                   ${password}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Mobile</strong>
//                 </td>

//                 <td>
//                   ${normalizedMobile}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Status</strong>
//                 </td>

//                 <td>
//                   Active
//                 </td>
//               </tr>

//             </table>

//             <br />

//             <p>
//               Please change your password
//               after your first login.
//             </p>

//           </div>
//         `,
//       });
//     } catch (emailError) {
//       console.log("Email sending failed:", emailError);
//     }

//     // SUCCESS RESPONSE

//     return res.status(201).json({
//       success: true,
//       message: "Agency created successfully",

//       // FULL DATA
//       data: {
//         agency,
//         user,
//       },
//     });
//   } catch (error) {
//     // ERROR LOG

//     console.error("Create Agency Error:", error);

//     // MULTER FILE ERROR

//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "Each PDF file must be less than 5 MB",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyPattern || {})[0];

//       return res.status(400).json({
//         success: false,
//         message: `${duplicateField} already exists`,
//       });
//     }

//     // INTERNAL SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };
export const createAgency = async (req, res) => {
  try {
    const {
      agencyName,
      gstNo,
      address,
      city,
      state,
      country,
      tan,
      email,
      mobile,
      subscriptionId,
    } = req.body;

    if (!agencyName || agencyName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Agency Name is required",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    if (!tan || tan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "TAN Number is required",
      });
    }

    const normalizedTan = tan.trim().toUpperCase();

    const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

    if (!tanRegex.test(normalizedTan)) {
      return res.status(400).json({
        success: false,
        message: "Invalid TAN Number",
      });
    }

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Subscription is required",
      });
    }

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subscription",
      });
    }

    if (!subscription.isActive) {
      return res.status(400).json({
        success: false,
        message: "Subscription is not active",
      });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const normalizedMobile = String(mobile || "").trim();

    if (!/^[0-9]{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    const panCardFile = req.files?.panCardPDF?.[0];

    if (!panCardFile) {
      return res.status(400).json({
        success: false,
        message: "PAN Card PDF is required",
      });
    }

    const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

    const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

    // DUPLICATE AGENCY EMAIL
    const agencyEmail = await Agency.findOne({
      email: normalizedEmail,
    });

    if (agencyEmail) {
      return res.status(400).json({
        success: false,
        message: "Agency email already exists",
      });
    }

    // GST
    const normalizedGstNo = gstNo?.trim()?.toUpperCase() || undefined;

    if (normalizedGstNo) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

      if (!gstRegex.test(normalizedGstNo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid GST Number",
        });
      }

      const gstExists = await Agency.findOne({
        gstNo: normalizedGstNo,
      });

      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    // TAN DUPLICATE
    const tanExists = await Agency.findOne({
      tan: normalizedTan,
    });

    if (tanExists) {
      return res.status(400).json({
        success: false,
        message: "TAN Number already exists",
      });
    }

    // CREATED BY
    const createdBy = req.user?.id;

    // FILE PATHS
    const panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;

    const gstCertificatePDF = gstCertificateFile
      ? `/uploads/agencyDocuments/${gstCertificateFile.filename}`
      : undefined;

    const companyRegistrationPDF = companyRegistrationFile
      ? `/uploads/agencyDocuments/${companyRegistrationFile.filename}`
      : undefined;

    // AGENCY DATA
    const agencyData = {
      agencyName: agencyName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",

      email: normalizedEmail,
      mobile: normalizedMobile,

      tan: normalizedTan,

      subscriptionId: subscription._id,
      credits: subscription.credits,

      panCardPDF,
      gstCertificatePDF,
      companyRegistrationPDF,

      isActive: true,
      isApproved: false,

      createdBy,
      createdDate: new Date(),
    };

    if (normalizedGstNo) {
      agencyData.gstNo = normalizedGstNo;
    }

    // ONLY AGENCY CREATE
    const agency = await Agency.create(agencyData);

    // SUCCESS
    return res.status(201).json({
      success: true,
      message: "Agency created successfully",
      data: {
        agency,
      },
    });
  } catch (error) {
    console.error("Create Agency Error:", error);

    // MULTER FILE ERROR
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each PDF file must be less than 5 MB",
      });
    }

    // MONGOOSE VALIDATION ERROR
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // DUPLICATE KEY
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// export const getAgencies = async (req, res) => {
//   try {
//     const agenciesList = await Agency.find()
//       .sort({ createdDate: -1 })
//       .populate("createdBy", "name email")
//       .populate("updatedBy", "name email");

//     const data = agenciesList.map((agency) => ({
//       id: agency._id,
//       agencyName: agency.agencyName,
//       gstNo: agency.gstNo,
//       address: agency.address,
//       city: agency.city,
//       state: agency.state,
//       country: agency.country,
//       tan: agency.tan,
//       email: agency.email,
//       mobile: agency.mobile,
//       subscriptionId: agency.subscriptionId,
//       isActive: agency.isActive,

//       panCardPDF: agency.panCardPDF,

//       gstCertificatePDF: agency.gstCertificatePDF,

//       companyRegistrationPDF: agency.companyRegistrationPDF,

//       createdBy: agency.createdBy,
//       updatedBy: agency.updatedBy,

//       createdDate: agency.createdDate,
//       updatedDate: agency.updatedDate,
//     }));

//     return res.status(200).json({
//       success: true,
//       count: data.length,
//       data,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Error fetching agencies",
//     });
//   }
// };

export const getAgencies = async (req, res) => {
  try {
    const agenciesList = await Agency.find()
      .sort({ createdDate: -1 })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("subscriptionId");

    const data = agenciesList.map((agency) => ({
      id: agency._id,

      agencyName: agency.agencyName,
      gstNo: agency.gstNo,

      address: agency.address,
      city: agency.city,
      state: agency.state,
      country: agency.country,

      tan: agency.tan,
      email: agency.email,
      mobile: agency.mobile,

      // Subscription details
      subscriptionId: agency.subscriptionId,

      credits: agency.credits,

      isActive: agency.isActive,
      isApproved: agency.isApproved,

      // Documents
      panCardPDF: agency.panCardPDF,
      gstCertificatePDF: agency.gstCertificatePDF,
      companyRegistrationPDF: agency.companyRegistrationPDF,

      // User details
      createdBy: agency.createdBy,
      updatedBy: agency.updatedBy,

      createdDate: agency.createdDate,
      updatedDate: agency.updatedDate,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching agencies:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching agencies",
      error: error.message,
    });
  }
};

// export const getAgencyById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Agency Id",
//       });
//     }

//     const agency = await Agency.findById(id)
//       .populate("createdBy", "name email")
//       .populate("updatedBy", "name email");

//     if (!agency) {
//       return res.status(404).json({
//         success: false,
//         message: "Agency not found",
//       });
//     }

//     const data = {
//       id: agency._id,
//       agencyName: agency.agencyName,
//       gstNo: agency.gstNo,
//       address: agency.address,
//       city: agency.city,
//       state: agency.state,
//       country: agency.country,
//       tan: agency.tan,
//       email: agency.email,
//       mobile: agency.mobile,
//       subscriptionId: agency.subscriptionId,
//       isActive: agency.isActive,

//       panCardPDF: agency.panCardPDF,

//       gstCertificatePDF: agency.gstCertificatePDF,

//       companyRegistrationPDF: agency.companyRegistrationPDF,

//       createdBy: agency.createdBy,
//       updatedBy: agency.updatedBy,

//       createdDate: agency.createdDate,
//       updatedDate: agency.updatedDate,
//     };

//     return res.status(200).json({
//       success: true,
//       message: "Agency fetched successfully",
//       data,
//     });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getAgencyById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Agency ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    // Find Agency
    const agency = await Agency.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .populate("subscriptionId");

    // Agency not found
    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // Response data
    const data = {
      id: agency._id,

      agencyName: agency.agencyName,
      gstNo: agency.gstNo,

      address: agency.address,
      city: agency.city,
      state: agency.state,
      country: agency.country,

      tan: agency.tan,
      email: agency.email,
      mobile: agency.mobile,

      // Subscription
      subscriptionId: agency.subscriptionId,

      // Credits
      credits: agency.credits,

      // Status
      isActive: agency.isActive,
      isApproved: agency.isApproved,

      // Documents
      panCardPDF: agency.panCardPDF,
      gstCertificatePDF: agency.gstCertificatePDF,
      companyRegistrationPDF: agency.companyRegistrationPDF,

      // Created / Updated By
      createdBy: agency.createdBy,
      updatedBy: agency.updatedBy,

      // Dates
      createdDate: agency.createdDate,
      updatedDate: agency.updatedDate,
    };

    return res.status(200).json({
      success: true,
      message: "Agency fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching agency:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateAgency = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       agencyName,
//       gstNo,
//       address,
//       city,
//       state,
//       country,
//       tan,
//       email,
//       mobile,
//       subscriptionId,
//       isActive,
//     } = req.body;

//     // VALIDATE AGENCY ID

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Agency Id",
//       });
//     }

//     // FIND AGENCY

//     const agency = await Agency.findById(id);

//     if (!agency) {
//       return res.status(404).json({
//         success: false,
//         message: "Agency not found",
//       });
//     }

//     // AGENCY NAME

//     if (agencyName !== undefined) {
//       if (typeof agencyName !== "string" || agencyName.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Agency Name is required",
//         });
//       }

//       agency.agencyName = agencyName.trim();
//     }

//     // GST NUMBER

//     if (gstNo !== undefined) {
//       const normalizedGstNo = String(gstNo || "")
//         .trim()
//         .toUpperCase();

//       // Empty GST -> remove
//       if (normalizedGstNo === "") {
//         agency.gstNo = undefined;
//       } else {
//         // GST FORMAT VALIDATION

//         const gstRegex =
//           /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

//         if (!gstRegex.test(normalizedGstNo)) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid GST Number",
//           });
//         }

//         // DUPLICATE GST CHECK

//         const gstExists = await Agency.findOne({
//           gstNo: normalizedGstNo,
//           _id: { $ne: id },
//         });

//         if (gstExists) {
//           return res.status(400).json({
//             success: false,
//             message: "GST Number already exists",
//           });
//         }

//         agency.gstNo = normalizedGstNo;
//       }
//     }

//     // ADDRESS

//     if (address !== undefined) {
//       if (typeof address !== "string" || address.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Address is required",
//         });
//       }

//       agency.address = address.trim();
//     }

//     // CITY

//     if (city !== undefined) {
//       if (typeof city !== "string" || city.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "City is required",
//         });
//       }

//       agency.city = city.trim();
//     }

//     // STATE

//     if (state !== undefined) {
//       if (typeof state !== "string" || state.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "State is required",
//         });
//       }

//       agency.state = state.trim();
//     }

//     // COUNTRY

//     if (country !== undefined) {
//       if (typeof country !== "string" || country.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Country cannot be empty",
//         });
//       }

//       agency.country = country.trim();
//     }

//     // TAN
//     // TAN

//     if (tan !== undefined) {
//       const normalizedTan = String(tan || "")
//         .trim()
//         .toUpperCase();

//       // TAN REQUIRED

//       if (normalizedTan === "") {
//         return res.status(400).json({
//           success: false,
//           message: "TAN Number is required",
//         });
//       }

//       // TAN FORMAT VALIDATION

//       const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]$/;

//       // if (!tanRegex.test(normalizedTan)) {
//       //   return res.status(400).json({
//       //     success: false,
//       //     message: "Invalid TAN Number",
//       //   });
//       // }

//       // DUPLICATE TAN CHECK

//       const tanExists = await Agency.findOne({
//         tan: normalizedTan,
//         _id: { $ne: id },
//       });

//       if (tanExists) {
//         return res.status(400).json({
//           success: false,
//           message: "TAN Number already exists",
//         });
//       }

//       agency.tan = normalizedTan;
//     }

//     // EMAIL

//     if (email !== undefined) {
//       if (typeof email !== "string" || email.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Email is required",
//         });
//       }

//       const normalizedEmail = email.trim().toLowerCase();

//       // EMAIL FORMAT

//       const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//       if (!emailRegex.test(normalizedEmail)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid email format",
//         });
//       }

//       // AGENCY EMAIL DUPLICATE

//       const agencyEmailExists = await Agency.findOne({
//         email: normalizedEmail,
//         _id: { $ne: id },
//       });

//       if (agencyEmailExists) {
//         return res.status(400).json({
//           success: false,
//           message: "Agency email already exists",
//         });
//       }

//       // USER EMAIL DUPLICATE

//       const userEmailExists = await User.findOne({
//         email: normalizedEmail,
//         refid: { $ne: agency._id },
//       });

//       if (userEmailExists) {
//         return res.status(400).json({
//           success: false,
//           message: "User email already exists",
//         });
//       }

//       agency.email = normalizedEmail;
//     }

//     // MOBILE

//     if (mobile !== undefined) {
//       const normalizedMobile = String(mobile || "").trim();

//       if (!/^[0-9]{10}$/.test(normalizedMobile)) {
//         return res.status(400).json({
//           success: false,
//           message: "Mobile number must be exactly 10 digits",
//         });
//       }

//       agency.mobile = normalizedMobile;
//     }

//     // SUBSCRIPTION

//     if (subscriptionId !== undefined) {
//       if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Subscription Id",
//         });
//       }

//       const subscription = await Subscription.findById(subscriptionId);

//       if (!subscription) {
//         return res.status(400).json({
//           success: false,
//           message: "Subscription not found",
//         });
//       }

//       if (!subscription.isActive) {
//         return res.status(400).json({
//           success: false,
//           message: "Subscription is inactive",
//         });
//       }

//       // UPDATE SUBSCRIPTION

//       agency.subscriptionId = subscription._id;

//       // UPDATE CREDITS

//       agency.credits = subscription.credits;
//     }

//     // PAN CARD PDF

//     //
//     // New file upload hua:
//     //     new file save hoga
//     //
//     // File upload nahi hua:
//     //     old file same rahega
//     //
//     // PAN create ke time required hai,
//     // update ke time required nahi hai.
//     //

//     const panCardFile = req.files?.panCardPDF?.[0];

//     if (panCardFile) {
//       agency.panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;
//     }

//     // GST CERTIFICATE PDF

//     const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

//     if (gstCertificateFile) {
//       agency.gstCertificatePDF = `/uploads/agencyDocuments/${gstCertificateFile.filename}`;
//     }

//     // COMPANY REGISTRATION PDF

//     const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

//     if (companyRegistrationFile) {
//       agency.companyRegistrationPDF = `/uploads/agencyDocuments/${companyRegistrationFile.filename}`;
//     }

//     // ACTIVE STATUS

//     if (isActive !== undefined) {
//       if (typeof isActive === "boolean") {
//         agency.isActive = isActive;
//       } else if (isActive === "true") {
//         agency.isActive = true;
//       } else if (isActive === "false") {
//         agency.isActive = false;
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "isActive must be true or false",
//         });
//       }
//     }

//     // UPDATED BY

//     agency.updatedBy = req.user?.id || null;

//     // UPDATED DATE

//     agency.updatedDate = new Date();

//     // SAVE AGENCY

//     const updatedAgency = await agency.save();

//     // UPDATE RELATED USER

//     //
//     // Agency ka email/name/mobile change hua
//     // to Agency User me bhi update hoga.
//     //

//     const userUpdateData = {};

//     if (agencyName !== undefined) {
//       userUpdateData.name = agency.agencyName;
//     }

//     if (email !== undefined) {
//       userUpdateData.email = agency.email;
//     }

//     if (mobile !== undefined) {
//       userUpdateData.mobileNo = agency.mobile;
//     }

//     if (isActive !== undefined) {
//       userUpdateData.isActive = agency.isActive;
//     }

//     if (Object.keys(userUpdateData).length > 0) {
//       await User.findOneAndUpdate(
//         {
//           refid: agency._id,
//           refModel: "Agency",
//         },
//         {
//           $set: userUpdateData,
//         },
//         {
//           new: true,
//         },
//       );
//     }

//     // SUCCESS RESPONSE

//     return res.status(200).json({
//       success: true,
//       message: "Agency updated successfully",

//       data: {
//         id: updatedAgency._id,
//         agencyName: updatedAgency.agencyName,
//         gstNo: updatedAgency.gstNo,
//         address: updatedAgency.address,
//         city: updatedAgency.city,
//         state: updatedAgency.state,
//         country: updatedAgency.country,
//         tan: updatedAgency.tan,
//         email: updatedAgency.email,
//         mobile: updatedAgency.mobile,
//         subscriptionId: updatedAgency.subscriptionId,
//         credits: updatedAgency.credits,
//         panCardPDF: updatedAgency.panCardPDF,
//         gstCertificatePDF: updatedAgency.gstCertificatePDF,
//         companyRegistrationPDF: updatedAgency.companyRegistrationPDF,
//         isActive: updatedAgency.isActive,
//         createdBy: updatedAgency.createdBy,
//         updatedBy: updatedAgency.updatedBy,
//         createdDate: updatedAgency.createdDate,
//         updatedDate: updatedAgency.updatedDate,
//       },
//     });
//   } catch (error) {
//     // ERROR LOG

//     console.error("Update Agency Error:", error);

//     // MULTER FILE ERROR

//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "Each PDF file must be less than 5 MB",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: messages.join(", "),
//       });
//     }

//     // CAST ERROR

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid value for ${error.path}`,
//       });
//     }

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyPattern || {})[0];

//       return res.status(400).json({
//         success: false,
//         message: `${duplicateField} already exists`,
//       });
//     }

//     // INTERNAL SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

export const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      agencyName,
      gstNo,
      address,
      city,
      state,
      country,
      tan,
      email,
      mobile,
      subscriptionId,
      isActive,
      isApproved,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    if (agencyName !== undefined) {
      if (typeof agencyName !== "string" || agencyName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Agency Name is required",
        });
      }

      agency.agencyName = agencyName.trim();
    }

    if (gstNo !== undefined) {
      const normalizedGstNo = String(gstNo || "")
        .trim()
        .toUpperCase();

      // Empty GST -> remove
      if (normalizedGstNo === "") {
        agency.gstNo = undefined;
      } else {
        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstRegex.test(normalizedGstNo)) {
          return res.status(400).json({
            success: false,
            message: "Invalid GST Number",
          });
        }

        // DUPLICATE GST CHECK

        const gstExists = await Agency.findOne({
          gstNo: normalizedGstNo,
          _id: { $ne: id },
        });

        if (gstExists) {
          return res.status(400).json({
            success: false,
            message: "GST Number already exists",
          });
        }

        agency.gstNo = normalizedGstNo;
      }
    }

    if (address !== undefined) {
      if (typeof address !== "string" || address.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      agency.address = address.trim();
    }

    if (city !== undefined) {
      if (typeof city !== "string" || city.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "City is required",
        });
      }

      agency.city = city.trim();
    }

    if (state !== undefined) {
      if (typeof state !== "string" || state.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      agency.state = state.trim();
    }

    if (country !== undefined) {
      if (typeof country !== "string" || country.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Country cannot be empty",
        });
      }

      agency.country = country.trim();
    }

    if (tan !== undefined) {
      const normalizedTan = String(tan || "")
        .trim()
        .toUpperCase();

      if (normalizedTan === "") {
        return res.status(400).json({
          success: false,
          message: "TAN Number is required",
        });
      }

      const tanExists = await Agency.findOne({
        tan: normalizedTan,
        _id: { $ne: id },
      });

      if (tanExists) {
        return res.status(400).json({
          success: false,
          message: "TAN Number already exists",
        });
      }

      agency.tan = normalizedTan;
    }

    if (email !== undefined) {
      // APPROVED AGENCY EMAIL CANNOT BE CHANGED

      if (agency.isApproved === true) {
        return res.status(400).json({
          success: false,
          message: "Approved agency email cannot be changed",
        });
      }

      if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // EMAIL FORMAT

      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // AGENCY EMAIL DUPLICATE

      const agencyEmailExists = await Agency.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (agencyEmailExists) {
        return res.status(400).json({
          success: false,
          message: "Agency email already exists",
        });
      }

      // USER EMAIL DUPLICATE

      const userEmailExists = await User.findOne({
        email: normalizedEmail,
        refid: { $ne: agency._id },
      });

      if (userEmailExists) {
        return res.status(400).json({
          success: false,
          message: "User email already exists",
        });
      }

      agency.email = normalizedEmail;
    }

    // MOBILE

    if (mobile !== undefined) {
      const normalizedMobile = String(mobile || "").trim();

      if (!/^[0-9]{10}$/.test(normalizedMobile)) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be exactly 10 digits",
        });
      }

      agency.mobile = normalizedMobile;
    }

    // SUBSCRIPTION

    if (subscriptionId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Subscription Id",
        });
      }

      const subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Subscription not found",
        });
      }

      if (!subscription.isActive) {
        return res.status(400).json({
          success: false,
          message: "Subscription is inactive",
        });
      }

      // UPDATE SUBSCRIPTION

      agency.subscriptionId = subscription._id;

      // UPDATE CREDITS

      agency.credits = subscription.credits;
    }

    // PAN CARD PDF

    const panCardFile = req.files?.panCardPDF?.[0];

    if (panCardFile) {
      agency.panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;
    }

    // GST CERTIFICATE PDF

    const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

    if (gstCertificateFile) {
      agency.gstCertificatePDF = `/uploads/agencyDocuments/${gstCertificateFile.filename}`;
    }

    // COMPANY REGISTRATION PDF

    const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

    if (companyRegistrationFile) {
      agency.companyRegistrationPDF = `/uploads/agencyDocuments/${companyRegistrationFile.filename}`;
    }

    // ACTIVE STATUS

    if (isActive !== undefined) {
      if (typeof isActive === "boolean") {
        agency.isActive = isActive;
      } else if (isActive === "true") {
        agency.isActive = true;
      } else if (isActive === "false") {
        agency.isActive = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }
    }

    // APPROVED STATUS

    if (isApproved !== undefined) {
      if (typeof isApproved === "boolean") {
        agency.isApproved = isApproved;
      } else if (isApproved === "true") {
        agency.isApproved = true;
      } else if (isApproved === "false") {
        agency.isApproved = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "isApproved must be true or false",
        });
      }
    }

    // UPDATED BY

    agency.updatedBy = req.user?.id || null;

    // UPDATED DATE

    agency.updatedDate = new Date();

    // SAVE AGENCY

    const updatedAgency = await agency.save();

    // UPDATE RELATED USER

    const userUpdateData = {};

    if (agencyName !== undefined) {
      userUpdateData.name = agency.agencyName;
    }

    // Email will only reach here when agency
    // was not approved.
    if (email !== undefined) {
      userUpdateData.email = agency.email;
    }

    if (mobile !== undefined) {
      userUpdateData.mobileNo = agency.mobile;
    }

    if (isActive !== undefined) {
      userUpdateData.isActive = agency.isActive;
    }

    if (Object.keys(userUpdateData).length > 0) {
      await User.findOneAndUpdate(
        {
          refid: agency._id,
          refModel: "Agency",
        },
        {
          $set: userUpdateData,
        },
        {
          new: true,
        },
      );
    }

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Agency updated successfully",

      data: {
        id: updatedAgency._id,

        agencyName: updatedAgency.agencyName,
        gstNo: updatedAgency.gstNo,

        address: updatedAgency.address,
        city: updatedAgency.city,
        state: updatedAgency.state,
        country: updatedAgency.country,

        tan: updatedAgency.tan,
        email: updatedAgency.email,
        mobile: updatedAgency.mobile,

        subscriptionId: updatedAgency.subscriptionId,
        credits: updatedAgency.credits,

        panCardPDF: updatedAgency.panCardPDF,
        gstCertificatePDF: updatedAgency.gstCertificatePDF,
        companyRegistrationPDF: updatedAgency.companyRegistrationPDF,

        isActive: updatedAgency.isActive,
        isApproved: updatedAgency.isApproved,

        createdBy: updatedAgency.createdBy,
        updatedBy: updatedAgency.updatedBy,

        createdDate: updatedAgency.createdDate,
        updatedDate: updatedAgency.updatedDate,
      },
    });
  } catch (error) {
    // ERROR LOG

    console.error("Update Agency Error:", error);

    // MULTER FILE ERROR

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each PDF file must be less than 5 MB",
      });
    }

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // CAST ERROR

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // DUPLICATE KEY ERROR

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // INTERNAL SERVER ERROR

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// export const updateAgencyStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isActive } = req.body;

//     // VALIDATE AGENCY ID

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Agency Id",
//       });
//     }

//     // VALIDATE STATUS

//     let activeStatus;

//     if (typeof isActive === "boolean") {
//       activeStatus = isActive;
//     } else if (typeof isActive === "string") {
//       if (isActive.toLowerCase() === "true") {
//         activeStatus = true;
//       } else if (isActive.toLowerCase() === "false") {
//         activeStatus = false;
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "isActive must be true or false",
//         });
//       }
//     } else {
//       return res.status(400).json({
//         success: false,
//         message: "isActive must be true or false",
//       });
//     }

//     // CURRENT LOGGED-IN USER

//     const updatedBy = req.user?.id || null;

//     // FIND AGENCY

//     const agency = await Agency.findById(id);

//     if (!agency) {
//       return res.status(404).json({
//         success: false,
//         message: "Agency not found",
//       });
//     }

//     // UPDATE AGENCY STATUS

//     agency.isActive = activeStatus;
//     agency.updatedBy = updatedBy;
//     agency.updatedDate = new Date();

//     const updatedAgency = await agency.save();

//     // UPDATE RELATED AGENCY USER STATUS

//     const agencyUser = await User.findOne({
//       refid: agency._id,
//       refModel: "Agency",
//     });

//     let updatedUser = null;

//     if (agencyUser) {
//       agencyUser.isActive = activeStatus;
//       agencyUser.updateby = updatedBy;
//       agencyUser.updatedate = new Date();

//       updatedUser = await agencyUser.save();
//     }

//     // SEND STATUS EMAIL

//     try {
//       const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,
//         port: Number(process.env.SMTP_PORT),
//         secure: Number(process.env.SMTP_PORT) === 465,
//         auth: {
//           user: process.env.EMAIL_USER,
//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       const statusText = activeStatus ? "Activated" : "Deactivated";

//       const statusColor = activeStatus ? "#28a745" : "#dc3545";

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,
//         to: updatedAgency.email,

//         subject: `Agency Account ${statusText}`,

//         html: `
//           <div
//             style="
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//               color: #333;
//               max-width: 600px;
//               margin: auto;
//             "
//           >

//             <h2>
//               Hello ${updatedAgency.agencyName}
//             </h2>

//             <p>
//               Your Agency account status has been updated.
//             </p>

//             <table
//               border="1"
//               cellpadding="10"
//               cellspacing="0"
//               style="
//                 border-collapse: collapse;
//                 width: 100%;
//               "
//             >

//               <tr>
//                 <td>
//                   <strong>Agency Name</strong>
//                 </td>

//                 <td>
//                   ${updatedAgency.agencyName}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Email</strong>
//                 </td>

//                 <td>
//                   ${updatedAgency.email}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Mobile</strong>
//                 </td>

//                 <td>
//                   ${updatedAgency.mobile}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Account Status</strong>
//                 </td>

//                 <td>
//                   <strong style="color: ${statusColor};">
//                     ${statusText}
//                   </strong>
//                 </td>
//               </tr>

//             </table>

//             <br />

//             ${
//               activeStatus
//                 ? `
//                   <p>
//                     Your Agency account has been
//                     <strong style="color: #28a745;">
//                       activated
//                     </strong>
//                     successfully.
//                   </p>

//                   <p>
//                     You can now log in and use your
//                     Agency account.
//                   </p>
//                 `
//                 : `
//                   <p>
//                     Your Agency account has been
//                     <strong style="color: #dc3545;">
//                       deactivated
//                     </strong>
//                     by the administrator.
//                   </p>

//                   <p>
//                     You will not be able to access
//                     your Agency account until it is
//                     activated again.
//                   </p>
//                 `
//             }

//             <br />

//             <p>
//               Regards,<br />
//               Admin Team
//             </p>

//           </div>
//         `,
//       });

//       console.log(
//         `Agency status email sent successfully to ${updatedAgency.email}`,
//       );
//     } catch (emailError) {
//       // Email fail hone par status update fail nahi hoga
//       console.log("Agency status email sending failed:", emailError);
//     }

//     // SUCCESS RESPONSE

//     return res.status(200).json({
//       success: true,
//       message: activeStatus
//         ? "Agency and User activated successfully"
//         : "Agency and User deactivated successfully",

//       data: {
//         agency: {
//           _id: updatedAgency._id,
//           agencyName: updatedAgency.agencyName,
//           email: updatedAgency.email,
//           isActive: updatedAgency.isActive,
//           updatedBy: updatedAgency.updatedBy,
//           updatedDate: updatedAgency.updatedDate,
//         },

//         user: updatedUser
//           ? {
//               _id: updatedUser._id,
//               name: updatedUser.name,
//               email: updatedUser.email,
//               UserRole: updatedUser.UserRole,
//               refid: updatedUser.refid,
//               refModel: updatedUser.refModel,
//               isActive: updatedUser.isActive,
//               updateby: updatedUser.updateby,
//               updatedate: updatedUser.updatedate,
//             }
//           : null,
//       },
//     });
//   } catch (error) {
//     console.error("Update Agency Status Error =>", error);

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: messages.join(", "),
//       });
//     }

//     // CAST ERROR

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid value for ${error.path}`,
//       });
//     }

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyPattern || {})[0];

//       return res.status(400).json({
//         success: false,
//         message: `${duplicateField} already exists`,
//       });
//     }

//     // SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };

export const updateAgencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    let activeStatus;

    if (typeof isActive === "boolean") {
      activeStatus = isActive;
    } else if (isActive === "true") {
      activeStatus = true;
    } else if (isActive === "false") {
      activeStatus = false;
    } else {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // FIND AGENCY

    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // UPDATE AGENCY STATUS

    agency.isActive = activeStatus;
    agency.updatedBy = req.user?.id || null;
    agency.updatedDate = new Date();

    await agency.save();

    // UPDATE RELATED USER STATUS

    const relatedUser = await User.findOne({
      refid: agency._id,
      refModel: "Agency",
    });

    // User nahi mila to koi problem nahi
    if (relatedUser) {
      relatedUser.isActive = activeStatus;

      await relatedUser.save();
    }

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Agency status updated successfully",

      data: {
        agencyId: agency._id,
        isActive: agency.isActive,

        userUpdated: !!relatedUser,

        user: relatedUser
          ? {
              id: relatedUser._id,
              name: relatedUser.name,
              email: relatedUser.email,
              isActive: relatedUser.isActive,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Update Agency Status Error:", error);

    // CAST ERROR

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // VALIDATION ERROR

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // INTERNAL SERVER ERROR

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// export const createAgencyPublic = async (req, res) => {
//   try {
//     const {
//       agencyName,
//       gstNo,
//       address,
//       city,
//       state,
//       country,
//       tan,
//       email,
//       mobile,

//       password,
//     } = req.body;

//     if (!agencyName || agencyName.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Agency Name is required",
//       });
//     }

//     if (!address || address.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Address is required",
//       });
//     }

//     if (!city || city.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "City is required",
//       });
//     }

//     if (!state || state.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "State is required",
//       });
//     }

//     if (!email || email.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     const normalizedEmail = email.trim().toLowerCase();
//     const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
//     if (!emailRegex.test(normalizedEmail)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email format",
//       });
//     }

//     if (!password || password.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Password is required",
//       });
//     }

//     if (!tan || tan.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "PAN Number is required",
//       });
//     }

//     const normalizedTan = tan.trim().toUpperCase();
//     const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
//     // if (!tanRegex.test(normalizedTan)) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Invalid PAN Number",
//     //   });
//     // }

//     const normalizedMobile = String(mobile || "").trim();
//     if (!normalizedMobile || !/^[0-9]{10}$/.test(normalizedMobile)) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number must be exactly 10 digits",
//       });
//     }

//     // SUBSCRIPTION VALIDATION
//     const subscriptionId = "6a829b40d8d361ecce90f995";
//     const subscription = await Subscription.findById(subscriptionId);
//     if (!subscription) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Subscription",
//       });
//     }
//     if (!subscription.isActive) {
//       return res.status(400).json({
//         success: false,
//         message: "Subscription is not active",
//       });
//     }

//     // PDF FILES

//     const panCardFile = req.files?.panCardPDF?.[0];

//     if (!panCardFile) {
//       return res.status(400).json({
//         success: false,
//         message: "PAN Card PDF is required",
//       });
//     }

//     // GST CERTIFICATE PDF
//     // OPTIONAL

//     const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

//     // COMPANY REGISTRATION PDF
//     // OPTIONAL

//     const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

//     // FILE PATHS

//     const panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;

//     const gstCertificatePDF = gstCertificateFile
//       ? `/uploads/agencyDocuments/${gstCertificateFile.filename}`
//       : undefined;

//     const companyRegistrationPDF = companyRegistrationFile
//       ? `/uploads/agencyDocuments/${companyRegistrationFile.filename}`
//       : undefined;

//     // NORMALIZE GST

//     const normalizedGstNo =
//       gstNo === undefined || gstNo === null || gstNo.trim() === ""
//         ? undefined
//         : gstNo.trim().toUpperCase();

//     // DUPLICATE EMAIL - AGENCY

//     const agencyEmailExists = await Agency.findOne({
//       email: normalizedEmail,
//     });

//     if (agencyEmailExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Agency email already exists",
//       });
//     }

//     // DUPLICATE EMAIL - USER

//     const userEmailExists = await User.findOne({
//       email: normalizedEmail,
//     });

//     if (userEmailExists) {
//       return res.status(400).json({
//         success: false,
//         message: "User email already exists",
//       });
//     }

//     // GST DUPLICATE CHECK

//     if (normalizedGstNo) {
//       const gstExists = await Agency.findOne({
//         gstNo: normalizedGstNo,
//       });

//       if (gstExists) {
//         return res.status(400).json({
//           success: false,
//           message: "GST Number already exists",
//         });
//       }
//     }

//     // TAN DUPLICATE CHECK

//     if (normalizedTan) {
//       const tanExists = await Agency.findOne({
//         tan: normalizedTan,
//       });

//       if (tanExists) {
//         return res.status(400).json({
//           success: false,
//           message: "TAN Number already exists",
//         });
//       }
//     }

//     // CREATE AGENCY DATA

//     const agencyData = {
//       agencyName: agencyName.trim(),
//       address: address.trim(),
//       city: city.trim(),
//       state: state.trim(),
//       country: country?.trim() || "India",
//       email: normalizedEmail,
//       mobile: normalizedMobile,
//       tan: normalizedTan,

//       subscriptionId: subscription._id,
//       // Subscription ke credits
//       credits: subscription.credits,

//
//       // PDF DOCUMENTS
//

//       // REQUIRED
//       panCardPDF,
//       // OPTIONAL
//       gstCertificatePDF,
//       companyRegistrationPDF,
//
//       // PUBLIC REGISTRATION
//

//       // Admin approval ke baad true hoga
//       isActive: false,

//       // Public API mein logged-in user nahi hai
//       createdBy: null,

//       createdDate: new Date(),
//     };

//     // ADD GST

//     if (normalizedGstNo) {
//       agencyData.gstNo = normalizedGstNo;
//     }

//     // CREATE AGENCY

//     const agency = await Agency.create(agencyData);

//     // CREATE USER

//     const user = await User.create({
//       name: agencyName.trim(),
//       email: normalizedEmail,
//       password,
//       mobileNo: normalizedMobile,
//       UserRole: "Agency",
//       // Agency ID
//       refid: agency._id,
//       refModel: "Agency",
//       // Public registration
//       createby: null,

//
//       // ADMIN APPROVAL REQUIRED
//

//       isActive: false,
//     });

//     // SEND EMAIL

//     try {
//       const transporter = nodemailer.createTransport({
//         host: process.env.SMTP_HOST,

//         port: Number(process.env.SMTP_PORT),

//         secure: Number(process.env.SMTP_PORT) === 465,

//         auth: {
//           user: process.env.EMAIL_USER,

//           pass: process.env.EMAIL_PASS,
//         },
//       });

//       await transporter.sendMail({
//         from: process.env.EMAIL_USER,

//         to: normalizedEmail,

//         subject: "Agency Registration Submitted Successfully",

//         html: `
//           <div
//             style="
//               font-family: Arial, sans-serif;
//               line-height: 1.6;
//             "
//           >

//             <h2>
//               Hello ${agencyName.trim()},
//             </h2>

//             <p>
//               Your agency registration has been
//               submitted successfully.
//             </p>

//             <p>
//               Your application has been sent to
//               the administrator for approval.
//             </p>

//             <p>
//               Your account will be activated once
//               the administrator approves your
//               application.
//             </p>

//             <hr />

//             <h3>
//               Registration Details
//             </h3>

//             <table
//               border="1"
//               cellpadding="8"
//               cellspacing="0"
//               style="
//                 border-collapse: collapse;
//               "
//             >

//               <tr>
//                 <td>
//                   <strong>Agency Name</strong>
//                 </td>

//                 <td>
//                   ${agencyName.trim()}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Email</strong>
//                 </td>

//                 <td>
//                   ${normalizedEmail}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Mobile</strong>
//                 </td>

//                 <td>
//                   ${normalizedMobile}
//                 </td>
//               </tr>

//               <tr>
//                 <td>
//                   <strong>Status</strong>
//                 </td>

//                 <td>
//                   Pending Admin Approval
//                 </td>
//               </tr>

//             </table>

//             <br />

//             <p>
//               You will be able to access your
//               account after administrator approval.
//             </p>

//             <p>
//               Thank you.
//             </p>

//           </div>
//         `,
//       });
//     } catch (emailError) {
//       // Email fail hone par registration fail nahi hoga
//       console.log("Email sending failed:", emailError);
//     }

//     // SUCCESS RESPONSE

//     return res.status(201).json({
//       success: true,

//       message:
//         "Agency has been created successfully and has been sent to the admin for approval.",

//
//       // FULL DATA
//

//       data: {
//         agency: {
//           _id: agency._id,
//           agencyName: agency.agencyName,
//           gstNo: agency.gstNo,
//           address: agency.address,
//           city: agency.city,
//           state: agency.state,
//           country: agency.country,
//           tan: agency.tan,
//           email: agency.email,
//           mobile: agency.mobile,
//           subscriptionId: agency.subscriptionId,
//           credits: agency.credits,
//           panCardPDF: agency.panCardPDF,
//           gstCertificatePDF: agency.gstCertificatePDF,
//           companyRegistrationPDF: agency.companyRegistrationPDF,
//           isActive: agency.isActive,
//           createdBy: agency.createdBy,
//           updatedBy: agency.updatedBy,
//           createdDate: agency.createdDate,
//           updatedDate: agency.updatedDate,
//         },

//         user: {
//           _id: user._id,
//           name: user.name,
//           email: user.email,
//           mobileNo: user.mobileNo,
//           UserRole: user.UserRole,
//           refid: user.refid,
//           refModel: user.refModel,
//           isActive: user.isActive,
//           createdate: user.createdate,
//           createby: user.createby,
//           updateby: user.updateby,
//           updatedate: user.updatedate,
//         },
//       },
//     });
//   } catch (error) {
//     // ERROR LOG

//     console.error("createAgencyPublic Error:", error);

//     // MULTER FILE ERROR

//     if (error.code === "LIMIT_FILE_SIZE") {
//       return res.status(400).json({
//         success: false,
//         message: "Each PDF file must be less than 5 MB",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     // CAST ERROR

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid value for ${error.path}`,
//       });
//     }

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       const duplicateField = Object.keys(error.keyPattern || {})[0];

//       return res.status(400).json({
//         success: false,
//         message: `${duplicateField} already exists`,
//       });
//     }

//     // SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

export const createAgencyPublic = async (req, res) => {
  try {
    const {
      agencyName,
      gstNo,
      address,
      city,
      state,
      country,
      tan,
      email,
      mobile,
      password,
    } = req.body;

    if (!agencyName || agencyName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Agency Name is required",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // TAN VALIDATION

    if (!tan || tan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "PAN Number is required",
      });
    }

    const normalizedTan = tan.trim().toUpperCase();

    // const tanRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

    // if (!tanRegex.test(normalizedTan)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid PAN Number",
    //   });
    // }

    // MOBILE VALIDATION

    const normalizedMobile = String(mobile || "").trim();

    if (!normalizedMobile || !/^[0-9]{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // SUBSCRIPTION VALIDATION

    const subscriptionId = "6a829b40d8d361ecce90f995";

    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(400).json({
        success: false,
        message: "Invalid Subscription",
      });
    }

    if (!subscription.isActive) {
      return res.status(400).json({
        success: false,
        message: "Subscription is not active",
      });
    }

    // PDF FILES

    const panCardFile = req.files?.panCardPDF?.[0];

    if (!panCardFile) {
      return res.status(400).json({
        success: false,
        message: "PAN Card PDF is required",
      });
    }

    // GST CERTIFICATE - OPTIONAL

    const gstCertificateFile = req.files?.gstCertificatePDF?.[0];

    // COMPANY REGISTRATION - OPTIONAL

    const companyRegistrationFile = req.files?.companyRegistrationPDF?.[0];

    // FILE PATHS

    const panCardPDF = `/uploads/agencyDocuments/${panCardFile.filename}`;

    const gstCertificatePDF = gstCertificateFile
      ? `/uploads/agencyDocuments/${gstCertificateFile.filename}`
      : undefined;

    const companyRegistrationPDF = companyRegistrationFile
      ? `/uploads/agencyDocuments/${companyRegistrationFile.filename}`
      : undefined;

    // GST NORMALIZATION

    const normalizedGstNo =
      gstNo === undefined || gstNo === null || String(gstNo).trim() === ""
        ? undefined
        : String(gstNo).trim().toUpperCase();

    // GST VALIDATION

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (normalizedGstNo && !gstRegex.test(normalizedGstNo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST Number",
      });
    }

    // DUPLICATE EMAIL - AGENCY

    const agencyEmailExists = await Agency.findOne({
      email: normalizedEmail,
    });

    if (agencyEmailExists) {
      return res.status(400).json({
        success: false,
        message: "Agency email already exists",
      });
    }

    // GST DUPLICATE CHECK

    if (normalizedGstNo) {
      const gstExists = await Agency.findOne({
        gstNo: normalizedGstNo,
      });

      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    // TAN DUPLICATE CHECK

    const tanExists = await Agency.findOne({
      tan: normalizedTan,
    });

    if (tanExists) {
      return res.status(400).json({
        success: false,
        message: "TAN Number already exists",
      });
    }

    // CREATE AGENCY DATA
    const agencyData = {
      agencyName: agencyName.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",
      email: normalizedEmail,
      mobile: normalizedMobile,
      tan: normalizedTan,
      subscriptionId: subscription._id,
      credits: subscription.credits,
      panCardPDF,
      gstCertificatePDF,
      companyRegistrationPDF,
      isActive: true,
      isApproved: false,
      createdBy: null,
      createdDate: new Date(),
    };

    // ADD GST ONLY IF PROVIDED
    if (normalizedGstNo) {
      agencyData.gstNo = normalizedGstNo;
    }

    // CREATE AGENCY
    const agency = await Agency.create(agencyData);

    // SEND EMAIL

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,

        to: normalizedEmail,

        subject: "Agency Registration Submitted Successfully",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
            "
          >

            <h2>
              Hello ${agencyName.trim()},
            </h2>

            <p>
              Your agency registration has been
              submitted successfully.
            </p>

            <p>
              Your application has been sent to
              the administrator for approval.
            </p>

            <p>
              Your account will be activated once
              the administrator approves your
              application.
            </p>

            <hr />

            <h3>
              Registration Details
            </h3>

            <table
              border="1"
              cellpadding="8"
              cellspacing="0"
              style="
                border-collapse: collapse;
              "
            >

              <tr>
                <td>
                  <strong>Agency Name</strong>
                </td>

                <td>
                  ${agencyName.trim()}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Email</strong>
                </td>

                <td>
                  ${normalizedEmail}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Mobile</strong>
                </td>

                <td>
                  ${normalizedMobile}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Status</strong>
                </td>

                <td>
                  Pending Admin Approval
                </td>
              </tr>

            </table>

            <br />

            <p>
              You will be able to access your
              account after administrator approval.
            </p>

            <p>
              Thank you.
            </p>

          </div>
        `,
      });
    } catch (emailError) {
      // Email fail hone par registration fail nahi hoga
      console.log("Email sending failed:", emailError);
    }

    // SUCCESS RESPONSE

    return res.status(201).json({
      success: true,

      message:
        "Agency has been created successfully and has been sent to the admin for approval.",

      data: {
        agency: {
          _id: agency._id,
          agencyName: agency.agencyName,
          gstNo: agency.gstNo,
          address: agency.address,
          city: agency.city,
          state: agency.state,
          country: agency.country,
          tan: agency.tan,
          email: agency.email,
          mobile: agency.mobile,
          subscriptionId: agency.subscriptionId,
          credits: agency.credits,
          panCardPDF: agency.panCardPDF,
          gstCertificatePDF: agency.gstCertificatePDF,
          companyRegistrationPDF: agency.companyRegistrationPDF,
          isActive: agency.isActive,
          isApproved: agency.isApproved,
          createdBy: agency.createdBy,
          updatedBy: agency.updatedBy,
          createdDate: agency.createdDate,
          updatedDate: agency.updatedDate,
        },
      },
    });
  } catch (error) {
    // ERROR LOG

    console.error("createAgencyPublic Error:", error);

    // MULTER FILE ERROR

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Each PDF file must be less than 5 MB",
      });
    }

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // CAST ERROR

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // DUPLICATE KEY ERROR

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // SERVER ERROR

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const approveAgencyAndCreateUser = async (req, res) => {
  try {
    const { agencyId } = req.body;

    const password = "123";

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }
 

    // FIND AGENCY

    const agency = await Agency.findById(agencyId);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // CHECK ALREADY APPROVED

    if (agency.isApproved === true) {
      return res.status(400).json({
        success: false,
        message: "Agency is already approved",
      });
    }

    // CHECK AGENCY EMAIL USER

    const existingUser = await User.findOne({
      email: agency.email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // CREATE USER

    const user = await User.create({
      name: agency.agencyName,
      email: agency.email,
      password: password,
      mobileNo: agency.mobile,
      UserRole: "Agency",
      refid: agency._id,
      refModel: "Agency",
      createby: req.user?._id || null,
      isActive: true,
    });

    // APPROVE AGENCY
    agency.isApproved = true;
    agency.isActive = true;
    agency.updatedBy = req.user?._id || null;
    agency.updatedDate = new Date();
    await agency.save();

    // SEND APPROVAL EMAIL
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,

        to: agency.email,

        subject: "Agency Registration Approved",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            "
          >

            <h2>
              Hello ${agency.agencyName},
            </h2>

            <p>
              Congratulations!
            </p>

            <p>
              Your agency registration has been
              <strong>approved by the administrator</strong>.
            </p>

            <p>
              Your agency account is now active and
              you can login to the system.
            </p>

            <hr />

            <h3>
              Agency Details
            </h3>

            <table
              border="1"
              cellpadding="8"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
              "
            >

              <tr>
                <td>
                  <strong>Agency Name</strong>
                </td>

                <td>
                  ${agency.agencyName}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Email</strong>
                </td>

                <td>
                  ${agency.email}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Mobile</strong>
                </td>

                <td>
                  ${agency.mobile}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>TAN</strong>
                </td>

                <td>
                  ${agency.tan}
                </td>
              </tr>

              ${
                agency.gstNo
                  ? `
              <tr>
                <td>
                  <strong>GST Number</strong>
                </td>

                <td>
                  ${agency.gstNo}
                </td>
              </tr>
              `
                  : ""
              }

              <tr>
                <td>
                  <strong>Approval Status</strong>
                </td>

                <td>
                  <strong style="color: green;">
                    Approved
                  </strong>
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Account Status</strong>
                </td>

                <td>
                  <strong style="color: green;">
                    Active
                  </strong>
                </td>
              </tr>

            </table>

            <br />

            <h3>
              Login Details
            </h3>

            <table
              border="1"
              cellpadding="8"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
              "
            >

              <tr>
                <td>
                  <strong>Email</strong>
                </td>

                <td>
                  ${agency.email}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Password</strong>
                </td>

                <td>
                  ${password}
                </td>
              </tr>

            </table>

            <br />

            <p>
              You can now login using the above
              credentials.
            </p>

            <p>
              Please keep your login credentials
              secure and do not share them with anyone.
            </p>

            <hr />

            <p>
              Thank you.
            </p>

          </div>
        `,
      });
    } catch (emailError) {
      // Email fail hone par approval fail nahi hoga
      console.log("Approval email sending failed:", emailError);
    }

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,

      message:
        "Agency approved, user created and approval email sent successfully.",

      data: {
        agency: {
          _id: agency._id,
          agencyName: agency.agencyName,
          gstNo: agency.gstNo,
          address: agency.address,
          city: agency.city,
          state: agency.state,
          country: agency.country,
          tan: agency.tan,
          email: agency.email,
          mobile: agency.mobile,
          subscriptionId: agency.subscriptionId,
          credits: agency.credits,
          panCardPDF: agency.panCardPDF,
          gstCertificatePDF: agency.gstCertificatePDF,
          companyRegistrationPDF: agency.companyRegistrationPDF,
          isActive: agency.isActive,
          isApproved: agency.isApproved,
          createdBy: agency.createdBy,
          updatedBy: agency.updatedBy,
          createdDate: agency.createdDate,
          updatedDate: agency.updatedDate,
        },

        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobileNo: user.mobileNo,
          UserRole: user.UserRole,
          refid: user.refid,
          refModel: user.refModel,
          isActive: user.isActive,
          createdate: user.createdate,
          createby: user.createby,
          updateby: user.updateby,
          updatedate: user.updatedate,
        },
      },
    });
  } catch (error) {
    // ERROR LOG

    console.error("approveAgencyAndCreateUser Error:", error);

    // VALIDATION ERROR

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // CAST ERROR

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // DUPLICATE KEY

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // SERVER ERROR

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
