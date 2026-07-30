import mongoose from "mongoose";
import nodemailer from "nodemailer";

import ProfileManager from "../models/ProfileManagerSchema.js";
import EmploymentVerificationLog from "../models/EmploymentVerificationLogSchema.js";
import { deductAgencyCredits } from "./creditService.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";

// export const createEmploymentVerificationLog = async (req, res) => {
//   try {
//     const { profileId, employmentDetailsId } = req.body;

//     // Profile Id Validation
//     if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid Profile Id is required",
//       });
//     }

//     // Employment Details Id Validation
//     if (
//       !employmentDetailsId ||
//       !mongoose.Types.ObjectId.isValid(employmentDetailsId)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid Employment Details Id is required",
//       });
//     }

//     // Login User
//     const createdBy = req.user?.id;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Agency Id
//     const agencyId = req.user?.refid;

//     if (!agencyId) {
//       return res.status(400).json({
//         success: false,
//         message: "Agency not assigned to user",
//       });
//     }

//     // Find Profile
//     const profile = await ProfileManager.findById(profileId);

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: "Profile not found",
//       });
//     }

//     // Find Employment Details
//     const employment = profile.employmentDetails.id(employmentDetailsId);

//     if (!employment) {
//       return res.status(404).json({
//         success: false,
//         message: "Employment record not found",
//       });
//     }

//     // Employer Check
//     if (!employment.employerId) {
//       return res.status(400).json({
//         success: false,
//         message: "Employer Id not found in employment details",
//       });
//     }

//     // Duplicate Check
//     const alreadyExist = await EmploymentVerificationLog.findOne({
//       profileId,
//       employmentDetailsId,
//     });

//     if (alreadyExist) {
//       return res.status(400).json({
//         success: false,
//         message: "Employment Verification already created.",
//       });
//     }

//     // Create Verification Log

//     const verification = new EmploymentVerificationLog({
//       profileId,
//       employmentDetailsId,
//       employedName: employment.employedName,
//       employerId: employment.employerId,
//       designation: employment.designation || "",
//       jobStartDate: employment.jobStartDate,
//       jobEndDate: employment.jobEndDate,
//       salary: employment.salary,
//       jobAddress: employment.jobAddress,
//       status: "Pending",
//       result: "Not Verified",
//       createdBy,
//     });

//     const saveVerification = await verification.save();

//     // Deduct Credits
//     await deductAgencyCredits(agencyId, 5);

//     // Send Email
//     try {
//       if (profile.email) {
//         const transporter = nodemailer.createTransport({
//           service: "gmail",

//           auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
//           },

//           tls: {
//             rejectUnauthorized: false,
//           },
//         });

//         await transporter.sendMail({
//           from: process.env.EMAIL_USER,
//           to: profile.email,
//           subject: "Employment Verification Started",

//           html: `

//           <h2>Hello ${profile.candidateName}</h2>

//           <p>
//           Your employment verification request has been created successfully.
//           </p>

//           <table border="1" cellpadding="8">

//           <tr>
//           <td><b>Company Name</b></td>
//           <td>${employment.employedName}</td>
//           </tr>

//           <tr>
//           <td><b>Designation</b></td>
//           <td>${employment.designation || "-"}</td>
//           </tr>

//           <tr>
//           <td><b>Joining Date</b></td>
//           <td>${employment.jobStartDate || "-"}</td>
//           </tr>

//           <tr>
//           <td><b>Last Working Date</b></td>
//           <td>${employment.jobEndDate || "-"}</td>
//           </tr>

//           <tr>
//           <td><b>Salary</b></td>
//           <td>${employment.salary || "-"}</td>
//           </tr>

//           <tr>
//           <td><b>Status</b></td>
//           <td>Pending</td>
//           </tr>

//           </table>

//           <p>
//           We will notify you once verification is completed.
//           </p>

//           `,
//         });
//       }
//     } catch (emailError) {
//       console.log("Email sending failed:", emailError.message);
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Employment Verification created successfully.",
//       data: saveVerification,
//     });
//   } catch (error) {
//     console.log(error);

//     if (error.message === "Insufficient credits") {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient credits. Please add credits.",
//       });
//     }

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((e) => e.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const createEmploymentVerificationLog = async (req, res) => {
  try {
    const { profileId, employmentDetailsId } = req.body;

    // Profile Id Validation
    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Profile Id is required",
      });
    }

    // Employment Details Id Validation
    if (
      !employmentDetailsId ||
      !mongoose.Types.ObjectId.isValid(employmentDetailsId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid Employment Details Id is required",
      });
    }

    // Login User
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Agency Id
    const agencyId = req.user?.refid;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: "Agency not assigned to user",
      });
    }

    // Find Profile
    const profile = await ProfileManager.findById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Find Employment Details
    const employment = profile.employmentDetails.id(employmentDetailsId);

    if (!employment) {
      return res.status(404).json({
        success: false,
        message: "Employment record not found",
      });
    }

    // Employer Check
    if (!employment.employerId) {
      return res.status(400).json({
        success: false,
        message: "Employer Id not found in employment details",
      });
    }

    // Find Employer
    const employer = await MasterEmployer.findById(employment.employerId);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Duplicate Check
    const alreadyExist = await EmploymentVerificationLog.findOne({
      profileId,
      employmentDetailsId,
    });

    if (alreadyExist) {
      return res.status(400).json({
        success: false,
        message: "Employment Verification already created.",
      });
    }

    // Create Verification Log
    const verification = new EmploymentVerificationLog({
      profileId,
      employmentDetailsId,
      employedName: employment.employedName,
      employerId: employment.employerId,
      designation: employment.designation || "",
      jobStartDate: employment.jobStartDate,
      jobEndDate: employment.jobEndDate,
      salary: employment.salary,
      jobAddress: employment.jobAddress,
      status: "Pending",
      result: "Not Verified",
      createdBy,
    });

    const saveVerification = await verification.save();

    // Deduct Credits
    await deductAgencyCredits(agencyId, 5);

    // Send Email To Employer
    try {
      if (employer.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: employer.email,
          subject: "Employment Verification Request",

          html: `
            <h2>Hello ${employer.name},</h2>

            <p>
              A new employment verification request has been submitted for the following candidate.
            </p>

            <table border="1" cellpadding="8" cellspacing="0">

              <tr>
                <td><b>Candidate Name</b></td>
                <td>${profile.candidateName}</td>
              </tr>

              <tr>
                <td><b>Candidate Email</b></td>
                <td>${profile.email}</td>
              </tr>

              <tr>
                <td><b>Candidate Mobile</b></td>
                <td>${profile.mobile}</td>
              </tr>

              <tr>
                <td><b>Company Name</b></td>
                <td>${employment.employedName}</td>
              </tr>

              <tr>
                <td><b>Designation</b></td>
                <td>${employment.designation || "-"}</td>
              </tr>

              <tr>
                <td><b>Joining Date</b></td>
                <td>${employment.jobStartDate || "-"}</td>
              </tr>

              <tr>
                <td><b>Last Working Date</b></td>
                <td>${employment.jobEndDate || "-"}</td>
              </tr>

              <tr>
                <td><b>Salary</b></td>
                <td>${employment.salary || "-"}</td>
              </tr>

              <tr>
                <td><b>Job Address</b></td>
                <td>${employment.jobAddress || "-"}</td>
              </tr>

              <tr>
                <td><b>Status</b></td>
                <td>Pending</td>
              </tr>

            </table>

            <br/>

            <p>
              Kindly verify the employment details and update the verification status.
            </p>

            <p>
              Thanks,<br/>
              Employment Verification Team
            </p>
          `,
        });
      }
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Employment Verification created successfully.",
      data: saveVerification,
    });
  } catch (error) {
    console.log(error);

    if (error.message === "Insufficient credits") {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please add credits.",
      });
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getEmploymentVerificationLogs = async (req, res) => {
  try {
    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const verificationList = await EmploymentVerificationLog.find({
      createdBy,
    })
      .populate("employerId", "employerName")
      .sort({
        createdDate: -1,
      });

    const data = verificationList.map((verification) => ({
      id: verification._id,
      profileId: verification.profileId,
      employmentDetailsId: verification.employmentDetailsId,
      employedName: verification.employedName,
      employerId: verification.employerId?._id || verification.employerId,
      employerName: verification.employerId?.employerName || null,
      designation: verification.designation,
      jobStartDate: verification.jobStartDate,
      jobEndDate: verification.jobEndDate,
      salary: verification.salary,
      jobAddress: verification.jobAddress,
      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      createdBy: verification.createdBy,
      verifiedBy: verification.verifiedBy,
      verifiedDate: verification.verifiedDate,
      createdDate: verification.createdDate,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Employment Verification Logs",
    });
  }
};

export const getEmploymentVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const verification = await EmploymentVerificationLog.findOne({
      _id: id,
      createdBy,
    }).populate("employerId", "employerName");

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification not found",
      });
    }

    const data = {
      id: verification._id,
      profileId: verification.profileId,
      employmentDetailsId: verification.employmentDetailsId,
      employedName: verification.employedName,
      employerId: verification.employerId?._id || verification.employerId,
      employerName: verification.employerId?.employerName || null,
      designation: verification.designation,
      jobStartDate: verification.jobStartDate,
      jobEndDate: verification.jobEndDate,
      salary: verification.salary,
      jobAddress: verification.jobAddress,
      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      createdBy: verification.createdBy,
      verifiedBy: verification.verifiedBy,
      verifiedDate: verification.verifiedDate,
      createdDate: verification.createdDate,
    };

    return res.status(200).json({
      success: true,
      message: "Employment Verification fetched successfully",
      data,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// export const updateEmploymentVerificationLog = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const { status, remarks, result } = req.body;

//     // Validate Id
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Employment Verification Id",
//       });
//     }

//     const createdBy = req.user?.id || null;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Find Verification
//     const verification = await EmploymentVerificationLog.findById(id);

//     if (!verification) {
//       return res.status(404).json({
//         success: false,
//         message: "Employment Verification not found",
//       });
//     }

//     // Deduct Credits when status changes to Verified
//     if (status === "Verified" && verification.status !== "Verified") {
//       const agencyId = req.user?.refid;

//       if (!agencyId) {
//         return res.status(400).json({
//           success: false,
//           message: "Agency not assigned to user",
//         });
//       }

//       await deductAgencyCredits(agencyId, 5);
//     }

//     // Status Update
//     if (status !== undefined) {
//       const validStatus = ["Pending", "Verified", "Rejected", "Not Found"];

//       if (!validStatus.includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Status",
//         });
//       }

//       verification.status = status;
//     }

//     // Remarks Update
//     if (remarks !== undefined) {
//       verification.remarks = remarks.trim();
//     }

//     // Result Update
//     if (result !== undefined) {
//       const validResult = ["Ok", "No Found", "Not Verified"];

//       if (!validResult.includes(result)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid Result",
//         });
//       }

//       verification.result = result;
//     }

//     verification.verifiedBy = createdBy;
//     verification.verifiedDate = new Date();

//     const updatedVerification = await verification.save();

//     return res.status(200).json({
//       success: true,
//       message: "Employment Verification updated successfully",
//       data: updatedVerification,
//     });
//   } catch (error) {
//     console.log(error);

//     if (error.message === "Insufficient credits") {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient credits. Please add credits.",
//       });
//     }

//     if (error.message === "Agency not found") {
//       return res.status(404).json({
//         success: false,
//         message: "Agency not found",
//       });
//     }

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: messages.join(", "),
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const updateEmploymentVerificationLog = async (req, res) => {
  try {
    const { id } = req.params;

    const { status, remarks, result } = req.body;

    // Validate Id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Find Verification
    const verification = await EmploymentVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification not found",
      });
    }

    // Deduct Credits when status changes to Verified
    if (status === "Verified" && verification.status !== "Verified") {
      const agencyId = req.user?.refid;

      if (!agencyId) {
        return res.status(400).json({
          success: false,
          message: "Agency not assigned to user",
        });
      }

      await deductAgencyCredits(agencyId, 5);
    }

    // Status Update
    if (status !== undefined) {
      const validStatus = ["Pending", "Verified", "Rejected", "Not Found"];

      if (!validStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Status",
        });
      }

      verification.status = status;
    }

    // Remarks Update
    if (remarks !== undefined) {
      verification.remarks = remarks.trim();
    }

    // Result Update
    if (result !== undefined) {
      const validResult = ["Ok", "No Found", "Not Verified"];

      if (!validResult.includes(result)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Result",
        });
      }

      verification.result = result;
    }

    verification.verifiedBy = createdBy;
    verification.verifiedDate = new Date();

    const updatedVerification = await verification.save();

    // Get Profile
    const profile = await ProfileManager.findById(verification.profileId);

    // Get Employer
    const employer = await MasterEmployer.findById(verification.employerId);

    // Send Email To Employer
    try {
      if (employer && employer.email) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS.replace(/\s/g, ""),
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: employer.email,
          subject: "Employment Verification Status Updated",

          html: `
            <h2>Hello ${employer.name},</h2>

            <p>
              Employment verification has been updated successfully.
            </p>

            <table border="1" cellpadding="8" cellspacing="0">

              <tr>
                <td><b>Candidate Name</b></td>
                <td>${profile?.candidateName || "-"}</td>
              </tr>

              <tr>
                <td><b>Candidate Email</b></td>
                <td>${profile?.email || "-"}</td>
              </tr>

              <tr>
                <td><b>Candidate Mobile</b></td>
                <td>${profile?.mobile || "-"}</td>
              </tr>

              <tr>
                <td><b>Company Name</b></td>
                <td>${verification.employedName}</td>
              </tr>

              <tr>
                <td><b>Designation</b></td>
                <td>${verification.designation || "-"}</td>
              </tr>

              <tr>
                <td><b>Status</b></td>
                <td>${verification.status}</td>
              </tr>

              <tr>
                <td><b>Result</b></td>
                <td>${verification.result}</td>
              </tr>

              <tr>
                <td><b>Remarks</b></td>
                <td>${verification.remarks || "-"}</td>
              </tr>

              <tr>
                <td><b>Verified Date</b></td>
                <td>${verification.verifiedDate}</td>
              </tr>

            </table>

            <br/>

            <p>
              Kindly check the updated verification details.
            </p>

            <p>
              Thanks,<br/>
              Employment Verification Team
            </p>
          `,
        });
      }
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Employment Verification updated successfully",
      data: updatedVerification,
    });
  } catch (error) {
    console.log(error);

    if (error.message === "Insufficient credits") {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please add credits.",
      });
    }

    if (error.message === "Agency not found") {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
