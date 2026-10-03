import mongoose from "mongoose";
import nodemailer from "nodemailer";

import ProfileManager from "../models/ProfileManagerSchema.js";
import EmploymentVerificationLog from "../models/EmploymentVerificationLogSchema.js";
// import { deductAgencyCredits } from "./creditService.js";
import { deductCredits } from "./creditService.js";
import CreditTransaction from "../models/creditTransactionSchema.js";
import Agency from "../models/AgenciesSchema.js";
// import MasterEmployer  from "../models/MasterEmployerSchema.js";

import MasterEmployer from "../models/MasterEmployerSchema.js";
import readEmails from "../emailReaderService.js";
import User from "../models/User.js";
import path from "path";
import fs from "fs";

 
export const createEmploymentVerificationLog = async (req, res) => {
  try {
    const { profileId, employmentDetailsId } = req.body;

    // 1. PROFILE ID VALIDATION

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Profile Id is required",
      });
    }

    // 2. EMPLOYMENT DETAILS ID VALIDATION

    if (
      !employmentDetailsId ||
      !mongoose.Types.ObjectId.isValid(employmentDetailsId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid Employment Details Id is required",
      });
    }

    // 3. LOGIN USER

    const createdBy = req.user?.id || req.user?._id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // 4. REFERENCE ID & MODEL

    const refid = req.user?.refid;
    const refModel = req.user?.refModel;

    if (!refid) {
      return res.status(400).json({
        success: false,
        message: "Reference ID not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(refid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Reference ID",
      });
    }

    if (!refModel) {
      return res.status(400).json({
        success: false,
        message: "Reference model not found",
      });
    }

    if (!["Agency", "MasterEmployer"].includes(refModel)) {
      return res.status(400).json({
        success: false,
        message: "Only Agency or MasterEmployer can create verification",
      });
    }

    // 5. FIND PROFILE

    const profile = await ProfileManager.findById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // 6. FIND EMPLOYMENT DETAILS

    const employment = profile.employmentDetails.id(employmentDetailsId);

    if (!employment) {
      return res.status(404).json({
        success: false,
        message: "Employment record not found",
      });
    }

    // 7. EMPLOYER ID CHECK

    if (!employment.employerId) {
      return res.status(400).json({
        success: false,
        message: "Employer Id not found in employment details",
      });
    }

    // 8. FIND EMPLOYER

    const employer = await MasterEmployer.findById(employment.employerId);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // 9. FIND USER LINKED WITH EMPLOYER

    const user = await User.findOne({
      refid: employer._id,
      refModel: "MasterEmployer",
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found for this Employer",
      });
    }

    // 10. DUPLICATE CHECK

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

    // 11. GET ORGANIZATION

    let organization;

    if (refModel === "Agency") {
      organization = await Agency.findById(refid);
    } else if (refModel === "MasterEmployer") {
      organization = await MasterEmployer.findById(refid);
    }

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: `${refModel} not found`,
      });
    }

    // 12. CREDIT AMOUNT

    const creditAmount = 5;

    // 13. BALANCE BEFORE

    const balanceBefore = Number(organization.credits || 0);

    // 14. CHECK INSUFFICIENT CREDITS

    if (balanceBefore < creditAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please add credits.",
        data: {
          balanceBefore,
          requiredCredits: creditAmount,
          balanceAfter: balanceBefore,
        },
      });
    }

    // 15. DEDUCT CREDITS

    await deductCredits({
      refid,
      refModel,
      amount: creditAmount,
    });

    // 16. BALANCE AFTER

    const balanceAfter = balanceBefore - creditAmount;

    // 17. CREATE EMPLOYMENT VERIFICATION

    const verification = new EmploymentVerificationLog({
      profileId,
      employmentDetailsId,

      employedName: employment.employedName,

      employerId: employment.employerId,

      designation: employment.designation || "",

      employeeId: employment.employeeId || "",

      jobStartDate: employment.jobStartDate,

      jobEndDate: employment.jobEndDate,

      salary: employment.salary,

      jobAddress: employment.jobAddress,

      attachment: employment.attachment,

      status: "Pending",

      result: "Not Verified",

      createdBy,
    });

    const saveVerification = await verification.save();

    // 18. VERIFICATION EMAIL ID

    saveVerification.verificationEmailId = String(saveVerification._id);

    await saveVerification.save();

    // 19. CREATE CREDIT TRANSACTION

    const transactionData = {
      type: "DEBIT",

      amount: creditAmount,

      balanceBefore,

      balanceAfter,

      reason: "Credits deducted for Employment Verification",

      action: "EMPLOYMENT_VERIFICATION",

      referenceId: saveVerification._id,

      referenceModel: "EmploymentVerificationLog",

      createdBy,

      createdDate: new Date(),
    };

    // 20. FIND EXISTING CREDIT TRANSACTION

    let creditTransaction = await CreditTransaction.findOne({
      userId: req.user?._id || req.user?.id,
      refid,
      refModel,
    });

    // 21. UPDATE EXISTING CREDIT TRANSACTION

    if (creditTransaction) {
      creditTransaction.transactions.push(transactionData);

      await creditTransaction.save();

      console.log("Existing CreditTransaction updated:", creditTransaction._id);
    } else {
      // 22. CREATE NEW CREDIT TRANSACTION

      creditTransaction = await CreditTransaction.create({
        userId: req.user?._id || req.user?.id,

        refid,

        refModel,

        transactions: [transactionData],
      });

      console.log("New CreditTransaction created:", creditTransaction._id);
    }

    // 23. VERIFICATION URL

    const verificationUrl =
      `${process.env.FRONTEND_URL}/EmploymentVerificationView/` +
      `${employmentDetailsId}/${user._id}`;

    // 24. SEND EMAIL TO EMPLOYER

    try {
      if (!employer.email) {
        saveVerification.remarks = "Employer email is not available.";

        await saveVerification.save();
      } else {
        // SMTP TRANSPORTER

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,

          port: Number(process.env.SMTP_PORT),

          secure: false,

          auth: {
            user: process.env.EMAIL_USER,

            pass: process.env.EMAIL_PASS,
          },
        });

        // ATTACHMENT CHECK

        if (!employment.attachment) {
          throw new Error("Employment attachment path is missing in database");
        }

        const relativeAttachmentPath = employment.attachment
          .replace(/^[/\\]+/, "")
          .replace(/\//g, path.sep);

        const attachmentPath = path.join(process.cwd(), relativeAttachmentPath);

        // FILE EXISTS CHECK

        if (!fs.existsSync(attachmentPath)) {
          throw new Error(
            `Employment attachment file not found on server: ${attachmentPath}`,
          );
        }

        // EMAIL SUBJECT

        const emailSubject = `Employment Verification Request #${saveVerification._id}`;

        // SEND EMAIL

        const emailInfo = await transporter.sendMail({
          from: process.env.EMAIL_USER,

          to: employer.email,

          subject: emailSubject,

          html: `
            <h2>Hello ${employer.name || "Employer"},</h2>

            <p>
              A new employment verification request has been
              submitted for the following candidate.
            </p>

            <table
              border="1"
              cellpadding="8"
              cellspacing="0"
              style="border-collapse: collapse;"
            >

              <tr>
                <td><b>Verification ID</b></td>
                <td>${saveVerification._id}</td>
              </tr>

              <tr>
                <td><b>Candidate Name</b></td>
                <td>${profile.candidateName || "-"}</td>
              </tr>

              <tr>
                <td><b>Candidate Email</b></td>
                <td>${profile.email || "-"}</td>
              </tr>

              <tr>
                <td><b>Candidate Mobile</b></td>
                <td>${profile.mobile || "-"}</td>
              </tr>

              <tr>
                <td><b>Company Name</b></td>
                <td>${employment.employedName || "-"}</td>
              </tr>

              <tr>
                <td><b>Employee ID</b></td>
                <td>${employment.employeeId || "-"}</td>
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

            </table>

            <br/>

            <p>
              You can verify the employment details by replying
              to this email or by clicking the
              "Verify Employment" button below.
            </p>

            <br/>

            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #0d6efd;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
              "
            >
              Verify Employment
            </a>

            <br/>
            <br/>

            <p>
              Thanks,<br/>
              Employment Verification Team
            </p>
          `,

          attachments: [
            {
              filename: path.basename(attachmentPath),

              path: attachmentPath,
            },
          ],
        });

        // SAVE EMAIL DETAILS

        saveVerification.sentDate = new Date();

        saveVerification.status = "Pending";

        saveVerification.result = "Not Verified";

        saveVerification.remarks =
          `Verification request sent successfully by email. ` +
          `To: ${employer.email}. ` +
          `Subject: ${emailSubject}. ` +
          `Message ID: ${emailInfo.messageId}. ` +
          `SMTP Response: ${emailInfo.response || "N/A"}`;

        await saveVerification.save();
      }
    } catch (emailError) {
      // EMAIL ERROR

      console.log(
        "Employment verification email sending failed:",
        emailError.message,
      );

      saveVerification.status = "Pending";

      saveVerification.result = "Not Verified";

      saveVerification.remarks =
        `Email sending failed. ` +
        `To: ${employer.email || "N/A"}. ` +
        `Error: ${emailError.message}`;

      await saveVerification.save();

      // Credit refund intentionally nahi kiya gaya.
      // Verification request already create ho chuki hai.
    }

    // 25. FINAL RESPONSE

    return res.status(201).json({
      success: true,

      message: "Employment Verification created successfully.",

      verificationMethod: "Email",

      data: saveVerification,

      creditTransaction: {
        transactionId: creditTransaction._id,

        type: "DEBIT",

        amount: creditAmount,

        balanceBefore,

        balanceAfter,

        action: "EMPLOYMENT_VERIFICATION",

        referenceId: saveVerification._id,

        referenceModel: "EmploymentVerificationLog",
      },
    });
  } catch (error) {
    // ERROR LOG

    console.log("createEmploymentVerificationLog error:", error);

    // INSUFFICIENT CREDITS

    if (error.message === "Insufficient credits") {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please add credits.",
      });
    }

    // AGENCY NOT FOUND

    if (error.message === "Agency not found") {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // MASTER EMPLOYER NOT FOUND

    if (error.message === "MasterEmployer not found") {
      return res.status(404).json({
        success: false,
        message: "MasterEmployer not found",
      });
    }

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // INTERNAL SERVER ERROR

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

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

//     // Reference ID & Model
//     const refid = req.user?.refid;
//     const refModel = req.user?.refModel;

//     if (!refid) {
//       return res.status(400).json({
//         success: false,
//         message: "Reference ID not found",
//       });
//     }

//     if (!refModel) {
//       return res.status(400).json({
//         success: false,
//         message: "Reference model not found",
//       });
//     }

//     if (!["Agency", "MasterEmployer"].includes(refModel)) {
//       return res.status(400).json({
//         success: false,
//         message: "Only Agency or MasterEmployer can create verification",
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

//     // Find Employer
//     const employer = await MasterEmployer.findById(employment.employerId);

//     if (!employer) {
//       return res.status(404).json({
//         success: false,
//         message: "Employer not found",
//       });
//     }

//     // Find User linked with Employer
//     const user = await User.findOne({
//       refid: employer._id,
//       refModel: "MasterEmployer",
//       isActive: true,
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found for this Employer",
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

//     // DEDUCT CREDITS

//     const creditAmount = 5;

//     const creditResult = await deductCredits({
//       refid,
//       refModel,
//       amount: creditAmount,
//     });

//     /*
//       deductCredits() se ideally ye return hona chahiye:

//       {
//         balanceBefore: 100,
//         balanceAfter: 95
//       }

//       Agar aapka deductCredits() abhi ye return nahi karta,
//       to usme balanceBefore aur balanceAfter return karna hoga.
//     */

//     const balanceBefore = Number(
//       creditResult?.balanceBefore ?? 0
//     );

//     const balanceAfter = Number(
//       creditResult?.balanceAfter ?? 0
//     );

//     // CREATE EMPLOYMENT VERIFICATION LOG

//     const verification = new EmploymentVerificationLog({
//       profileId,
//       employmentDetailsId,
//       employedName: employment.employedName,
//       employerId: employment.employerId,
//       designation: employment.designation || "",
//       employeeId: employment.employeeId || "",
//       jobStartDate: employment.jobStartDate,
//       jobEndDate: employment.jobEndDate,
//       salary: employment.salary,
//       jobAddress: employment.jobAddress,
//       attachment: employment.attachment,

//       status: "Pending",
//       result: "Not Verified",
//       createdBy,
//     });

//     const saveVerification = await verification.save();

//     // Verification Email ID
//     saveVerification.verificationEmailId = String(
//       saveVerification._id
//     );

//     await saveVerification.save();

//     // SAVE CREDIT TRANSACTION

//     const transactionData = {
//       type: "DEBIT",

//       amount: creditAmount,

//       balanceBefore,
//       balanceAfter,

//       reason: `Credits deducted for Employment Verification`,

//       action: "EMPLOYMENT_VERIFICATION",

//       // Important:
//       // Ye transaction kis verification ke liye create hua
//       referenceId: saveVerification._id,

//       referenceModel: "EmploymentVerificationLog",

//       createdBy,

//       createdDate: new Date(),
//     };

//     // Find existing CreditTransaction document
//     let creditTransaction = await CreditTransaction.findOne({
//       userId: req.user._id,
//       refid,
//       refModel,
//     });

//     if (creditTransaction) {
//       // Existing document me transaction add karo
//       creditTransaction.transactions.push(transactionData);

//       await creditTransaction.save();

//       console.log(
//         "Existing CreditTransaction updated:",
//         creditTransaction._id
//       );
//     } else {
//       // Agar document nahi hai to new document create karo
//       creditTransaction = await CreditTransaction.create({
//         userId: req.user._id,
//         refid,
//         refModel,
//         transactions: [transactionData],
//       });

//       console.log(
//         "New CreditTransaction created:",
//         creditTransaction._id
//       );
//     }

//     // VERIFICATION URL

//     const verificationUrl =
//       `${process.env.FRONTEND_URL}/EmploymentVerificationView/` +
//       `${employmentDetailsId}/${user._id}`;

//     // SEND EMAIL TO EMPLOYER

//     try {
//       if (employer.email) {
//         const transporter = nodemailer.createTransport({
//           host: process.env.SMTP_HOST,
//           port: Number(process.env.SMTP_PORT),
//           secure: false,
//           auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//           },
//         });

//         if (!employment.attachment) {
//           throw new Error(
//             "Employment attachment path is missing in database"
//           );
//         }

//         const relativeAttachmentPath = employment.attachment
//           .replace(/^[/\\]+/, "")
//           .replace(/\//g, path.sep);

//         const attachmentPath = path.join(
//           process.cwd(),
//           relativeAttachmentPath
//         );

//         if (!fs.existsSync(attachmentPath)) {
//           throw new Error(
//             `Employment attachment file not found on server: ${attachmentPath}`
//           );
//         }

//         const emailInfo = await transporter.sendMail({
//           from: process.env.EMAIL_USER,

//           to: employer.email,

//           subject:
//             `Employment Verification Request #${saveVerification._id}`,

//           html: `
//             <h2>Hello ${employer.name},</h2>

//             <p>
//               A new employment verification request has been submitted
//               for the following candidate.
//             </p>

//             <table
//               border="1"
//               cellpadding="8"
//               cellspacing="0"
//               style="border-collapse: collapse;"
//             >

//               <tr>
//                 <td><b>Verification ID</b></td>
//                 <td>${saveVerification._id}</td>
//               </tr>

//               <tr>
//                 <td><b>Candidate Name</b></td>
//                 <td>${profile.candidateName}</td>
//               </tr>

//               <tr>
//                 <td><b>Candidate Email</b></td>
//                 <td>${profile.email}</td>
//               </tr>

//               <tr>
//                 <td><b>Candidate Mobile</b></td>
//                 <td>${profile.mobile}</td>
//               </tr>

//               <tr>
//                 <td><b>Company Name</b></td>
//                 <td>${employment.employedName}</td>
//               </tr>

//               <tr>
//                 <td><b>Employee ID</b></td>
//                 <td>${employment.employeeId || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Designation</b></td>
//                 <td>${employment.designation || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Joining Date</b></td>
//                 <td>${employment.jobStartDate || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Last Working Date</b></td>
//                 <td>${employment.jobEndDate || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Salary</b></td>
//                 <td>${employment.salary || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Job Address</b></td>
//                 <td>${employment.jobAddress || "-"}</td>
//               </tr>

//             </table>

//             <br/>

//             <p>
//               You can verify the employment details by replying
//               to this email or by clicking the
//               "Verify Employment" button below.
//             </p>

//             <br/>

//             <a
//               href="${verificationUrl}"
//               style="
//                 display: inline-block;
//                 padding: 12px 24px;
//                 background-color: #0d6efd;
//                 color: white;
//                 text-decoration: none;
//                 border-radius: 6px;
//                 font-weight: bold;
//               "
//             >
//               Verify Employment
//             </a>

//             <br/>
//             <br/>

//             <p>
//               Thanks,<br/>
//               Employment Verification Team
//             </p>
//           `,

//           attachments: [
//             {
//               filename: path.basename(attachmentPath),
//               path: attachmentPath,
//             },
//           ],
//         });

//         // Save email details
//         saveVerification.sentDate = new Date();

//         saveVerification.status = "Pending";

//         saveVerification.result = "Not Verified";

//         saveVerification.remarks =
//           `Verification request sent successfully by email. ` +
//           `To: ${employer.email}. ` +
//           `Message ID: ${emailInfo.messageId}. ` +
//           `SMTP Response: ${emailInfo.response || "N/A"}`;

//         await saveVerification.save();
//       } else {
//         saveVerification.remarks =
//           "Employer email is not available.";

//         await saveVerification.save();
//       }
//     } catch (emailError) {
//       console.log(
//         "Email sending failed:",
//         emailError.message
//       );

//       saveVerification.status = "Pending";

//       saveVerification.result = "Not Verified";

//       saveVerification.remarks =
//         `Email sending failed. ` +
//         `To: ${employer.email || "N/A"}. ` +
//         `Error: ${emailError.message}`;

//       await saveVerification.save();

//       // Important:
//       // Email fail hone par credits refund nahi kiye ja rahe.
//       // Kyunki verification request already create ho chuki hai.
//     }

//     // FINAL RESPONSE

//     return res.status(201).json({
//       success: true,
//       message:
//         "Employment Verification created successfully.",
//       verificationMethod: "Email",
//       data: saveVerification,
//       creditTransaction: {
//         transactionId: creditTransaction._id,
//         type: "DEBIT",
//         amount: creditAmount,
//         balanceBefore,
//         balanceAfter,
//         action: "EMPLOYMENT_VERIFICATION",
//         referenceId: saveVerification._id,
//       },
//     });
//   } catch (error) {
//     console.log(
//       "createEmploymentVerificationLog error:",
//       error
//     );

//     // INSUFFICIENT CREDITS
//     if (error.message === "Insufficient credits") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Insufficient credits. Please add credits.",
//       });
//     }

//     // AGENCY NOT FOUND
//     if (error.message === "Agency not found") {
//       return res.status(404).json({
//         success: false,
//         message: "Agency not found",
//       });
//     }

//     // MASTER EMPLOYER NOT FOUND
//     if (error.message === "MasterEmployer not found") {
//       return res.status(404).json({
//         success: false,
//         message: "MasterEmployer not found",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR
//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map(
//         (e) => e.message
//       );

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     // INTERNAL SERVER ERROR
//     return res.status(500).json({
//       success: false,
//       message:
//         error.message || "Internal Server Error",
//     });
//   }
// };

export const getEmploymentVerificationLogs = async (req, res) => {
  try {
    const createdBy = req.user?.id;

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
      .populate("profileId", "candidateName email mobile")
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        createdDate: -1,
      });

    const data = verificationList.map((verification) => ({
      id: verification._id,

      // Profile Details
      profileId: verification.profileId?._id,
      candidateName: verification.profileId?.candidateName || null,
      candidateEmail: verification.profileId?.email || null,
      candidateMobile: verification.profileId?.mobile || null,

      // Employment Details
      employmentDetailsId: verification.employmentDetailsId,
      employedName: verification.employedName,
      designation: verification.designation,
      employeeId: verification.employeeId,
      jobStartDate: verification.jobStartDate,
      jobEndDate: verification.jobEndDate,
      salary: verification.salary,
      jobAddress: verification.jobAddress,

      // Employer
      employerId: verification.employerId?._id || verification.employerId,
      employerName: verification.employerId?.employerName || null,

      // Verification
      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      attachment: verification.attachment,

      verificationEmailId: verification.verificationEmailId,

      // Employer Replies
      employerReplies: verification.employerReplies || [],
      replyCount: verification.employerReplies?.length || 0,
      latestReply:
        verification.employerReplies?.length > 0
          ? verification.employerReplies[
              verification.employerReplies.length - 1
            ]
          : null,

      // Created By
      createdBy: verification.createdBy
        ? {
            id: verification.createdBy._id,
            name: verification.createdBy.name,
            email: verification.createdBy.email,
          }
        : null,

      // Verified By
      verifiedBy: verification.verifiedBy
        ? {
            id: verification.verifiedBy._id,
            name: verification.verifiedBy.name,
            email: verification.verifiedBy.email,
          }
        : null,

      verifiedDate: verification.verifiedDate,

      // Updated By
      updatedBy: verification.updatedBy
        ? {
            id: verification.updatedBy._id,
            name: verification.updatedBy.name,
            email: verification.updatedBy.email,
          }
        : null,

      updatedDate: verification.updatedDate,

      // Dates
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

    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const verification = await EmploymentVerificationLog.findOne({
      _id: id,
      createdBy,
    })
      .populate("employerId", "employerName")
      .populate("profileId", "candidateName email mobile")
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("updatedBy", "name email");

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification not found",
      });
    }

    const data = {
      id: verification._id,

      // Profile Details
      profileId: verification.profileId?._id,
      candidateName: verification.profileId?.candidateName || null,
      candidateEmail: verification.profileId?.email || null,
      candidateMobile: verification.profileId?.mobile || null,

      // Employment Details
      employmentDetailsId: verification.employmentDetailsId,
      employedName: verification.employedName,
      designation: verification.designation,
      employeeId: verification.employeeId,
      jobStartDate: verification.jobStartDate,
      jobEndDate: verification.jobEndDate,
      salary: verification.salary,
      jobAddress: verification.jobAddress,

      // Employer Details
      employerId: verification.employerId?._id || verification.employerId,
      employerName: verification.employerId?.employerName || null,

      // Verification Details
      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      attachment: verification.attachment,

      verificationEmailId: verification.verificationEmailId,

      // Employer Replies
      employerReplies: verification.employerReplies || [],
      replyCount: verification.employerReplies?.length || 0,
      latestReply:
        verification.employerReplies?.length > 0
          ? verification.employerReplies[
              verification.employerReplies.length - 1
            ]
          : null,

      // Created By
      createdBy: verification.createdBy
        ? {
            id: verification.createdBy._id,
            name: verification.createdBy.name,
            email: verification.createdBy.email,
          }
        : null,

      // Verified By
      verifiedBy: verification.verifiedBy
        ? {
            id: verification.verifiedBy._id,
            name: verification.verifiedBy.name,
            email: verification.verifiedBy.email,
          }
        : null,

      verifiedDate: verification.verifiedDate,

      // Updated By
      updatedBy: verification.updatedBy
        ? {
            id: verification.updatedBy._id,
            name: verification.updatedBy.name,
            email: verification.updatedBy.email,
          }
        : null,

      updatedDate: verification.updatedDate,

      // Dates
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
      message: "Internal Server Error",
    });
  }
};

// export const getEmploymentVerificationLogByEmploymentDetailsId = async (
//   req,
//   res,
// ) => {
//   try {
//     const createdBy = req.user?.id;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     const { employmentDetailsId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(employmentDetailsId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Employment Details Id",
//       });
//     }

//     const verification = await EmploymentVerificationLog.findOne({
//       employmentDetailsId,
//       createdBy,
//     })
//       .populate("profileId")
//       .populate("employerId", "employerName")
//       .populate("createdBy", "name email")
//       .populate("verifiedBy", "name email")
//       .populate("updatedBy", "name email");

//     if (!verification) {
//       return res.status(404).json({
//         success: false,
//         message: "Employment Verification Log not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: {
//         id: verification._id,
//         profileId: verification.profileId,
//         employmentDetailsId: verification.employmentDetailsId,

//         employedName: verification.employedName,

//         employerId: verification.employerId?._id,
//         employerName: verification.employerId?.employerName,

//         designation: verification.designation,
//         employeeId: verification.employeeId,
//         jobStartDate: verification.jobStartDate,
//         jobEndDate: verification.jobEndDate,
//         salary: verification.salary,
//         jobAddress: verification.jobAddress,

//         status: verification.status,
//         result: verification.result,
//         remarks: verification.remarks,
//         attachment: verification.attachment,

//         verificationEmailId: verification.verificationEmailId,

//         // employerReplies: verification.employerReplies,
//         employerReplies: verification.employerReplies?.slice().reverse(),

//         createdBy: verification.createdBy,
//         verifiedBy: verification.verifiedBy,
//         verifiedDate: verification.verifiedDate,

//         updatedBy: verification.updatedBy,
//         updatedDate: verification.updatedDate,

//         createdDate: verification.createdDate,
//       },
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Error fetching Employment Verification Log",
//     });
//   }
// };

export const getEmploymentVerificationLogByEmploymentDetailsId = async (
  req,
  res,
) => {
  try {
    const { employmentDetailsId } = req.params;

    // EMPLOYMENT DETAILS ID VALIDATION

    if (!mongoose.Types.ObjectId.isValid(employmentDetailsId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Details Id",
      });
    }

    // FIND VERIFICATION BY EMPLOYMENT DETAILS ID ONLY
    // createdBy ka filter nahi hai

    const verification = await EmploymentVerificationLog.findOne({
      employmentDetailsId,
    })
      .populate("profileId")
      .populate("employerId", "employerName")
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("updatedBy", "name email");

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification Log not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: verification._id,

        profileId: verification.profileId,

        employmentDetailsId: verification.employmentDetailsId,

        employedName: verification.employedName,

        employerId: verification.employerId?._id,

        employerName: verification.employerId?.employerName,

        designation: verification.designation,

        employeeId: verification.employeeId,

        jobStartDate: verification.jobStartDate,

        jobEndDate: verification.jobEndDate,

        salary: verification.salary,

        jobAddress: verification.jobAddress,

        status: verification.status,

        result: verification.result,

        remarks: verification.remarks,

        attachment: verification.attachment,

        verificationEmailId: verification.verificationEmailId,

        employerReplies:
          verification.employerReplies?.slice().reverse(),

        createdBy: verification.createdBy,

        verifiedBy: verification.verifiedBy,

        verifiedDate: verification.verifiedDate,

        updatedBy: verification.updatedBy,

        updatedDate: verification.updatedDate,

        createdDate: verification.createdDate,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching Employment Verification Log:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Error fetching Employment Verification Log",
      error: error.message,
    });
  }
};


export const verifyEmploymentVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Validate Employment Verification Id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    // Validate Remarks

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Verification remarks are required",
      });
    }

    // Login User

    const userId = req.user?.id;

    if (!userId) {
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

    // Already Verified Check

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Employment Verification is already verified",
      });
    }

    // Already Rejected Check

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Employment Verification is already rejected",
      });
    }

    // Update Verification

    verification.status = "Verified";
    verification.result = "Ok";

    // Save Remarks
    verification.remarks = remarks.trim();

    // Verified By
    verification.verifiedBy = userId;
    verification.verifiedDate = new Date();

    // Updated By
    verification.updatedBy = userId;
    verification.updatedDate = new Date();

    // Save

    await verification.save();

    // Response

    return res.status(200).json({
      success: true,
      message: "Employment Verification verified successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Verify Employment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const rejectEmploymentVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // Validate Employment Verification Id

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    // Validate Remarks

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection remarks are required",
      });
    }

    // Login User

    const userId = req.user?.id;

    if (!userId) {
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

    // Already Verified Check

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Verified Employment Verification cannot be rejected",
      });
    }

    // Already Rejected Check

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Employment Verification is already rejected",
      });
    }

    // Update Rejection Status

    verification.status = "Rejected";
    verification.result = "Not Verified";

    // Save Rejection Remarks
    verification.remarks = remarks.trim();

    // Rejection User and Date

    verification.verifiedBy = userId;
    verification.verifiedDate = new Date();

    // Updated User and Date

    verification.updatedBy = userId;
    verification.updatedDate = new Date();

    // Save

    await verification.save();

    // Response

    return res.status(200).json({
      success: true,
      message: "Employment Verification rejected successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Reject Employment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getEmploymentVerificationLogsBasemployerId = async (req, res) => {
  try {
    const { employerId, status } = req.params;

    if (!employerId) {
      return res.status(400).json({
        success: false,
        message: "employerId is required",
      });
    }

    // Status Required

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    // Validate Employer ID

    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employerId",
      });
    }

    // Validate Status

    const allowedStatuses = ["Pending", "Responded", "Verified", "Rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(
          ", ",
        )}`,
      });
    }

    const filter = {
      employerId: new mongoose.Types.ObjectId(employerId),
      status: status,
    };

    // Fetch Employment Verification Logs

    const verificationList = await EmploymentVerificationLog.find(filter)
      .populate("employerId", "employerName")
      .populate("profileId", "candidateName email mobile")
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("updatedBy", "name email")
      .sort({
        createdDate: -1,
      });

    // Format Data

    const data = verificationList.map((verification) => {
      return {
        // Main ID

        id: verification._id,

        // Profile Details

        profileId: verification.profileId?._id || null,
        candidateName: verification.profileId?.candidateName || null,
        candidateEmail: verification.profileId?.email || null,
        candidateMobile: verification.profileId?.mobile || null,
        // Employment Details
        employmentDetailsId: verification.employmentDetailsId,
        employedName: verification.employedName,
        designation: verification.designation || null,
        employeeId: verification.employeeId || null,
        jobStartDate: verification.jobStartDate || null,
        jobEndDate: verification.jobEndDate || null,
        salary: verification.salary || null,
        jobAddress: verification.jobAddress || null,
        attachment: verification.attachment,

        // Employer Details

        employerId:
          verification.employerId?._id || verification.employerId || null,
        employerName: verification.employerId?.employerName || null,

        status: verification.status || null,
        result: verification.result || null,
        remarks: verification.remarks || null,
        verificationEmailId: verification.verificationEmailId || null,

        employerReplies: verification.employerReplies || [],
        replyCount: verification.employerReplies?.length || 0,

        latestReply:
          verification.employerReplies?.length > 0
            ? verification.employerReplies[
                verification.employerReplies.length - 1
              ]
            : null,

        createdBy: verification.createdBy
          ? {
              id: verification.createdBy._id,
              name: verification.createdBy.name,
              email: verification.createdBy.email,
            }
          : null,

        verifiedBy: verification.verifiedBy
          ? {
              id: verification.verifiedBy._id,
              name: verification.verifiedBy.name,
              email: verification.verifiedBy.email,
            }
          : null,

        verifiedDate: verification.verifiedDate || null,

        updatedBy: verification.updatedBy
          ? {
              id: verification.updatedBy._id,
              name: verification.updatedBy.name,
              email: verification.updatedBy.email,
            }
          : null,

        updatedDate: verification.updatedDate || null,

        // Created Date

        createdDate: verification.createdDate || null,
      };
    });

    // Success Response

    return res.status(200).json({
      success: true,
      message: "Employment verification logs fetched successfully",
      count: data.length,
      employerId: employerId,
      status: status,
      data: data,
    });
  } catch (error) {
    console.error("getEmploymentVerificationLogsBasemployerId Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Employment Verification Logs",
      error: error.message,
    });
  }
};

// This API is used for public access.

export const getEmploymentVerificationLogByEmploymentDetailsIdWeb = async (
  req,
  res,
) => {
  try {
    const { employmentDetailsId } = req.params;

    // console.log("=================================");
    // console.log("PUBLIC EMPLOYMENT API CALLED");
    // console.log("employmentDetailsId:", employmentDetailsId);
    // console.log("=================================");

    if (!employmentDetailsId) {
      return res.status(400).json({
        success: false,
        message: "Employment Details Id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(employmentDetailsId)) {
      console.log("INVALID OBJECT ID:", employmentDetailsId);

      return res.status(400).json({
        success: false,
        message: "Invalid Employment Details Id",
      });
    }

    // console.log(
    //   "Searching MongoDB for:",
    //   new mongoose.Types.ObjectId(employmentDetailsId),
    // );

    const verification = await EmploymentVerificationLog.findOne({
      employmentDetailsId: new mongoose.Types.ObjectId(employmentDetailsId),
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification Log not found",
      });
    }

    const populatedVerification = await EmploymentVerificationLog.findById(
      verification._id,
    )
      .populate("profileId")
      .populate("employerId", "employerName email")
      .populate("createdBy", "name email")
      .populate("verifiedBy", "name email")
      .populate("updatedBy", "name email");

    return res.status(200).json({
      success: true,
      data: {
        id: populatedVerification._id,
        profileId: populatedVerification.profileId,
        employmentDetailsId: populatedVerification.employmentDetailsId,
        employedName: populatedVerification.employedName,
        employerId: populatedVerification.employerId?._id,
        employerName: populatedVerification.employerId?.employerName,
        employerEmail: populatedVerification.employerId?.email,
        designation: populatedVerification.designation,
        employeeId: populatedVerification.employeeId,
        jobStartDate: populatedVerification.jobStartDate,
        jobEndDate: populatedVerification.jobEndDate,
        salary: populatedVerification.salary,
        jobAddress: populatedVerification.jobAddress,
        status: populatedVerification.status,
        result: populatedVerification.result,
        remarks: populatedVerification.remarks,
        attachment: verification.attachment,

        verificationEmailId: populatedVerification.verificationEmailId,
        employerReplies: populatedVerification.employerReplies
          ?.slice()
          .reverse(),
        createdBy: populatedVerification.createdBy,
        verifiedBy: populatedVerification.verifiedBy,
        verifiedDate: populatedVerification.verifiedDate,
        updatedBy: populatedVerification.updatedBy,
        updatedDate: populatedVerification.updatedDate,
        createdDate: populatedVerification.createdDate,
      },
    });
  } catch (error) {
    console.error("❌ Get Employment Verification Error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Employment Verification Log",
      error: error.message,
    });
  }
};

export const sendEmailMessage = async (req, res) => {
  try {
    const { id, employerId, subject, message } = req.body;

    // Validate Input

    if (!id || !employerId || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Verification Id, Employer Id, Subject and Message are required",
      });
    }

    // Login User

    const userId = req.user?.id;

    if (!userId) {
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
        message: "Verification record not found",
      });
    }

    // Check Employer

    if (verification.employerId.toString() !== employerId) {
      return res.status(400).json({
        success: false,
        message: "Employer does not match this verification",
      });
    }

    // Find Employer

    const employer = await MasterEmployer.findById(employerId);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Employer Email Check

    if (!employer.email) {
      return res.status(400).json({
        success: false,
        message: "Employer email not found",
      });
    }

    // Create Transporter

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send Email

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: employer.email,
      subject: subject.trim(),

      html: `
        <div style="font-family: Arial, sans-serif;">

          <h3>${subject.trim()}</h3>

          <p style="white-space: pre-wrap;">
            ${message.trim()}
          </p>

          <br />

          <p>
            Thanks,<br />
            Employment Verification Team
          </p>

        </div>
      `,
    });

    // Save Email Conversation

    verification.employerReplies.push({
      messageId: info.messageId,
      from: process.env.EMAIL_USER,
      subject: subject.trim(),
      message: message.trim(),
      date: new Date(),
      sendByVerification: true,
    });

    // Update Information

    verification.updatedBy = userId;
    verification.updatedDate = new Date();

    // Save Verification

    await verification.save();

    // Response

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      email: employer.email,
    });
  } catch (error) {
    console.log("Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Email sending failed",
    });
  }
};

export const verifyEmploymentVerificationWeb = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { remarks } = req.body;

    // VALIDATE EMPLOYMENT VERIFICATION ID

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    // VALIDATE USER ID

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    // VALIDATE REMARKS

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Verification remarks are required",
      });
    }

    // FIND EMPLOYMENT VERIFICATION

    const verification = await EmploymentVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification not found",
      });
    }

    // ALREADY VERIFIED CHECK

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Employment Verification is already verified",
      });
    }

    // ALREADY REJECTED CHECK

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected Employment Verification cannot be verified",
      });
    }

    // CURRENT DATE

    const now = new Date();

    // UPDATE VERIFICATION STATUS

    verification.status = "Verified";
    verification.result = "Ok";

    // REMARKS

    verification.remarks = remarks.trim();

    // VERIFIED USER

    verification.verifiedBy = userId;
    verification.verifiedDate = now;

    // UPDATED USER

    verification.updatedBy = userId;
    verification.updatedDate = now;

    // RESPONSE DATE

    verification.respondedDate = now;

    // SAVE

    await verification.save();

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Employment Verification verified successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Verify Employment Web Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const rejectEmploymentVerificationWeb = async (req, res) => {
  try {
    // 1. GET PARAMS & BODY

    const { id, userId } = req.params;
    const { remarks } = req.body;

    // 2. VALIDATE EMPLOYMENT VERIFICATION ID

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employment Verification Id",
      });
    }

    // 3. VALIDATE USER ID

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    // 4. VALIDATE REMARKS

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection remarks are required",
      });
    }

    // 5. FIND EMPLOYMENT VERIFICATION

    const verification = await EmploymentVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment Verification not found",
      });
    }

    // 6. ALREADY VERIFIED CHECK

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Verified Employment Verification cannot be rejected",
      });
    }

    // 7. ALREADY REJECTED CHECK

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Employment Verification is already rejected",
      });
    }

    // 8. CURRENT DATE

    const now = new Date();

    // 9. UPDATE STATUS

    verification.status = "Rejected";
    verification.result = "Not Verified";

    // 10. SAVE REJECTION REMARKS

    verification.remarks = remarks.trim();

    // 11. SAVE USER ID

    // User ID jo email link me bheja gaya tha
    verification.verifiedBy = userId;

    // Agar schema me updatedBy field hai
    verification.updatedBy = userId;

    // 12. UPDATE DATES

    verification.verifiedDate = now;
    verification.updatedDate = now;
    verification.respondedDate = now;

    // 13. SAVE VERIFICATION

    await verification.save();

    // 14. SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Employment Verification rejected successfully",
      data: verification,
    });
  } catch (error) {
    // 15. ERROR HANDLING

    console.error("Reject Employment Verification Web Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getEmploymentDetailsId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Employment Verification ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid Employment Verification ID is required",
        data: null,
      });
    }

    // Fetch complete employment verification details
    const verificationData = await EmploymentVerificationLog.findById(id)
      .populate({
        path: "profileId",
      })
      .populate({
        path: "employerId",
      })
      .populate({
        path: "createdBy",
      })
      .populate({
        path: "verifiedBy",
      })
      .lean();

    if (!verificationData) {
      return res.status(404).json({
        success: false,
        message: "Employment verification details not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employment verification details fetched successfully",
      data: verificationData,
    });
  } catch (error) {
    console.error("getEmploymentDetailsId Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching employment verification details",
      error: error.message,
    });
  }
};

export const saveEmployerEmail = async (req, res) => {
  try {
    const {
      verificationId,
      messageId,
      from,
      subject,
      message,
      date,
      sendByVerification,
    } = req.body;

    // Verification ID validation
    if (!verificationId || !mongoose.Types.ObjectId.isValid(verificationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid verificationId is required",
      });
    }

    // Message validation
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Email message is required",
      });
    }

    // Find Employment Verification
    const verification =
      await EmploymentVerificationLog.findById(verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Employment verification not found",
      });
    }

    // Email object
    const emailReply = {
      messageId: messageId || "",
      from: from || "",
      subject: subject || "",
      message: message || "",
      date: date ? new Date(date) : new Date(),

      // true = verification LEFT
      // false = employer RIGHT
      sendByVerification:
        sendByVerification === false || sendByVerification === "false",
    };

    // Save inside employerReplies
    verification.employerReplies.push(emailReply);

    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Employer email saved successfully",
      data: verification,
    });
  } catch (error) {
    console.error("SAVE EMPLOYER EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save employer email",
      error: error.message,
    });
  }
};
