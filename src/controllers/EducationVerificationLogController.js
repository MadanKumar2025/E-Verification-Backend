import mongoose from "mongoose";
import nodemailer from "nodemailer";

import ProfileManager from "../models/ProfileManagerSchema.js";
import EducationVerificationLog from "../models/EducationVerificationLogSchema.js";
import BoardUniversity from "../models/BoardUniversitySchema.js";
import CreditTransaction from "../models/creditTransactionSchema.js";
import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";

import User from "../models/User.js";

import path from "path";
import fs from "fs";
import { deductCredits } from "./creditService.js";

export const createEducationVerificationLog = async (req, res) => {
  try {
    const { profileId, educationId } = req.body;

    // 1. PROFILE ID VALIDATION

    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Profile Id is required",
      });
    }

    // 2. EDUCATION ID VALIDATION

    if (!educationId || !mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Education Id is required",
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

    // 4. AGENCY / MASTER EMPLOYER

    const refid = req.user?.refid;
    const refModel = req.user?.refModel;

    if (!refid || !refModel) {
      return res.status(400).json({
        success: false,
        message: "Agency/MasterEmployer not assigned to user",
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

    // 6. FIND EDUCATION

    const education = profile.educationDetails.id(educationId);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    // 7. ATTACHMENT CHECK

    if (!education.attachment) {
      return res.status(400).json({
        success: false,
        message: "Education attachment not found",
      });
    }

    // 8. BOARD ID CHECK

    if (!education.boardId) {
      return res.status(400).json({
        success: false,
        message: "Board Id not found in education details",
      });
    }

    // 9. FIND BOARD UNIVERSITY USER

    const user = await User.findOne({
      refid: education.boardId,
      refModel: "BoardUniversity",
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found for this Board University",
      });
    }

    // 10. EDUCATION YEAR CHECK

    if (!education.year) {
      return res.status(400).json({
        success: false,
        message: "Education year is required",
      });
    }

    // 11. FIND BOARD / UNIVERSITY

    const boardUniversity = await BoardUniversity.findById(education.boardId);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board University not found",
      });
    }

    // 12. BOARD YEAR CHECK

    if (!boardUniversity.year) {
      return res.status(400).json({
        success: false,
        message: "Board verification year is not configured",
      });
    }

    // 13. DECIDE VERIFICATION METHOD

    let verificationMethod = "";

    if (education.year < boardUniversity.year) {
      verificationMethod = "Email";
    } else {
      verificationMethod = "API";
    }

    // 14. EMAIL VALIDATION

    if (verificationMethod === "Email") {
      if (!boardUniversity.boardEmail) {
        return res.status(400).json({
          success: false,
          message:
            `Email verification is required for year ${education.year}, ` +
            `but board email is not available for ${boardUniversity.boardName}`,
        });
      }
    }

    // 15. API VALIDATION

    if (verificationMethod === "API") {
      if (!boardUniversity.boardApi) {
        if (boardUniversity.boardEmail) {
          verificationMethod = "Email";
        } else {
          return res.status(400).json({
            success: false,
            message:
              `API verification is required for year ${education.year}, ` +
              `but board API and board email are not available for ${boardUniversity.boardName}`,
          });
        }
      }
    }

    // 16. DUPLICATE CHECK

    const alreadyExist = await EducationVerificationLog.findOne({
      profileId,
      educationId,
    });

    if (alreadyExist) {
      return res.status(400).json({
        success: false,
        message: "Education Verification already created.",
      });
    }

    // ============================================================
    // 17. GET CURRENT CREDIT BALANCE BEFORE DEDUCTION
    // ============================================================

    const creditAmount = 5;

    let account;

    if (refModel === "Agency") {
      account = await Agency.findById(refid);
    } else if (refModel === "MasterEmployer") {
      account = await MasterEmployer.findById(refid);
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `${refModel} not found`,
      });
    }

    // IMPORTANT:
    // Yahan "credits" aapke actual model ke credit field ka naam hai.
    // Agar aapke model me field ka naam creditBalance hai,
    // to account.credits ko account.creditBalance kar dena.

    const balanceBefore = Number(account.credits || 0);

    // INSUFFICIENT CREDIT CHECK

    if (balanceBefore < creditAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits. Please add credits.",
        balanceBefore,
        requiredCredits: creditAmount,
      });
    }

    // Expected balance after deduction

    const balanceAfter = balanceBefore - creditAmount;

    // ============================================================
    // 18. CREATE VERIFICATION LOG
    // ============================================================

    const verification = new EducationVerificationLog({
      profileId,
      educationId,

      candidateName: profile.candidateName,
      degree: education.educationName,
      rollNumber: education.rollNumber,

      boardId: boardUniversity._id,
      board: boardUniversity.boardName,

      year: education.year,
      attachment: education.attachment,

      verificationMethod,

      status: "Pending",
      result: "Not Verified",

      createdBy,
    });

    const saveVerification = await verification.save();

    // ============================================================
    // 19. VERIFICATION EMAIL ID
    // ============================================================

    if (saveVerification.verificationEmailId !== undefined) {
      saveVerification.verificationEmailId = String(saveVerification._id);

      await saveVerification.save();
    }

    // ============================================================
    // 20. DEDUCT CREDITS
    // ============================================================

    let creditResult;

    try {
      creditResult = await deductCredits({
        refid,
        refModel,
        amount: creditAmount,
      });

      console.log("========== DEDUCT CREDIT RESULT ==========");
      console.log(creditResult);
      console.log("===========================================");
    } catch (creditError) {
      // Credit deduction fail ho gaya.
      // Verification record delete kar denge.

      await EducationVerificationLog.findByIdAndDelete(saveVerification._id);

      throw creditError;
    }

    // ============================================================
    // 21. FINAL BALANCE VALUES
    // ============================================================

    // Agar deductCredits() balance return karta hai
    // to usko priority denge.
    //
    // Agar deductCredits() balance return nahi karta,
    // to upar database se nikale hue values use karenge.

    const finalBalanceBefore = Number(
      creditResult?.balanceBefore ?? balanceBefore,
    );

    const finalBalanceAfter = Number(
      creditResult?.balanceAfter ?? balanceAfter,
    );

    // Debug

    console.log("========== EDUCATION CREDIT ==========");
    console.log("Credit Amount:", creditAmount);
    console.log("Balance Before:", finalBalanceBefore);
    console.log("Balance After:", finalBalanceAfter);
    console.log("=======================================");

    // ============================================================
    // 22. CREATE CREDIT TRANSACTION
    // ============================================================

    const transactionData = {
      type: "DEBIT",

      amount: creditAmount,

      balanceBefore: finalBalanceBefore,

      balanceAfter: finalBalanceAfter,

      reason: "Credits deducted for Education Verification",

      action: "EDUCATION_VERIFICATION",

      referenceId: saveVerification._id,

      referenceModel: "EducationVerificationLog",

      createdBy,

      createdDate: new Date(),
    };

    // ============================================================
    // 23. FIND EXISTING CREDIT TRANSACTION
    // ============================================================

    let creditTransaction = await CreditTransaction.findOne({
      userId: createdBy,
      refid,
      refModel,
    });

    // ============================================================
    // 24. UPDATE / CREATE CREDIT TRANSACTION
    // ============================================================

    if (creditTransaction) {
      creditTransaction.transactions.push(transactionData);

      await creditTransaction.save();

      console.log("Existing CreditTransaction updated:", creditTransaction._id);
    } else {
      creditTransaction = await CreditTransaction.create({
        userId: createdBy,

        refid,

        refModel,

        transactions: [transactionData],
      });

      console.log("New CreditTransaction created:", creditTransaction._id);
    }

    // ============================================================
    // 25. VERIFICATION URL
    // ============================================================

    const verificationUrl =
      `${process.env.FRONTEND_URL}/EducationVerificationView/` +
      `${educationId}/${user._id}`;

    // ============================================================
    // 26. EMAIL VERIFICATION
    // ============================================================

    if (verificationMethod === "Email") {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,

          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const emailSubject = `Education Verification Request #${saveVerification._id}`;

        if (!education.attachment) {
          throw new Error("Education attachment path is missing in database");
        }

        const relativeAttachmentPath = education.attachment
          .replace(/^[/\\]+/, "")
          .replace(/\//g, path.sep);

        const attachmentPath = path.join(process.cwd(), relativeAttachmentPath);

        if (!fs.existsSync(attachmentPath)) {
          throw new Error(
            `Education attachment file not found on server: ${attachmentPath}`,
          );
        }

        const emailInfo = await transporter.sendMail({
          from: process.env.EMAIL_USER,

          to: boardUniversity.boardEmail,

          subject: emailSubject,

          html: `
            <h2>Hello ${boardUniversity.boardName},</h2>

            <p>
              A new education verification request has been submitted
              for the following candidate.
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
                <td><b>Degree</b></td>
                <td>${education.educationName || "-"}</td>
              </tr>

              <tr>
                <td><b>Board</b></td>
                <td>${boardUniversity.boardName}</td>
              </tr>

              <tr>
                <td><b>Roll Number</b></td>
                <td>${education.rollNumber || "-"}</td>
              </tr>

              <tr>
                <td><b>Year</b></td>
                <td>${education.year || "-"}</td>
              </tr>

            </table>

            <br/>

            <p>
              You can verify the Education details by replying to this
              email or by clicking the "Verify Education" button below.
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
              Verify Education
            </a>

            <br/>
            <br/>

            <p>
              Thanks,<br/>
              Education Verification Team
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
          `To: ${boardUniversity.boardEmail}. ` +
          `Subject: ${emailSubject}. ` +
          `Message ID: ${emailInfo.messageId}. ` +
          `SMTP Response: ${emailInfo.response || "N/A"}`;

        await saveVerification.save();
      } catch (emailError) {
        saveVerification.status = "Pending";

        saveVerification.result = "Not Verified";

        saveVerification.remarks =
          `Email sending failed. ` +
          `To: ${boardUniversity.boardEmail}. ` +
          `Error: ${emailError.message}`;

        await saveVerification.save();

        return res.status(500).json({
          success: false,

          message:
            "Education Verification created and credits deducted, but education verification email could not be sent.",

          data: saveVerification,

          creditTransaction: {
            transactionId: creditTransaction._id,

            type: "DEBIT",

            amount: creditAmount,

            balanceBefore: finalBalanceBefore,

            balanceAfter: finalBalanceAfter,

            action: "EDUCATION_VERIFICATION",

            referenceId: saveVerification._id,

            referenceModel: "EducationVerificationLog",
          },
        });
      }
    }

    // ============================================================
    // 27. API VERIFICATION
    // ============================================================

    if (verificationMethod === "API") {
      try {
        saveVerification.sentDate = new Date();

        const apiResponse = await fetch(boardUniversity.boardApi, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            verificationId: String(saveVerification._id),

            candidateName: profile.candidateName,

            candidateEmail: profile.email,

            candidateMobile: profile.mobile,

            degree: education.educationName,

            board: boardUniversity.boardName,

            rollNumber: education.rollNumber,

            year: education.year,
          }),
        });

        if (!apiResponse.ok) {
          throw new Error(`Board API returned status ${apiResponse.status}`);
        }

        let apiData = null;

        try {
          apiData = await apiResponse.json();
        } catch (jsonError) {
          apiData = null;

          console.log("Board API JSON parsing failed:", jsonError.message);
        }

        let apiResult = "Not Verified";

        if (
          apiData?.result === "Ok" ||
          apiData?.status === "Verified" ||
          apiData?.verified === true
        ) {
          apiResult = "Ok";
        }

        if (
          apiData?.result === "No Found" ||
          apiData?.status === "No Found" ||
          apiData?.found === false
        ) {
          apiResult = "No Found";
        }

        saveVerification.result = apiResult;

        if (apiResult === "Ok") {
          saveVerification.status = "Verified";

          saveVerification.verifiedDate = new Date();

          saveVerification.verifiedBy = "Board API";
        }

        saveVerification.remarks =
          "Education verification API request completed.";

        await saveVerification.save();
      } catch (apiError) {
        saveVerification.status = "Pending";

        saveVerification.result = "Not Verified";

        saveVerification.remarks = `Board API verification failed: ${apiError.message}`;

        await saveVerification.save();

        return res.status(502).json({
          success: false,

          message:
            "Education Verification created and credits deducted, but board API verification failed.",

          data: saveVerification,

          creditTransaction: {
            transactionId: creditTransaction._id,

            type: "DEBIT",

            amount: creditAmount,

            balanceBefore: finalBalanceBefore,

            balanceAfter: finalBalanceAfter,

            action: "EDUCATION_VERIFICATION",

            referenceId: saveVerification._id,

            referenceModel: "EducationVerificationLog",
          },
        });
      }
    }

    // ============================================================
    // 28. FINAL RESPONSE
    // ============================================================

    return res.status(201).json({
      success: true,

      message:
        verificationMethod === "Email"
          ? "Education Verification created and email sent successfully."
          : "Education Verification created and board API called successfully.",

      verificationMethod,

      data: saveVerification,

      creditTransaction: {
        transactionId: creditTransaction._id,

        type: "DEBIT",

        amount: creditAmount,

        balanceBefore: finalBalanceBefore,

        balanceAfter: finalBalanceAfter,

        action: "EDUCATION_VERIFICATION",

        referenceId: saveVerification._id,

        referenceModel: "EducationVerificationLog",
      },
    });
  } catch (error) {
    console.error("createEducationVerificationLog error:", error);

    // INSUFFICIENT CREDITS

    if (error.message === "Insufficient credits") {
      return res.status(400).json({
        success: false,

        message: "Insufficient credits. Please add credits.",
      });
    }

    // AGENCY / MASTER EMPLOYER NOT FOUND

    if (
      error.message === "Agency not found" ||
      error.message === "MasterEmployer not found"
    ) {
      return res.status(404).json({
        success: false,

        message: error.message,
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

// export const createEducationVerificationLog = async (req, res) => {
//   try {
//     const { profileId, educationId } = req.body;

//     // PROFILE ID VALIDATION
//     if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid Profile Id is required",
//       });
//     }

//     // EDUCATION ID VALIDATION
//     if (!educationId || !mongoose.Types.ObjectId.isValid(educationId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid Education Id is required",
//       });
//     }

//     // LOGIN USER
//     const createdBy = req.user?.id || req.user?._id;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // AGENCY / MASTER EMPLOYER
//     const refid = req.user?.refid;
//     const refModel = req.user?.refModel;

//     if (!refid || !refModel) {
//       return res.status(400).json({
//         success: false,
//         message: "Agency/MasterEmployer not assigned to user",
//       });
//     }

//     // FIND PROFILE
//     const profile = await ProfileManager.findById(profileId);

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: "Profile not found",
//       });
//     }

//     // FIND EDUCATION
//     const education = profile.educationDetails.id(educationId);

//     if (!education) {
//       return res.status(404).json({
//         success: false,
//         message: "Education record not found",
//       });
//     }

//     // ATTACHMENT CHECK
//     const attachment = education.attachment;

//     if (!attachment) {
//       return res.status(400).json({
//         success: false,
//         message: "Education attachment not found",
//       });
//     }

//     // EDUCATION BOARD ID CHECK
//     if (!education.boardId) {
//       return res.status(400).json({
//         success: false,
//         message: "Board Id not found in education details",
//       });
//     }

//     // FIND BOARD UNIVERSITY USER
//     const user = await User.findOne({
//       refid: education.boardId,
//       refModel: "BoardUniversity",
//       isActive: true,
//     });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found for this Board University",
//       });
//     }

//     // EDUCATION YEAR CHECK
//     if (!education.year) {
//       return res.status(400).json({
//         success: false,
//         message: "Education year is required",
//       });
//     }

//     // FIND BOARD / UNIVERSITY
//     const boardUniversity = await BoardUniversity.findById(education.boardId);

//     if (!boardUniversity) {
//       return res.status(404).json({
//         success: false,
//         message: "Board University not found",
//       });
//     }

//     // BOARD YEAR CHECK
//     if (!boardUniversity.year) {
//       return res.status(400).json({
//         success: false,
//         message: "Board verification year is not configured",
//       });
//     }

//     // DECIDE VERIFICATION METHOD
//     let verificationMethod = "";

//     if (education.year < boardUniversity.year) {
//       verificationMethod = "Email";
//     } else {
//       verificationMethod = "API";
//     }

//     // EMAIL VALIDATION
//     if (verificationMethod === "Email") {
//       if (!boardUniversity.boardEmail) {
//         return res.status(400).json({
//           success: false,
//           message:
//             `Email verification is required for year ${education.year}, ` +
//             `but board email is not available for ${boardUniversity.boardName}`,
//         });
//       }
//     }

//     // API VALIDATION
//     if (verificationMethod === "API") {
//       if (!boardUniversity.boardApi) {
//         if (boardUniversity.boardEmail) {
//           verificationMethod = "Email";
//         } else {
//           return res.status(400).json({
//             success: false,
//             message:
//               `API verification is required for year ${education.year}, ` +
//               `but board API and board email are not available for ${boardUniversity.boardName}`,
//           });
//         }
//       }
//     }

//     // DUPLICATE CHECK
//     const alreadyExist = await EducationVerificationLog.findOne({
//       profileId,
//       educationId,
//     });

//     if (alreadyExist) {
//       return res.status(400).json({
//         success: false,
//         message: "Education Verification already created.",
//       });
//     }

//     // CREATE VERIFICATION LOG FIRST

//     const verification = new EducationVerificationLog({
//       profileId,
//       educationId,
//       candidateName: profile.candidateName,
//       degree: education.educationName,
//       rollNumber: education.rollNumber,
//       boardId: boardUniversity._id,
//       board: boardUniversity.boardName,
//       year: education.year,
//       attachment: education.attachment,

//       verificationMethod,
//       status: "Pending",
//       result: "Not Verified",
//       createdBy,
//     });

//     const saveVerification = await verification.save();

//     // DEDUCT CREDITS

//     const creditAmount = 5;

//     let creditResult;

//     try {
//       creditResult = await deductCredits({
//         refid,
//         refModel,
//         amount: creditAmount,
//       });
//     } catch (creditError) {
//       // Credit deduction failed,
//       // so remove created verification record
//       await EducationVerificationLog.findByIdAndDelete(saveVerification._id);

//       throw creditError;
//     }

//     // CREATE CREDIT TRANSACTION - DEBIT

//     const transactionData = {
//       type: "DEBIT",
//       amount: creditAmount,

//       balanceBefore: creditResult.balanceBefore,
//       balanceAfter: creditResult.balanceAfter,

//       reason: "Credits deducted for Education Verification",

//       action: "EDUCATION_VERIFICATION",

//       referenceId: saveVerification._id,
//       referenceModel: "EducationVerificationLog",

//       createdBy,
//       createdDate: new Date(),
//     };

//     // FIND EXISTING CREDIT TRANSACTION

//     let creditTransaction = await CreditTransaction.findOne({
//       userId: createdBy,
//       refid,
//       refModel,
//     });

//     // UPDATE OR CREATE CREDIT TRANSACTION

//     if (creditTransaction) {
//       creditTransaction.transactions.push(transactionData);

//       await creditTransaction.save();
//     } else {
//       creditTransaction = await CreditTransaction.create({
//         userId: createdBy,
//         refid,
//         refModel,
//         transactions: [transactionData],
//       });
//     }

//     // VERIFICATION URL

//     const verificationUrl =
//       `${process.env.FRONTEND_URL}/EducationVerificationView/` +
//       `${educationId}/${user._id}`;

//     // EMAIL VERIFICATION

//     if (verificationMethod === "Email") {
//       try {
//         // CREATE SMTP TRANSPORTER
//         const transporter = nodemailer.createTransport({
//           host: process.env.SMTP_HOST,
//           port: Number(process.env.SMTP_PORT),
//           secure: false,
//           auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS,
//           },
//         });

//         // EMAIL SUBJECT
//         const emailSubject = `Education Verification Request #${saveVerification._id}`;

//         if (!education.attachment) {
//           throw new Error("Education attachment path is missing in database");
//         }

//         const relativeAttachmentPath = education.attachment
//           .replace(/^[/\\]+/, "")
//           .replace(/\//g, path.sep);

//         const attachmentPath = path.join(process.cwd(), relativeAttachmentPath);

//         if (!fs.existsSync(attachmentPath)) {
//           throw new Error(
//             `Education attachment file not found on server: ${attachmentPath}`,
//           );
//         }

//         // SEND EMAIL
//         const emailInfo = await transporter.sendMail({
//           from: process.env.EMAIL_USER,
//           to: boardUniversity.boardEmail,
//           subject: emailSubject,

//           html: `
//             <h2>Hello ${boardUniversity.boardName},</h2>

//             <p>
//               A new education verification request has been submitted
//               for the following candidate.
//             </p>

//             <table
//               border="1"
//               cellpadding="8"
//               cellspacing="0"
//               style="border-collapse: collapse;"
//             >
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
//                 <td><b>Degree</b></td>
//                 <td>${education.educationName || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Board</b></td>
//                 <td>${boardUniversity.boardName}</td>
//               </tr>

//               <tr>
//                 <td><b>Roll Number</b></td>
//                 <td>${education.rollNumber || "-"}</td>
//               </tr>

//               <tr>
//                 <td><b>Year</b></td>
//                 <td>${education.year || "-"}</td>
//               </tr>
//             </table>

//             <br/>

//             <p>
//               You can verify the Education details by replying to this
//               email or by clicking the "Verify Education" button below.
//             </p>

//             <br />

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
//               Verify Education
//             </a>

//             <br />
//             <br />

//             <p>
//               Thanks,<br/>
//               Education Verification Team
//             </p>
//           `,

//           attachments: [
//             {
//               filename: path.basename(attachmentPath),
//               path: attachmentPath,
//             },
//           ],
//         });

//         // SAVE EMAIL DETAILS
//         saveVerification.sentDate = new Date();
//         saveVerification.status = "Pending";
//         saveVerification.result = "Not Verified";

//         saveVerification.remarks =
//           `Verification request sent successfully by email. ` +
//           `To: ${boardUniversity.boardEmail}. ` +
//           `Subject: ${emailSubject}. ` +
//           `Message ID: ${emailInfo.messageId}. ` +
//           `SMTP Response: ${emailInfo.response || "N/A"}`;

//         await saveVerification.save();
//       } catch (emailError) {
//         saveVerification.status = "Pending";
//         saveVerification.result = "Not Verified";

//         saveVerification.remarks =
//           `Email sending failed. ` +
//           `To: ${boardUniversity.boardEmail}. ` +
//           `Error: ${emailError.message}`;

//         await saveVerification.save();

//         return res.status(500).json({
//           success: false,
//           message:
//             "Verification created and credits deducted, but education verification email could not be sent.",

//           data: saveVerification,

//           creditTransaction: {
//             transactionId: creditTransaction._id,
//             type: "DEBIT",
//             amount: creditAmount,
//             balanceBefore: creditResult.balanceBefore,
//             balanceAfter: creditResult.balanceAfter,
//           },
//         });
//       }
//     }

//     // API VERIFICATION

//     if (verificationMethod === "API") {
//       try {
//         // CALL BOARD API
//         saveVerification.sentDate = new Date();

//         const apiResponse = await fetch(boardUniversity.boardApi, {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },

//           body: JSON.stringify({
//             verificationId: String(saveVerification._id),
//             candidateName: profile.candidateName,
//             candidateEmail: profile.email,
//             candidateMobile: profile.mobile,
//             degree: education.educationName,
//             board: boardUniversity.boardName,
//             rollNumber: education.rollNumber,
//             year: education.year,
//           }),
//         });

//         // CHECK API HTTP STATUS
//         if (!apiResponse.ok) {
//           throw new Error(`Board API returned status ${apiResponse.status}`);
//         }

//         // TRY TO READ JSON
//         let apiData = null;

//         try {
//           apiData = await apiResponse.json();
//         } catch (jsonError) {
//           apiData = null;

//           console.log("Board API JSON parsing failed:", jsonError.message);
//         }

//         let apiResult = "Not Verified";

//         if (
//           apiData?.result === "Ok" ||
//           apiData?.status === "Verified" ||
//           apiData?.verified === true
//         ) {
//           apiResult = "Ok";
//         }

//         if (
//           apiData?.result === "No Found" ||
//           apiData?.status === "No Found" ||
//           apiData?.found === false
//         ) {
//           apiResult = "No Found";
//         }

//         // SAVE RESULT
//         saveVerification.result = apiResult;

//         if (apiResult === "Ok") {
//           saveVerification.status = "Verified";
//           saveVerification.verifiedDate = new Date();
//           saveVerification.verifiedBy = "Board API";
//         }

//         saveVerification.remarks =
//           "Education verification API request completed.";

//         await saveVerification.save();
//       } catch (apiError) {
//         // SAVE API FAILURE
//         saveVerification.status = "Pending";
//         saveVerification.result = "Not Verified";

//         saveVerification.remarks = `Board API verification failed: ${apiError.message}`;

//         await saveVerification.save();

//         return res.status(502).json({
//           success: false,
//           message:
//             "Verification created and credits deducted, but board API verification failed.",

//           data: saveVerification,

//           creditTransaction: {
//             transactionId: creditTransaction._id,
//             type: "DEBIT",
//             amount: creditAmount,
//             balanceBefore: creditResult.balanceBefore,
//             balanceAfter: creditResult.balanceAfter,
//           },
//         });
//       }
//     }

//     // FINAL RESPONSE

//     return res.status(201).json({
//       success: true,

//       message:
//         verificationMethod === "Email"
//           ? "Education Verification created and email sent successfully."
//           : "Education Verification created and board API called successfully.",

//       verificationMethod,

//       data: saveVerification,

//       creditTransaction: {
//         transactionId: creditTransaction._id,
//         type: "DEBIT",
//         amount: creditAmount,
//         balanceBefore: creditResult.balanceBefore,
//         balanceAfter: creditResult.balanceAfter,
//         action: "EDUCATION_VERIFICATION",
//         referenceId: saveVerification._id,
//         referenceModel: "EducationVerificationLog",
//       },
//     });
//   } catch (error) {
//     // INSUFFICIENT CREDITS
//     if (error.message === "Insufficient credits") {
//       return res.status(400).json({
//         success: false,
//         message: "Insufficient credits. Please add credits.",
//       });
//     }

//     // AGENCY NOT FOUND
//     if (
//       error.message === "Agency not found" ||
//       error.message === "MasterEmployer not found"
//     ) {
//       return res.status(404).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     // MONGOOSE VALIDATION ERROR
//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((e) => e.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     // INTERNAL SERVER ERROR
//     console.error("createEducationVerificationLog error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

export const getEducationVerificationLogs = async (req, res) => {
  try {
    const createdBy = req.user?.id;

    // Authentication check
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Fetch verification logs created by logged-in user
    const verificationList = await EducationVerificationLog.find({
      createdBy,
    })
      .sort({ createdDate: -1 })
      .lean();

    // Format response
    const data = verificationList.map((verification) => ({
      id: verification._id,

      profileId: verification.profileId,
      educationId: verification.educationId,

      candidateName: verification.candidateName,
      degree: verification.degree,
      rollNumber: verification.rollNumber,

      board: verification.board,
      boardId: verification.boardId,
      year: verification.year,

      verificationMethod: verification.verificationMethod,

      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      attachment: verification.attachment || null,

      verificationReplies: verification.verificationReplies || [],

      createdBy: verification.createdBy,

      verifiedBy: verification.verifiedBy,
      verifiedDate: verification.verifiedDate,

      sentDate: verification.sentDate,
      respondedDate: verification.respondedDate,

      createdDate: verification.createdDate,
      updatedDate: verification.updatedDate,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching Education Verification Logs:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Education Verification Logs",
      error: error.message,
    });
  }
};

export const getEducationVerificationById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // Logged-in user
    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Find verification by ID and logged-in user
    const verification = await EducationVerificationLog.findOne({
      _id: id,
      createdBy,
    }).lean();

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // Response data
    const data = {
      id: verification._id,

      profileId: verification.profileId,
      educationId: verification.educationId,

      candidateName: verification.candidateName,
      degree: verification.degree,
      rollNumber: verification.rollNumber,

      board: verification.board,
      boardId: verification.boardId,
      year: verification.year,

      verificationMethod: verification.verificationMethod,

      status: verification.status,
      result: verification.result,
      remarks: verification.remarks,
      attachment: verification.attachment || null,

      verificationReplies: verification.verificationReplies || [],

      createdBy: verification.createdBy,

      verifiedBy: verification.verifiedBy,
      verifiedDate: verification.verifiedDate,

      sentDate: verification.sentDate,
      respondedDate: verification.respondedDate,

      createdDate: verification.createdDate,
      updatedDate: verification.updatedDate,
    };

    return res.status(200).json({
      success: true,
      message: "Education Verification fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Education Verification:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Education Verification",
      error: error.message,
    });
  }
};

export const updateEducationVerificationLog = async (req, res) => {
  try {
    const { id } = req.params;

    const { status, remarks, result } = req.body;

    // Validate Id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
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
    const verification = await EducationVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

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
    // Remarks Update
    if (result !== undefined) {
      verification.result = result.trim();
    }

    verification.createdBy = createdBy;
    verification.verifiedDate = new Date();

    const updatedVerification = await verification.save();

    return res.status(200).json({
      success: true,
      message: "Education Verification updated successfully",
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

// export const getEducationVerificationLogByEducationId = async (req, res) => {
//   try {
//     const { educationId } = req.params;
//     const createdBy = req.user?.id;

//     // Authentication check
//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // educationId check
//     if (!educationId) {
//       return res.status(400).json({
//         success: false,
//         message: "educationId is required",
//       });
//     }

//     // Education Verification Logs
//     const verificationList = await EducationVerificationLog.find({
//       educationId,
//       createdBy,
//     })
//       .populate("profileId")
//       .populate("boardId")
//       .populate("createdBy", "name email")
//       .sort({ createdDate: -1 })
//       .lean();

//     return res.status(200).json({
//       success: true,
//       count: verificationList.length,
//       data: verificationList,
//     });
//   } catch (error) {
//     console.error("Error fetching Education Verification Log:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Error fetching Education Verification Log",
//       error: error.message,
//     });
//   }
// };

export const getEducationVerificationLogByEducationId = async (req, res) => {
  try {
    const { educationId } = req.params;

    // educationId check
    if (!educationId) {
      return res.status(400).json({
        success: false,
        message: "educationId is required",
      });
    }

    // Education Verification Logs
    const verificationList = await EducationVerificationLog.find({
      educationId,
    })
      .populate("profileId")
      .populate("boardId")
      .populate("createdBy", "name email")
      .sort({ createdDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: verificationList.length,
      data: verificationList,
    });
  } catch (error) {
    console.error("Error fetching Education Verification Log:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Education Verification Log",
      error: error.message,
    });
  }
};

export const getEducationVerificationDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const verificationData = await EducationVerificationLog.findById(id)
      .populate("profileId")
      .populate("boardId")
      .populate("createdBy", "name email")
      .lean();

    if (!verificationData) {
      return res.status(404).json({
        success: false,
        message: "Education verification details not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education verification details fetched successfully",
      data: verificationData,
    });
  } catch (error) {
    console.error("getEducationVerificationDetailsById Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching education verification details",
      error: error.message,
    });
  }
};

export const sendEducationVerificationEmail = async (req, res) => {
  try {
    const { id, subject, message } = req.body;

    const createdBy = req.user?.id;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // VALIDATION
    if (!id || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Verification Id, Subject and Message are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // FIND EDUCATION VERIFICATION
    // const verification = await EducationVerificationLog.findById(id);
    const verification = await EducationVerificationLog.findOne({
      _id: id,
      createdBy,
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education verification record not found",
      });
    }

    // console.log("Education Verification:", verification);

    // CHECK VERIFICATION METHOD
    if (verification.verificationMethod !== "Email") {
      return res.status(400).json({
        success: false,
        message: "This verification is not configured for Email verification",
      });
    }

    // GET BOARD ID FROM DATABASE
    const boardId = verification.boardId;

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: "Board/University is not assigned to this verification",
      });
    }

    // console.log("Board ID from verification:", boardId.toString());

    // FIND BOARD / UNIVERSITY
    const boardUniversity = await BoardUniversity.findById(boardId);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board/University not found",
      });
    }

    // console.log("Board University:", boardUniversity);
    // CHECK BOARD EMAIL

    if (!boardUniversity.boardEmail) {
      return res.status(400).json({
        success: false,
        message: "Board/University email not found",
      });
    }

    // console.log("Board Email:", boardUniversity.boardEmail);
    // CREATE SMTP TRANSPORTER

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // SEND EMAIL
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: boardUniversity.boardEmail,
      subject: subject,
      html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            "
          >

            <h3>
              ${subject}
            </h3>

            <p>
              ${message}
            </p>

            <br />

            <p>
              Thanks,<br />
              <strong>
                Education Verification Team
              </strong>
            </p>

          </div>
        `,
    });

    // console.log("EMAIL SENT:", info.messageId);

    // SAVE EMAIL IN VERIFICATION REPLIES
    verification.verificationReplies.push({
      messageId: info.messageId,
      from: process.env.EMAIL_USER,
      subject: subject,
      message: message,
      date: new Date(),
      sendByVerification: true,
    });

    // UPDATE DATE
    verification.updatedDate = new Date();

    // SAVE DATABASE
    await verification.save();

    // SUCCESS
    return res.status(200).json({
      success: true,
      message: "Education verification email sent successfully",
      email: boardUniversity.boardEmail,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Education Verification Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Education verification email sending failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyEducationVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    console.log("=================================");
    console.log("VERIFY EDUCATION ID:", id);
    console.log("REQ.USER:", req.user);
    console.log("REQ.USER.ID:", req.user?.id);
    console.log("=================================");

    // VALIDATE ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // GET LOGGED-IN USER

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // FIND VERIFICATION

    const verification = await EducationVerificationLog.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // ALREADY VERIFIED CHECK

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already verified",
      });
    }

    // UPDATE VERIFICATION

    const now = new Date();

    verification.status = "Verified";
    verification.result = "Ok";

    verification.verifiedBy = userId;
    verification.verifiedDate = now;

    verification.updatedDate = now;

    // Remarks
    if (remarks !== undefined) {
      verification.remarks = remarks.trim();
    }

    // SAVE

    await verification.save();

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education Verification verified successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Verify Education Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const rejectEducationVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // VALIDATE OBJECT ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // GET LOGGED-IN USER

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // VALIDATE REMARKS

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remarks are required for rejection",
      });
    }

    // FIND EDUCATION VERIFICATION

    const verification = await EducationVerificationLog.findOne({
      _id: id,
      createdBy: userId,
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // ALREADY VERIFIED CHECK

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Verified Education Verification cannot be rejected",
      });
    }

    // ALREADY REJECTED CHECK

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already rejected",
      });
    }

    // UPDATE REJECTION

    const now = new Date();

    verification.status = "Rejected";
    verification.result = "Not Verified";

    verification.verifiedBy = userId;
    verification.verifiedDate = now;

    verification.remarks = remarks.trim();

    verification.updatedDate = now;

    verification.respondedDate = now;

    // SAVE

    await verification.save();

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education Verification rejected successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Reject Education Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getEducationVerificationLogsByBoardId = async (req, res) => {
  try {
    const { boardId, status } = req.params;

    // BOARD ID REQUIRED

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: "boardId is required",
      });
    }

    // STATUS REQUIRED

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    // VALIDATE BOARD ID

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid boardId",
      });
    }

    // ALLOWED STATUS

    const allowedStatuses = [
      "Pending",
      "Responded",
      "Verified",
      "Rejected",
      "Not Found",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(
          ", ",
        )}`,
      });
    }

    // FILTER

    const filter = {
      boardId: new mongoose.Types.ObjectId(boardId),
      status,
    };

    // FETCH VERIFICATION LOGS

    const verificationList = await EducationVerificationLog.find(filter)
      .populate("profileId", "candidateName email mobile")
      .populate("boardId", "boardName universityName boardEmail")
      .populate("createdBy", "name email")
      .sort({
        createdDate: -1,
      })
      .lean();

    // FORMAT RESPONSE

    const data = verificationList.map((verification) => {
      const replies = verification.verificationReplies || [];

      return {
        id: verification._id,

        // PROFILE DETAILS

        profileId: verification.profileId?._id || null,

        candidateName:
          verification.profileId?.candidateName ||
          verification.candidateName ||
          null,

        candidateEmail: verification.profileId?.email || null,

        candidateMobile: verification.profileId?.mobile || null,

        // EDUCATION DETAILS

        educationId: verification.educationId || null,

        degree: verification.degree || null,

        rollNumber: verification.rollNumber || null,

        year: verification.year || null,

        // BOARD DETAILS

        boardId: verification.boardId?._id || verification.boardId || null,

        board: verification.boardId?.boardName || verification.board || null,

        boardEmail: verification.boardId?.boardEmail || null,
        attachment: verification.attachment || null,

        // VERIFICATION DETAILS

        verificationMethod: verification.verificationMethod || null,

        status: verification.status || null,

        result: verification.result || null,

        remarks: verification.remarks || null,

        // VERIFICATION REPLIES

        verificationReplies: replies,

        replyCount: replies.length,

        latestReply: replies.length > 0 ? replies[replies.length - 1] : null,

        // CREATED BY

        createdBy: verification.createdBy
          ? {
              id: verification.createdBy._id,
              name: verification.createdBy.name,
              email: verification.createdBy.email,
            }
          : null,

        // VERIFIED DETAILS

        verifiedBy: verification.verifiedBy || null,

        verifiedDate: verification.verifiedDate || null,

        // DATE DETAILS

        sentDate: verification.sentDate || null,

        respondedDate: verification.respondedDate || null,

        createdDate: verification.createdDate || null,

        updatedDate: verification.updatedDate || null,
      };
    });

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education verification logs fetched successfully",

      count: data.length,

      boardId,

      status,

      data,
    });
  } catch (error) {
    console.error("getEducationVerificationLogsByBoardId Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Education Verification Logs",

      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getEducationVerificationLogByEducationIdWeb = async (req, res) => {
  try {
    const { educationId } = req.params;

    // VALIDATE EDUCATION ID

    if (!educationId) {
      return res.status(400).json({
        success: false,
        message: "Education Id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Id",
      });
    }

    // FIND EDUCATION VERIFICATION

    const verification = await EducationVerificationLog.findOne({
      educationId: new mongoose.Types.ObjectId(educationId),
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification Log not found",
      });
    }

    // POPULATE RELATED DATA

    const populatedVerification = await EducationVerificationLog.findById(
      verification._id,
    )
      .populate("profileId")
      .populate("boardId", "boardName boardEmail")
      .populate("createdBy", "name email");

    // RESPONSE

    return res.status(200).json({
      success: true,

      data: {
        id: populatedVerification._id,

        // Profile
        profileId: populatedVerification.profileId,

        // Education
        educationId: populatedVerification.educationId,

        candidateName: populatedVerification.candidateName,

        degree: populatedVerification.degree,

        rollNumber: populatedVerification.rollNumber,

        year: populatedVerification.year,

        // Board
        boardId:
          populatedVerification.boardId?._id ||
          populatedVerification.boardId ||
          null,
        attachment: verification.attachment || null,

        boardName: populatedVerification.boardId?.boardName || null,

        boardEmail: populatedVerification.boardId?.boardEmail || null,

        board: populatedVerification.board,

        // Verification
        verificationMethod: populatedVerification.verificationMethod,

        status: populatedVerification.status,

        result: populatedVerification.result,

        remarks: populatedVerification.remarks || null,

        // Replies
        verificationReplies: populatedVerification.verificationReplies || [],

        replyCount: populatedVerification.verificationReplies?.length || 0,

        latestReply:
          populatedVerification.verificationReplies?.length > 0
            ? populatedVerification.verificationReplies[
                populatedVerification.verificationReplies.length - 1
              ]
            : null,

        // Created By
        createdBy: populatedVerification.createdBy,

        // Verification User
        verifiedBy: populatedVerification.verifiedBy || null,

        verifiedDate: populatedVerification.verifiedDate || null,

        // Dates
        sentDate: populatedVerification.sentDate || null,

        respondedDate: populatedVerification.respondedDate || null,

        createdDate: populatedVerification.createdDate || null,

        updatedDate: populatedVerification.updatedDate || null,
      },
    });
  } catch (error) {
    console.error("❌ Get Education Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Education Verification Log",
      error: error.message,
    });
  }
};

export const verifyEducationVerificationWeb = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }
    // Default system user
    // const userId = new mongoose.Types.ObjectId("6a8288eae28c8da2e4c367c1");

    const verification = await EducationVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // Already verified check
    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already verified",
      });
    }

    // Update Verification Status
    verification.status = "Verified";
    verification.result = "Ok";

    // System user ID
    verification.verifiedBy = userId.toString();
    verification.verifiedDate = new Date();

    // Remarks
    if (remarks !== undefined) {
      verification.remarks = remarks.trim();
    }

    // Updated date
    verification.updatedDate = new Date();

    // Verification response date
    verification.respondedDate = new Date();

    await verification.save();

    return res.status(200).json({
      success: true,
      message: "Education Verification verified successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Verify Education Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const rejectEducationVerificationWeb = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { remarks } = req.body;

    // VALIDATE EDUCATION VERIFICATION ID

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // VALIDATE USER ID

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    // REMARKS VALIDATION

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: "Remarks are required for rejection",
      });
    }

    // FIND EDUCATION VERIFICATION

    const verification = await EducationVerificationLog.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // ALREADY VERIFIED CHECK

    if (verification.status === "Verified") {
      return res.status(400).json({
        success: false,
        message: "Verified Education Verification cannot be rejected",
      });
    }

    // ALREADY REJECTED CHECK

    if (verification.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already rejected",
      });
    }

    // CURRENT DATE

    const now = new Date();

    // UPDATE STATUS

    verification.status = "Rejected";
    verification.result = "Not Verified";

    // USER ID FROM URL

    verification.verifiedBy = userId.toString();

    // DATES

    verification.verifiedDate = now;
    verification.updatedDate = now;
    verification.respondedDate = now;

    // REMARKS

    verification.remarks = remarks.trim();

    // SAVE

    await verification.save();

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education Verification rejected successfully",
      data: verification,
    });
  } catch (error) {
    console.error("Reject Education Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyEducationVerificationNew = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // 1. VALIDATE ID

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Education Verification Id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // 2. GET LOGGED-IN USER

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // 3. FIND EDUCATION VERIFICATION
    // IMPORTANT:
    // createdBy condition intentionally NOT used

    const verification = await EducationVerificationLog.findById(id);

    console.log("VERIFICATION FOUND:", verification);

    // 4. NOT FOUND

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // 5. ALREADY VERIFIED

    if (String(verification.status || "").toLowerCase() === "verified") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already verified",
        data: verification,
      });
    }

    // 6. ALREADY REJECTED

    if (String(verification.status || "").toLowerCase() === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected Education Verification cannot be verified",
        data: verification,
      });
    }

    // 7. UPDATE VERIFICATION

    const now = new Date();

    verification.status = "Verified";
    verification.result = "Ok";

    // Your schema has verifiedBy as String
    verification.verifiedBy = String(userId);

    verification.verifiedDate = now;
    verification.updatedDate = now;

    // 8. REMARKS

    if (remarks !== undefined && remarks !== null) {
      verification.remarks = String(remarks).trim();
    }

    // 9. SAVE

    await verification.save();

    console.log("=================================");
    console.log("EDUCATION VERIFICATION VERIFIED");
    console.log("ID:", verification._id);
    console.log("STATUS:", verification.status);
    console.log("RESULT:", verification.result);
    console.log("VERIFIED BY:", verification.verifiedBy);
    console.log("=================================");

    // 10. SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education Verification verified successfully",
      data: verification,
    });
  } catch (error) {
    console.error("=================================");
    console.error("VERIFY EDUCATION NEW ERROR");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const rejectEducationVerificationNew = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    // 1. VALIDATE ID

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Education Verification Id is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Education Verification Id",
      });
    }

    // 2. GET LOGGED-IN USER

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // 3. VALIDATE REMARKS

    if (remarks === undefined || remarks === null || !String(remarks).trim()) {
      return res.status(400).json({
        success: false,
        message: "Remarks are required for rejection",
      });
    }

    // 4. FIND EDUCATION VERIFICATION
    //
    // IMPORTANT:
    // createdBy condition intentionally removed

    const verification = await EducationVerificationLog.findById(id);

    console.log("VERIFICATION FOUND:", verification);

    // 5. NOT FOUND

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    // 6. ALREADY VERIFIED CHECK

    if (String(verification.status || "").toLowerCase() === "verified") {
      return res.status(400).json({
        success: false,
        message: "Verified Education Verification cannot be rejected",
        data: verification,
      });
    }

    // 7. ALREADY REJECTED CHECK

    if (String(verification.status || "").toLowerCase() === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Education Verification is already rejected",
        data: verification,
      });
    }

    // 8. UPDATE REJECTION

    const now = new Date();

    verification.status = "Rejected";
    verification.result = "Not Verified";

    // Schema mein verifiedBy String hai
    verification.verifiedBy = String(userId);

    verification.verifiedDate = now;
    verification.updatedDate = now;

    verification.remarks = String(remarks).trim();

    verification.respondedDate = now;

    // 9. SAVE

    await verification.save();

    console.log("=================================");
    console.log("EDUCATION VERIFICATION REJECTED");
    console.log("ID:", verification._id);
    console.log("STATUS:", verification.status);
    console.log("RESULT:", verification.result);
    console.log("VERIFIED BY:", verification.verifiedBy);
    console.log("REMARKS:", verification.remarks);
    console.log("=================================");

    // 10. SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Education Verification rejected successfully",
      data: verification,
    });
  } catch (error) {
    console.error("=================================");
    console.error("Reject Education New Error");
    console.error(error);
    console.error("=================================");

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// sendEmailBornd
export const sendEmailBornd = async (req, res) => {
  try {
    const { verificationId, to, subject, message } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!verificationId || !mongoose.Types.ObjectId.isValid(verificationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid verificationId is required",
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required",
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Email subject is required",
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Email message is required",
      });
    }

    // =========================
    // FIND VERIFICATION LOG
    // =========================

    const verification =
      await EducationVerificationLog.findById(verificationId);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education verification log not found",
      });
    }

    // =========================
    // SAVE ONLY IN verificationReplies
    // =========================

    verification.verificationReplies.push({
      messageId: null,
      from: to,
      subject: subject,
      message: message,
      date: new Date(),
      sendByVerification: false,
    });

    // =========================
    // UPDATE DATE
    // =========================

    verification.updatedDate = new Date();

    // =========================
    // SAVE DATABASE
    // =========================

    await verification.save();

    // =========================
    // RESPONSE
    // =========================

    return res.status(200).json({
      success: true,
      message: "Email data saved successfully.",
      data: verification,
    });
  } catch (error) {
    console.error("sendEmailBornd Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
