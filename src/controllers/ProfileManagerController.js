import ProfileManager from "../models/ProfileManagerSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import BoardUniversity from "../models/BoardUniversitySchema.js";
import mongoose from "mongoose";

import EducationVerificationLog from "../models/EducationVerificationLogSchema.js";
import EmploymentVerificationLog from "../models/EmploymentVerificationLogSchema.js";

export const createProfileManager = async (req, res) => {
  try {
    const {
      candidateName,
      mobile,
      email,
      permanentAddress,
      city,
      state,
      country,
      panCardNumber,
      aadharCardNumber,
      dateOfBirth,
      educationDetails,
      employmentDetails,
    } = req.body;

    // Basic Validations

    // Candidate Name Validation
    if (!candidateName || candidateName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Candidate Name is required",
      });
    }

    // Mobile Validation
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Valid 10 digit mobile number is required",
      });
    }

    // Email Validation
    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Address Validation
    if (!permanentAddress || permanentAddress.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Permanent Address is required",
      });
    }

    // City Validation
    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    // State Validation
    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    // DOB Validation
    if (!dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Date of Birth is required",
      });
    }

    // Logged In User

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Duplicate Mobile Check

    const existingProfile = await ProfileManager.findOne({
      createdBy,
      mobile,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile with this mobile number already exists",
      });
    }

    // Parse Education Details

    let parsedEducationDetails = [];

    if (educationDetails) {
      try {
        parsedEducationDetails =
          typeof educationDetails === "string"
            ? JSON.parse(educationDetails)
            : educationDetails;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid educationDetails format",
        });
      }
    }

    // Make sure educationDetails is an array
    if (!Array.isArray(parsedEducationDetails)) {
      return res.status(400).json({
        success: false,
        message: "educationDetails must be an array",
      });
    }

    // Education Details + Board ID + Attachment

    let updatedEducationDetails = [];

    if (parsedEducationDetails.length > 0) {
      updatedEducationDetails = await Promise.all(
        parsedEducationDetails.map(async (education, index) => {
          const { educationName, board, year, marks, rollNumber } = education;

          if (!educationName || educationName.trim() === "") {
            throw new Error(
              `Education name is required for education record ${index + 1}`,
            );
          }

          let boardId = null;
          let boardName = board || "";

          // Find BoardUniversity

          if (board && board.trim() !== "") {
            const boardUniversity = await BoardUniversity.findOne({
              boardName: {
                $regex: `^${board.trim()}$`,
                $options: "i",
              },
            });

            if (boardUniversity) {
              boardId = boardUniversity._id;
              boardName = boardUniversity.boardName;
            }
          }
          if (!boardId) {
            throw new Error(`Board not found: ${board}`);
          }

          // Education Attachment

          let attachment = education.attachment || "";

          const educationFile = (req.files || []).find(
            (file) => file.fieldname === `educationAttachment_${index}`,
          );

          if (educationFile) {
            attachment = `/uploads/profileManager/${educationFile.filename}`;
          }

          if (!attachment) {
            throw new Error(
              `Education attachment is required for education record ${index + 1}`,
            );
          }

          // Return Education Object

          return {
            educationName,
            boardId,
            board: boardName,
            year,
            marks,
            rollNumber,
            attachment,
          };
        }),
      );
    }

    // Parse Employment Details

    let parsedEmploymentDetails = [];

    if (employmentDetails) {
      try {
        parsedEmploymentDetails =
          typeof employmentDetails === "string"
            ? JSON.parse(employmentDetails)
            : employmentDetails;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid employmentDetails format",
        });
      }
    }

    // Make sure employmentDetails is an array
    if (!Array.isArray(parsedEmploymentDetails)) {
      return res.status(400).json({
        success: false,
        message: "employmentDetails must be an array",
      });
    }

    // Employment Details + Employer ID + Attachment

    let updatedEmploymentDetails = [];

    if (parsedEmploymentDetails.length > 0) {
      updatedEmploymentDetails = await Promise.all(
        parsedEmploymentDetails.map(async (emp, index) => {
          let employerId = null;

          // Find Employer

          if (!emp.employedName || emp.employedName.trim() === "") {
            throw new Error(
              `Employer name is required for employment record ${index + 1}`,
            );
          }

          const employer = await MasterEmployer.findOne({
            name: {
              $regex: `^${emp.employedName.trim()}$`,
              $options: "i",
            },
          });

          if (!employer) {
            throw new Error(`Employer not found: ${emp.employedName}`);
          }

          employerId = employer._id;

          // Employment Attachment

          let attachment = emp.attachment || "";

          /*
           * Expected Multer field name:
           *
           * employmentAttachment_0
           * employmentAttachment_1
           * employmentAttachment_2
           *
           * etc.
           */

          const employmentFile = (req.files || []).find(
            (file) => file.fieldname === `employmentAttachment_${index}`,
          );

          if (employmentFile) {
            attachment = `/uploads/profileManager/${employmentFile.filename}`;
          }

          if (!attachment) {
            throw new Error(
              `Employment attachment is required for employment record ${index + 1}`,
            );
          }

          // Return Employment Object

          return {
            employedName: emp.employedName,
            employerId,
            jobStartDate: emp.jobStartDate,
            jobEndDate: emp.jobEndDate,
            salary: emp.salary,
            jobAddress: emp.jobAddress,
            designation: emp.designation,
            employeeId: emp.employeeId,
            attachment,
          };
        }),
      );
    }

    // Create Profile

    const profileManager = new ProfileManager({
      candidateName,
      mobile,
      email: email.toLowerCase(),
      permanentAddress,
      city,
      state,
      country,
      panCardNumber,
      aadharCardNumber,
      dateOfBirth,

      educationDetails: updatedEducationDetails,

      employmentDetails: updatedEmploymentDetails,

      createdBy,
    });

    // Save Profile

    const savedProfile = await profileManager.save();

    // Response

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: savedProfile,
    });
  } catch (error) {
    console.error("Create Profile Manager Error:", error);

    // Duplicate Error

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists for this user",
      });
    }

    // Mongoose Validation Error

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // Board Related Error

    if (
      error.message?.startsWith("Board not found") ||
      error.message?.startsWith("Education name is required") ||
      error.message?.startsWith("Employer name is required") ||
      error.message?.startsWith("Employer not found") ||
      error.message?.startsWith("Education attachment is required") ||
      error.message?.startsWith("Employment attachment is required")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // General Error

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getProfileManagers = async (req, res) => {
  try {
    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const profileList = await ProfileManager.find({ createdBy }).sort({
      createdDate: -1,
    });

    const data = profileList.map((profile) => ({
      id: profile._id,
      candidateName: profile.candidateName,
      mobile: profile.mobile,
      email: profile.email,
      permanentAddress: profile.permanentAddress,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      panCardNumber: profile.panCardNumber,
      aadharCardNumber: profile.aadharCardNumber,
      dateOfBirth: profile.dateOfBirth,
      educationDetails: profile.educationDetails,
      employmentDetails: profile.employmentDetails,
      isActive: profile.isActive,
      createdDate: profile.createdDate,
      updatedDate: profile.updatedDate,
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
      message: "Error fetching profile managers",
    });
  }
};

export const getProfileManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    // PROFILE ID VALIDATION

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Profile Manager Id",
      });
    }

    // LOGGED IN USER

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // FIND PROFILE

    const profile = await ProfileManager.findOne({
      _id: id,
      createdBy,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile Manager not found",
      });
    }

    // GET EDUCATION IDS

    const educationIds = (profile.educationDetails || [])
      .filter((education) => education?._id)
      .map((education) => education._id);

    // GET EMPLOYMENT IDS

    const employmentIds = (profile.employmentDetails || [])
      .filter((employment) => employment?._id)
      .map((employment) => employment._id);

    // EDUCATION VERIFICATION LOG
    //
    // IMPORTANT:
    //
    // Agar profileId + educationId match hai,
    // sirf wahi education locked hogi.

    let protectedEducationIds = new Set();

    if (educationIds.length > 0) {
      const educationVerificationLogs = await EducationVerificationLog.find({
        profileId: profile._id,
        educationId: {
          $in: educationIds,
        },
      })
        .select("educationId")
        .lean();

      protectedEducationIds = new Set(
        educationVerificationLogs
          .filter((log) => log?.educationId)
          .map((log) => String(log.educationId)),
      );
    }

    // EMPLOYMENT VERIFICATION LOG
    //
    // IMPORTANT:
    //
    // Agar profileId + employmentDetailsId match hai,
    // sirf wahi employment locked hogi.

    let protectedEmploymentIds = new Set();

    if (employmentIds.length > 0) {
      const employmentVerificationLogs = await EmploymentVerificationLog.find({
        profileId: profile._id,
        employmentDetailsId: {
          $in: employmentIds,
        },
      })
        .select("employmentDetailsId")
        .lean();

      protectedEmploymentIds = new Set(
        employmentVerificationLogs
          .filter((log) => log?.employmentDetailsId)
          .map((log) => String(log.employmentDetailsId)),
      );
    }

    // PROFILE LEVEL VERIFICATION
    //
    // Candidate Name + DOB ke liye:
    //
    // Agar EducationVerificationLog ya
    // EmploymentVerificationLog mein profileId match
    // ho gaya hai, dono fields locked rahengi.

    const educationProfileVerificationExists =
      await EducationVerificationLog.exists({
        profileId: profile._id,
      });

    const employmentProfileVerificationExists =
      await EmploymentVerificationLog.exists({
        profileId: profile._id,
      });

    const isCandidateInfoLocked =
      !!educationProfileVerificationExists ||
      !!employmentProfileVerificationExists;

    // EDUCATION DETAILS WITH LOCK STATUS

    const educationDetails = (profile.educationDetails || []).map(
      (education) => {
        const educationObject = education.toObject
          ? education.toObject()
          : { ...education };

        const educationId = education?._id ? String(education._id) : null;

        return {
          ...educationObject,

          // Frontend ke liye
          isVerifiedLocked: educationId
            ? protectedEducationIds.has(educationId)
            : false,
        };
      },
    );

    // EMPLOYMENT DETAILS WITH LOCK STATUS

    const employmentDetails = (profile.employmentDetails || []).map(
      (employment) => {
        const employmentObject = employment.toObject
          ? employment.toObject()
          : { ...employment };

        const employmentId = employment?._id ? String(employment._id) : null;

        return {
          ...employmentObject,

          // Frontend ke liye
          isVerifiedLocked: employmentId
            ? protectedEmploymentIds.has(employmentId)
            : false,
        };
      },
    );

    // RESPONSE DATA

    const data = {
      id: profile._id,

      // -------------------------------------------------------
      // CANDIDATE INFO
      // -------------------------------------------------------

      candidateName: profile.candidateName,

      dateOfBirth: profile.dateOfBirth,

      // -------------------------------------------------------
      // EDITABLE FIELDS
      // -------------------------------------------------------

      mobile: profile.mobile,
      email: profile.email,
      permanentAddress: profile.permanentAddress,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      panCardNumber: profile.panCardNumber,
      aadharCardNumber: profile.aadharCardNumber,
      isActive: profile.isActive,

      // -------------------------------------------------------
      // DETAILS
      // -------------------------------------------------------

      educationDetails,
      employmentDetails,

      // -------------------------------------------------------
      // VERIFICATION STATUS
      // -------------------------------------------------------

      isCandidateInfoLocked,

      // Optional separate status
      hasEducationVerification: !!educationProfileVerificationExists,

      hasEmploymentVerification: !!employmentProfileVerificationExists,

      // -------------------------------------------------------
      // DATES
      // -------------------------------------------------------

      createdDate: profile.createdDate,
      updatedDate: profile.updatedDate,
    };

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,
      message: "Profile Manager fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get Profile Manager By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// export const updateProfileManager = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       candidateName,
//       dateOfBirth,
//       mobile,
//       email,
//       permanentAddress,
//       city,
//       state,
//       country,
//       panCardNumber,
//       aadharCardNumber,
//       educationDetails,
//       employmentDetails,
//       isActive,
//     } = req.body;

//
//     // REQUEST LOG
//

//     console.log("==========================================");
//     console.log("UPDATE PROFILE MANAGER - REQUEST DATA");
//     console.log("==========================================");

//     console.log("candidateName =>", candidateName);
//     console.log("dateOfBirth =>", dateOfBirth);
//     console.log("mobile =>", mobile);
//     console.log("email =>", email);
//     console.log("permanentAddress =>", permanentAddress);
//     console.log("city =>", city);
//     console.log("state =>", state);
//     console.log("country =>", country);
//     console.log("panCardNumber =>", panCardNumber);
//     console.log("aadharCardNumber =>", aadharCardNumber);
//     console.log("educationDetails =>", educationDetails);
//     console.log("employmentDetails =>", employmentDetails);
//     console.log("isActive =>", isActive);

//     console.log("==========================================");
//     console.log("FULL req.body =>");
//     console.dir(req.body, { depth: null });
//     console.log("==========================================");

//
//     // PROFILE ID VALIDATION
//

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Profile Manager Id",
//       });
//     }

//
//     // LOGGED IN USER
//

//     const createdBy = req.user?.id || null;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//
//     // FIND PROFILE
//

//     const profile = await ProfileManager.findOne({
//       _id: id,
//       createdBy,
//     });

//     if (!profile) {
//       return res.status(404).json({
//         success: false,
//         message: "Profile Manager not found",
//       });
//     }

//
//     // GET EDUCATION VERIFICATION LOGS
//
//     //
//     // IMPORTANT:
//     // EducationVerificationLog ke andar educationId hona chahiye.
//     //
//     // Example:
//     //
//     // {
//     //   profileId: ObjectId("..."),
//     //   educationId: ObjectId("6a926be4f007d00e01264b2c")
//     // }
//     //
//

//     const [educationVerificationLogs, employmentVerificationLogs] =
//       await Promise.all([
//         EducationVerificationLog.find({
//           profileId: id,
//         })
//           .select("_id profileId educationId")
//           .lean(),

//         EmploymentVerificationLog.find({
//           profileId: id,
//         })
//           .select("_id profileId employmentId")
//           .lean(),
//       ]);

//
//     // CREATE LOCKED EDUCATION ID SET
//

//     const lockedEducationIds = new Set(
//       educationVerificationLogs
//         .map((log) => {
//           if (!log.educationId) {
//             return null;
//           }

//           return log.educationId.toString();
//         })
//         .filter(Boolean),
//     );

//
//     // CREATE LOCKED EMPLOYMENT ID SET
//

//     const lockedEmploymentIds = new Set(
//       employmentVerificationLogs
//         .map((log) => {
//           if (!log.employmentId) {
//             return null;
//           }

//           return log.employmentId.toString();
//         })
//         .filter(Boolean),
//     );

//
//     // VERIFICATION LOG
//

//     console.log("==========================================");
//     console.log("VERIFICATION STATUS");
//     console.log("==========================================");

//     console.log(
//       "Education verification logs:",
//       educationVerificationLogs.length,
//     );

//     console.log(
//       "Employment verification logs:",
//       employmentVerificationLogs.length,
//     );

//     console.log("LOCKED EDUCATION IDS:", [...lockedEducationIds]);

//     console.log("LOCKED EMPLOYMENT IDS:", [...lockedEmploymentIds]);

//     console.log("==========================================");

//
//     // PARSE EDUCATION DETAILS
//

//     let parsedEducationDetails = educationDetails;

//     if (typeof parsedEducationDetails === "string") {
//       try {
//         parsedEducationDetails = JSON.parse(parsedEducationDetails);
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid educationDetails format",
//         });
//       }
//     }

//
//     // PARSE EMPLOYMENT DETAILS
//

//     let parsedEmploymentDetails = employmentDetails;

//     if (typeof parsedEmploymentDetails === "string") {
//       try {
//         parsedEmploymentDetails = JSON.parse(parsedEmploymentDetails);
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid employmentDetails format",
//         });
//       }
//     }

//
//     // BASIC PROFILE DETAILS
//

//
//     // CANDIDATE NAME
//

//     if (candidateName !== undefined) {
//       if (typeof candidateName !== "string" || candidateName.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Candidate Name is required",
//         });
//       }

//       profile.candidateName = candidateName.trim();
//     }

//
//     // DATE OF BIRTH
//

//     if (dateOfBirth !== undefined) {
//       if (dateOfBirth === null || dateOfBirth === "") {
//         profile.dateOfBirth = null;
//       } else {
//         profile.dateOfBirth = dateOfBirth;
//       }
//     }

//
//     // MOBILE
//

//     if (mobile !== undefined) {
//       const mobileValue = String(mobile).trim();

//       if (!/^[0-9]{10}$/.test(mobileValue)) {
//         return res.status(400).json({
//           success: false,
//           message: "Valid 10 digit mobile number is required",
//         });
//       }

//       const existingMobile = await ProfileManager.findOne({
//         createdBy,
//         mobile: mobileValue,
//         _id: { $ne: id },
//       });

//       if (existingMobile) {
//         return res.status(400).json({
//           success: false,
//           message: "Profile with this mobile number already exists",
//         });
//       }

//       profile.mobile = mobileValue;
//     }

//
//     // EMAIL
//

//     if (email !== undefined) {
//       if (typeof email !== "string" || email.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Email is required",
//         });
//       }

//       profile.email = email.toLowerCase().trim();
//     }

//
//     // PERMANENT ADDRESS
//

//     if (permanentAddress !== undefined) {
//       if (
//         typeof permanentAddress !== "string" ||
//         permanentAddress.trim() === ""
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "Permanent Address is required",
//         });
//       }

//       profile.permanentAddress = permanentAddress.trim();
//     }

//
//     // CITY
//

//     if (city !== undefined) {
//       if (typeof city !== "string" || city.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "City is required",
//         });
//       }

//       profile.city = city.trim();
//     }

//
//     // STATE
//

//     if (state !== undefined) {
//       if (typeof state !== "string" || state.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "State is required",
//         });
//       }

//       profile.state = state.trim();
//     }

//
//     // COUNTRY
//

//     if (country !== undefined) {
//       if (typeof country !== "string" || country.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Country cannot be empty",
//         });
//       }

//       profile.country = country.trim();
//     }

//
//     // PAN
//

//     if (panCardNumber !== undefined) {
//       const panValue =
//         panCardNumber === null
//           ? ""
//           : String(panCardNumber).toUpperCase().trim();

//       if (panValue === "") {
//         profile.panCardNumber = undefined;
//       } else {
//         if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panValue)) {
//           return res.status(400).json({
//             success: false,
//             message: "Invalid PAN Card Number. Example: ABCDE1234F",
//           });
//         }

//         profile.panCardNumber = panValue;
//       }
//     }

//
//     // AADHAAR
//

//     if (aadharCardNumber !== undefined) {
//       const aadharValue =
//         aadharCardNumber === null ? "" : String(aadharCardNumber).trim();

//       if (aadharValue === "") {
//         profile.aadharCardNumber = undefined;
//       } else {
//         if (!/^[0-9]{12}$/.test(aadharValue)) {
//           return res.status(400).json({
//             success: false,
//             message: "Aadhar number must be exactly 12 digits",
//           });
//         }

//         profile.aadharCardNumber = aadharValue;
//       }
//     }

//
//     // EDUCATION DETAILS
//
//     //
//     // IMPORTANT LOGIC:
//     //
//     // Education A -> unlocked -> update
//     // Education B -> unlocked -> update
//     // Education C -> locked   -> old data preserve
//     // Education D -> unlocked -> update
//     //
//

//     if (parsedEducationDetails !== undefined) {
//       if (!Array.isArray(parsedEducationDetails)) {
//         return res.status(400).json({
//           success: false,
//           message: "Education Details must be an array",
//         });
//       }

//       const oldEducationDetails = profile.educationDetails || [];

//       const updatedEducationDetails = [];

//       // =======================================================
//       // LOOP EVERY EDUCATION
//       // =======================================================

//       for (let index = 0; index < parsedEducationDetails.length; index++) {
//         const education = parsedEducationDetails[index];

//         if (!education || typeof education !== "object") {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid education data at index ${index}`,
//           });
//         }

//         const {
//           _id,
//           educationName,
//           board,
//           boardId,
//           year,
//           marks,
//           rollNumber,
//           attachment,
//         } = education;

//         // =====================================================
//         // FIND EXISTING EDUCATION
//         // =====================================================

//         let existingEducation = null;

//         if (_id && mongoose.Types.ObjectId.isValid(_id)) {
//           existingEducation = oldEducationDetails.id(_id);
//         }

//         // =====================================================
//         // CHECK THIS PARTICULAR EDUCATION LOCK
//         // =====================================================

//         const isThisEducationLocked =
//           existingEducation &&
//           lockedEducationIds.has(existingEducation._id.toString());

//         console.log("==========================================");

//         console.log("EDUCATION INDEX:", index);

//         console.log("EDUCATION ID:", _id);

//         console.log("EXISTING:", !!existingEducation);

//         console.log("LOCKED:", !!isThisEducationLocked);

//         // =====================================================
//         // LOCKED EDUCATION
//         // =====================================================
//         //
//         // Is particular education ka old data
//         // exactly preserve hoga.
//         //
//         // Request se aaye naye values ignore honge.
//         //
//         // =====================================================

//         if (isThisEducationLocked) {
//           updatedEducationDetails.push(existingEducation);

//           console.log("🔒 EDUCATION LOCKED:", existingEducation._id.toString());

//           console.log("OLD EDUCATION PRESERVED:");

//           console.log(existingEducation);

//           continue;
//         }

//         // =====================================================
//         // UNLOCKED EDUCATION
//         // =====================================================
//         //
//         // Existing hai -> UPDATE
//         // Existing nahi hai -> CREATE
//         //
//         // =====================================================

//         console.log(
//           existingEducation
//             ? "✏️ EDUCATION UPDATE ALLOWED"
//             : "➕ NEW EDUCATION",
//         );

//         // =====================================================
//         // BOARD
//         // =====================================================

//         let finalBoardId = null;

//         let boardName = typeof board === "string" ? board.trim() : "";

//         // =====================================================
//         // BOARD ID AVAILABLE
//         // =====================================================

//         if (boardId) {
//           if (!mongoose.Types.ObjectId.isValid(boardId)) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid Board ID: ${boardId}`,
//             });
//           }

//           const boardUniversity = await BoardUniversity.findById(boardId);

//           if (!boardUniversity) {
//             return res.status(400).json({
//               success: false,
//               message: "Board not found",
//             });
//           }

//           finalBoardId = boardUniversity._id;

//           boardName = boardUniversity.boardName;
//         }

//         // =====================================================
//         // BOARD NAME AVAILABLE
//         // =====================================================
//         else if (boardName !== "") {
//           const escapedBoard = boardName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

//           const boardUniversity = await BoardUniversity.findOne({
//             boardName: {
//               $regex: `^${escapedBoard}$`,
//               $options: "i",
//             },
//           });

//           if (boardUniversity) {
//             finalBoardId = boardUniversity._id;

//             boardName = boardUniversity.boardName;
//           }
//         }

//         // =====================================================
//         // PRESERVE OLD BOARD
//         // =====================================================

//         if (!finalBoardId && existingEducation?.boardId) {
//           finalBoardId = existingEducation.boardId;
//         }

//         if (
//           (!boardName || boardName.trim() === "") &&
//           existingEducation?.board
//         ) {
//           boardName = existingEducation.board;
//         }

//         // =====================================================
//         // ATTACHMENT
//         // =====================================================

//         let finalAttachment = existingEducation?.attachment || "";

//         const educationFile = (req.files || []).find(
//           (file) => file.fieldname === `educationAttachment_${index}`,
//         );

//         if (educationFile) {
//           finalAttachment = `/uploads/profileManager/${educationFile.filename}`;
//         } else if (typeof attachment === "string" && attachment.trim() !== "") {
//           finalAttachment = attachment;
//         }

//         // =====================================================
//         // UPDATED EDUCATION
//         // =====================================================

//         const updatedEducation = {
//           educationName:
//             educationName !== undefined
//               ? educationName
//               : existingEducation?.educationName || "",

//           board: boardName || "",

//           boardId: finalBoardId,

//           year: year !== undefined ? year : existingEducation?.year || "",

//           marks: marks !== undefined ? marks : existingEducation?.marks || "",

//           rollNumber:
//             rollNumber !== undefined
//               ? rollNumber
//               : existingEducation?.rollNumber || "",

//           attachment: finalAttachment,
//         };

//         // =====================================================
//         // PRESERVE EXISTING _id
//         // =====================================================

//         if (existingEducation?._id) {
//           updatedEducation._id = existingEducation._id;
//         }

//         // =====================================================
//         // PUSH UPDATED EDUCATION
//         // =====================================================

//         updatedEducationDetails.push(updatedEducation);

//         console.log("✅ EDUCATION UPDATED/ADDED:", updatedEducation);

//         console.log("==========================================");
//       }

//
//       // PRESERVE LOCKED RECORDS WHICH ARE NOT IN REQUEST
//
//       //
//       // Agar frontend ne locked education request mein
//       // nahi bheji, tab bhi DB se delete nahi hogi.
//       //
//

//       oldEducationDetails.forEach((oldEducation) => {
//         if (!oldEducation?._id) {
//           return;
//         }

//         const oldEducationId = oldEducation._id.toString();

//         const alreadyExists = updatedEducationDetails.some(
//           (item) => item?._id?.toString() === oldEducationId,
//         );

//         const isLocked = lockedEducationIds.has(oldEducationId);

//         if (isLocked && !alreadyExists) {
//           updatedEducationDetails.push(oldEducation);

//           console.log("🔒 PRESERVED LOCKED EDUCATION:", oldEducationId);
//         }
//       });

//
//       // SAVE EDUCATION DETAILS
//

//       profile.educationDetails = updatedEducationDetails;

//       console.log("==========================================");

//       console.log("FINAL EDUCATION DETAILS:");

//       console.dir(updatedEducationDetails, {
//         depth: null,
//       });

//       console.log("==========================================");
//     }

//
//     // EMPLOYMENT DETAILS
//
//     //
//     // Same logic as education.
//     //
//     // Sirf verified employment record locked hoga.
//     //
//

//     if (parsedEmploymentDetails !== undefined) {
//       if (!Array.isArray(parsedEmploymentDetails)) {
//         return res.status(400).json({
//           success: false,
//           message: "Employment Details must be an array",
//         });
//       }

//       const oldEmploymentDetails = profile.employmentDetails || [];

//       const updatedEmploymentDetails = [];

//       // =======================================================
//       // LOOP EVERY EMPLOYMENT
//       // =======================================================

//       for (let index = 0; index < parsedEmploymentDetails.length; index++) {
//         const emp = parsedEmploymentDetails[index];

//         if (!emp || typeof emp !== "object") {
//           return res.status(400).json({
//             success: false,
//             message: `Invalid employment data at index ${index}`,
//           });
//         }

//         const {
//           _id,
//           employedName,
//           employerId,
//           jobStartDate,
//           jobEndDate,
//           salary,
//           jobAddress,
//           designation,
//           employeeId,
//           attachment,
//         } = emp;

//         // =====================================================
//         // FIND EXISTING EMPLOYMENT
//         // =====================================================

//         let existingEmployment = null;

//         if (_id && mongoose.Types.ObjectId.isValid(_id)) {
//           existingEmployment = oldEmploymentDetails.id(_id);
//         }

//         // =====================================================
//         // CHECK THIS PARTICULAR EMPLOYMENT LOCK
//         // =====================================================

//         const isThisEmploymentLocked =
//           existingEmployment &&
//           lockedEmploymentIds.has(existingEmployment._id.toString());

//         console.log("==========================================");

//         console.log("EMPLOYMENT INDEX:", index);

//         console.log("EMPLOYMENT ID:", _id);

//         console.log("EXISTING:", !!existingEmployment);

//         console.log("LOCKED:", !!isThisEmploymentLocked);

//         // =====================================================
//         // LOCKED EMPLOYMENT
//         // =====================================================

//         if (isThisEmploymentLocked) {
//           updatedEmploymentDetails.push(existingEmployment);

//           console.log(
//             "🔒 EMPLOYMENT LOCKED:",
//             existingEmployment._id.toString(),
//           );

//           continue;
//         }

//         // =====================================================
//         // UNLOCKED EMPLOYMENT
//         // =====================================================

//         console.log(
//           existingEmployment
//             ? "✏️ EMPLOYMENT UPDATE ALLOWED"
//             : "➕ NEW EMPLOYMENT",
//         );

//         // =====================================================
//         // EMPLOYER
//         // =====================================================

//         let finalEmployerId = null;

//         let employerName =
//           typeof employedName === "string" ? employedName.trim() : "";

//         // =====================================================
//         // EMPLOYER ID
//         // =====================================================

//         if (employerId) {
//           if (!mongoose.Types.ObjectId.isValid(employerId)) {
//             return res.status(400).json({
//               success: false,
//               message: `Invalid Employer ID: ${employerId}`,
//             });
//           }

//           const employer = await MasterEmployer.findById(employerId);

//           if (!employer) {
//             return res.status(400).json({
//               success: false,
//               message: "Employer not found",
//             });
//           }

//           finalEmployerId = employer._id;

//           employerName = employer.name;
//         }

//         // =====================================================
//         // EMPLOYER NAME
//         // =====================================================
//         else if (employerName !== "") {
//           const escapedEmployerName = employerName.replace(
//             /[.*+?^${}()|[\]\\]/g,
//             "\\$&",
//           );

//           const employer = await MasterEmployer.findOne({
//             name: {
//               $regex: `^${escapedEmployerName}$`,
//               $options: "i",
//             },
//           });

//           if (employer) {
//             finalEmployerId = employer._id;

//             employerName = employer.name;
//           }
//         }

//         // =====================================================
//         // PRESERVE OLD EMPLOYER
//         // =====================================================

//         if (!finalEmployerId && existingEmployment?.employerId) {
//           finalEmployerId = existingEmployment.employerId;
//         }

//         if (
//           (!employerName || employerName.trim() === "") &&
//           existingEmployment?.employedName
//         ) {
//           employerName = existingEmployment.employedName;
//         }

//         // =====================================================
//         // ATTACHMENT
//         // =====================================================

//         let finalAttachment = existingEmployment?.attachment || "";

//         const employmentFile = (req.files || []).find(
//           (file) => file.fieldname === `employmentAttachment_${index}`,
//         );

//         if (employmentFile) {
//           finalAttachment = `/uploads/profileManager/${employmentFile.filename}`;
//         } else if (typeof attachment === "string" && attachment.trim() !== "") {
//           finalAttachment = attachment;
//         }

//         // =====================================================
//         // UPDATED EMPLOYMENT
//         // =====================================================

//         const updatedEmployment = {
//           employedName: employerName || "",

//           employerId: finalEmployerId,

//           jobStartDate:
//             jobStartDate !== undefined
//               ? jobStartDate
//               : existingEmployment?.jobStartDate || "",

//           jobEndDate:
//             jobEndDate !== undefined
//               ? jobEndDate
//               : existingEmployment?.jobEndDate || "",

//           salary:
//             salary !== undefined ? salary : existingEmployment?.salary || "",

//           jobAddress:
//             jobAddress !== undefined
//               ? jobAddress
//               : existingEmployment?.jobAddress || "",

//           designation:
//             designation !== undefined
//               ? designation
//               : existingEmployment?.designation || "",

//           employeeId:
//             employeeId !== undefined
//               ? employeeId
//               : existingEmployment?.employeeId || "",

//           attachment: finalAttachment,
//         };

//         // =====================================================
//         // PRESERVE EXISTING _id
//         // =====================================================

//         if (existingEmployment?._id) {
//           updatedEmployment._id = existingEmployment._id;
//         }

//         // =====================================================
//         // PUSH
//         // =====================================================

//         updatedEmploymentDetails.push(updatedEmployment);

//         console.log("✅ EMPLOYMENT UPDATED/ADDED:", updatedEmployment);

//         console.log("==========================================");
//       }

//
//       // PRESERVE LOCKED OLD EMPLOYMENT
//

//       oldEmploymentDetails.forEach((oldEmployment) => {
//         if (!oldEmployment?._id) {
//           return;
//         }

//         const oldEmploymentId = oldEmployment._id.toString();

//         const alreadyExists = updatedEmploymentDetails.some(
//           (item) => item?._id?.toString() === oldEmploymentId,
//         );

//         const isLocked = lockedEmploymentIds.has(oldEmploymentId);

//         if (isLocked && !alreadyExists) {
//           updatedEmploymentDetails.push(oldEmployment);

//           console.log("🔒 PRESERVED LOCKED EMPLOYMENT:", oldEmploymentId);
//         }
//       });

//
//       // SAVE EMPLOYMENT
//

//       profile.employmentDetails = updatedEmploymentDetails;

//       console.log("==========================================");

//       console.log("FINAL EMPLOYMENT DETAILS:");

//       console.dir(updatedEmploymentDetails, {
//         depth: null,
//       });

//       console.log("==========================================");
//     }

//
//     // ACTIVE STATUS
//     // ALWAYS EDITABLE
//

//     if (isActive !== undefined) {
//       if (typeof isActive === "boolean") {
//         profile.isActive = isActive;
//       } else if (isActive === "true") {
//         profile.isActive = true;
//       } else if (isActive === "false") {
//         profile.isActive = false;
//       } else {
//         return res.status(400).json({
//           success: false,
//           message: "isActive must be true or false",
//         });
//       }
//     }

//
//     // UPDATED BY / DATE
//

//     profile.updatedBy = createdBy;
//     profile.updatedDate = new Date();

//
//     // SAVE PROFILE
//

//     const updatedProfile = await profile.save();

//
//     // SUCCESS
//

//     return res.status(200).json({
//       success: true,

//       message: "Profile Manager updated successfully",

//       data: updatedProfile,

//       verificationStatus: {
//         educationVerification: educationVerificationLogs.length > 0,

//         employmentVerification: employmentVerificationLogs.length > 0,
//       },

//       lockedEducationIds: [...lockedEducationIds],

//       lockedEmploymentIds: [...lockedEmploymentIds],
//     });
//   } catch (error) {
//
//     // ERROR
//

//     console.error("Update Profile Manager Error:", error);

//
//     // DUPLICATE KEY
//

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number already exists for this user",
//       });
//     }

//
//     // VALIDATION ERROR
//

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: messages.join(", "),
//       });
//     }

//
//     // CAST ERROR
//

//     if (error.name === "CastError") {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid value for ${error.path}`,
//       });
//     }

//
//     // INTERNAL SERVER ERROR
//

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//     });
//   }
// };

export const updateProfileManager = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      candidateName,
      dateOfBirth,
      mobile,
      email,
      permanentAddress,
      city,
      state,
      country,
      panCardNumber,
      aadharCardNumber,
      educationDetails,
      employmentDetails,
      isActive,
    } = req.body;

    // PROFILE ID VALIDATION

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Profile Manager Id",
      });
    }

    // LOGGED IN USER

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // FIND PROFILE

    const profile = await ProfileManager.findOne({
      _id: id,
      createdBy,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile Manager not found",
      });
    }

    // GET VERIFICATION LOGS

    const [educationVerificationLogs, employmentVerificationLogs] =
      await Promise.all([
        EducationVerificationLog.find({
          profileId: id,
        })
          .select("_id profileId educationId")
          .lean(),

        EmploymentVerificationLog.find({
          profileId: id,
        })
          .select("_id profileId employmentId")
          .lean(),
      ]);

    // LOCKED EDUCATION IDS

    const lockedEducationIds = new Set(
      educationVerificationLogs
        .map((log) => {
          if (!log.educationId) {
            return null;
          }

          return log.educationId.toString();
        })
        .filter(Boolean),
    );

    // LOCKED EMPLOYMENT IDS

    const lockedEmploymentIds = new Set(
      employmentVerificationLogs
        .map((log) => {
          if (!log.employmentId) {
            return null;
          }

          return log.employmentId.toString();
        })
        .filter(Boolean),
    );

    // PARSE EDUCATION DETAILS

    let parsedEducationDetails = educationDetails;

    if (typeof parsedEducationDetails === "string") {
      try {
        parsedEducationDetails = JSON.parse(parsedEducationDetails);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid educationDetails format",
        });
      }
    }

    // PARSE EMPLOYMENT DETAILS

    let parsedEmploymentDetails = employmentDetails;

    if (typeof parsedEmploymentDetails === "string") {
      try {
        parsedEmploymentDetails = JSON.parse(parsedEmploymentDetails);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid employmentDetails format",
        });
      }
    }

    // CANDIDATE NAME

    if (candidateName !== undefined) {
      if (typeof candidateName !== "string" || candidateName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Candidate Name is required",
        });
      }

      profile.candidateName = candidateName.trim();
    }

    // DATE OF BIRTH

    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === "") {
        return res.status(400).json({
          success: false,
          message: "Date of Birth is required",
        });
      }

      profile.dateOfBirth = dateOfBirth;
    }

    // MOBILE

    if (mobile !== undefined) {
      const mobileValue = String(mobile).trim();

      if (!/^[0-9]{10}$/.test(mobileValue)) {
        return res.status(400).json({
          success: false,
          message: "Valid 10 digit mobile number is required",
        });
      }

      const existingMobile = await ProfileManager.findOne({
        createdBy,
        mobile: mobileValue,
        _id: { $ne: id },
      });

      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Profile with this mobile number already exists",
        });
      }

      profile.mobile = mobileValue;
    }

    // EMAIL

    if (email !== undefined) {
      if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      profile.email = email.toLowerCase().trim();
    }

    // PERMANENT ADDRESS

    if (permanentAddress !== undefined) {
      if (
        typeof permanentAddress !== "string" ||
        permanentAddress.trim() === ""
      ) {
        return res.status(400).json({
          success: false,
          message: "Permanent Address is required",
        });
      }

      profile.permanentAddress = permanentAddress.trim();
    }

    // CITY

    if (city !== undefined) {
      if (typeof city !== "string" || city.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "City is required",
        });
      }

      profile.city = city.trim();
    }

    // STATE

    if (state !== undefined) {
      if (typeof state !== "string" || state.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      profile.state = state.trim();
    }

    // COUNTRY

    if (country !== undefined) {
      if (typeof country !== "string" || country.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Country cannot be empty",
        });
      }

      profile.country = country.trim();
    }

    // PAN

    if (panCardNumber !== undefined) {
      const panValue =
        panCardNumber === null
          ? ""
          : String(panCardNumber).toUpperCase().trim();

      if (panValue === "") {
        profile.panCardNumber = undefined;
      } else {
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panValue)) {
          return res.status(400).json({
            success: false,
            message: "Invalid PAN Card Number. Example: ABCDE1234F",
          });
        }

        profile.panCardNumber = panValue;
      }
    }

    // AADHAAR

    if (aadharCardNumber !== undefined) {
      const aadharValue =
        aadharCardNumber === null ? "" : String(aadharCardNumber).trim();

      if (aadharValue === "") {
        profile.aadharCardNumber = undefined;
      } else {
        if (!/^[0-9]{12}$/.test(aadharValue)) {
          return res.status(400).json({
            success: false,
            message: "Aadhar number must be exactly 12 digits",
          });
        }

        profile.aadharCardNumber = aadharValue;
      }
    }

    // EDUCATION DETAILS

    if (parsedEducationDetails !== undefined) {
      if (!Array.isArray(parsedEducationDetails)) {
        return res.status(400).json({
          success: false,
          message: "Education Details must be an array",
        });
      }

      const oldEducationDetails = profile.educationDetails || [];

      const updatedEducationDetails = [];

      // LOOP EDUCATION

      for (let index = 0; index < parsedEducationDetails.length; index++) {
        const education = parsedEducationDetails[index];

        if (!education || typeof education !== "object") {
          return res.status(400).json({
            success: false,
            message: `Invalid education data at index ${index}`,
          });
        }

        const {
          _id,
          educationName,
          board,
          boardId,
          year,
          marks,
          rollNumber,
          attachment,
        } = education;

        // EDUCATION NAME VALIDATION

        if (
          !educationName ||
          typeof educationName !== "string" ||
          educationName.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: `Education name is required for education record ${
              index + 1
            }`,
          });
        }

        // FIND EXISTING EDUCATION

        let existingEducation = null;

        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          existingEducation = oldEducationDetails.id(_id);
        }
        // CHECK LOCK
        const isThisEducationLocked =
          existingEducation &&
          lockedEducationIds.has(existingEducation._id.toString());

        // LOCKED EDUCATION

        if (isThisEducationLocked) {
          updatedEducationDetails.push(existingEducation);

          continue;
        }

        // BOARD

        let finalBoardId = null;

        let boardName = typeof board === "string" ? board.trim() : "";

        // BOARD ID

        if (boardId) {
          if (!mongoose.Types.ObjectId.isValid(boardId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid Board ID: ${boardId}`,
            });
          }

          const boardUniversity = await BoardUniversity.findById(boardId);

          if (!boardUniversity) {
            return res.status(400).json({
              success: false,
              message: "Board not found",
            });
          }

          finalBoardId = boardUniversity._id;
          boardName = boardUniversity.boardName;
        }

        // BOARD NAME
        else if (boardName !== "") {
          const escapedBoard = boardName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

          const boardUniversity = await BoardUniversity.findOne({
            boardName: {
              $regex: `^${escapedBoard}$`,
              $options: "i",
            },
          });

          if (boardUniversity) {
            finalBoardId = boardUniversity._id;
            boardName = boardUniversity.boardName;
          }
        }

        // PRESERVE OLD BOARD

        if (!finalBoardId && existingEducation?.boardId) {
          finalBoardId = existingEducation.boardId;
        }

        if (
          (!boardName || boardName.trim() === "") &&
          existingEducation?.board
        ) {
          boardName = existingEducation.board;
        }

        // BOARD REQUIRED

        if (!finalBoardId) {
          return res.status(400).json({
            success: false,
            message: `Board not found: ${board || ""}`,
          });
        }

        // ATTACHMENT

        let finalAttachment = existingEducation?.attachment || "";

        const educationFile = (req.files || []).find(
          (file) => file.fieldname === `educationAttachment_${index}`,
        );

        if (educationFile) {
          finalAttachment = `/uploads/profileManager/${educationFile.filename}`;
        } else if (typeof attachment === "string" && attachment.trim() !== "") {
          finalAttachment = attachment;
        }

        // ATTACHMENT REQUIRED

        if (!finalAttachment) {
          return res.status(400).json({
            success: false,
            message: `Education attachment is required for education record ${
              index + 1
            }`,
          });
        }

        // UPDATED EDUCATION

        const updatedEducation = {
          educationName: educationName.trim(),
          boardId: finalBoardId,
          board: boardName,
          year: year !== undefined ? year : existingEducation?.year,
          marks: marks !== undefined ? marks : existingEducation?.marks,
          rollNumber:
            rollNumber !== undefined
              ? rollNumber
              : existingEducation?.rollNumber,

          attachment: finalAttachment,
        };

        // PRESERVE EXISTING ID

        if (existingEducation?._id) {
          updatedEducation._id = existingEducation._id;
        }

        updatedEducationDetails.push(updatedEducation);
      }

      // PRESERVE LOCKED EDUCATION NOT SENT BY FRONTEND

      oldEducationDetails.forEach((oldEducation) => {
        if (!oldEducation?._id) {
          return;
        }

        const oldEducationId = oldEducation._id.toString();

        const alreadyExists = updatedEducationDetails.some(
          (item) => item?._id?.toString() === oldEducationId,
        );

        const isLocked = lockedEducationIds.has(oldEducationId);

        if (isLocked && !alreadyExists) {
          updatedEducationDetails.push(oldEducation);
        }
      });

      profile.educationDetails = updatedEducationDetails;
    }

    // EMPLOYMENT DETAILS

    if (parsedEmploymentDetails !== undefined) {
      if (!Array.isArray(parsedEmploymentDetails)) {
        return res.status(400).json({
          success: false,
          message: "Employment Details must be an array",
        });
      }

      const oldEmploymentDetails = profile.employmentDetails || [];

      const updatedEmploymentDetails = [];

      // LOOP EMPLOYMENT

      for (let index = 0; index < parsedEmploymentDetails.length; index++) {
        const emp = parsedEmploymentDetails[index];

        if (!emp || typeof emp !== "object") {
          return res.status(400).json({
            success: false,
            message: `Invalid employment data at index ${index}`,
          });
        }

        const {
          _id,
          employedName,
          employerId,
          jobStartDate,
          jobEndDate,
          salary,
          jobAddress,
          designation,
          employeeId,
          attachment,
        } = emp;

        // FIND EXISTING EMPLOYMENT

        let existingEmployment = null;

        if (_id && mongoose.Types.ObjectId.isValid(_id)) {
          existingEmployment = oldEmploymentDetails.id(_id);
        }

        // CHECK LOCK

        const isThisEmploymentLocked =
          existingEmployment &&
          lockedEmploymentIds.has(existingEmployment._id.toString());

        // LOCKED EMPLOYMENT

        if (isThisEmploymentLocked) {
          updatedEmploymentDetails.push(existingEmployment);

          continue;
        }

        // EMPLOYER NAME VALIDATION

        if (
          !employedName ||
          typeof employedName !== "string" ||
          employedName.trim() === ""
        ) {
          return res.status(400).json({
            success: false,
            message: `Employer name is required for employment record ${
              index + 1
            }`,
          });
        }

        // EMPLOYER

        let finalEmployerId = null;

        let employerName = employedName.trim();

        // EMPLOYER ID

        if (employerId) {
          if (!mongoose.Types.ObjectId.isValid(employerId)) {
            return res.status(400).json({
              success: false,
              message: `Invalid Employer ID: ${employerId}`,
            });
          }

          const employer = await MasterEmployer.findById(employerId);

          if (!employer) {
            return res.status(400).json({
              success: false,
              message: "Employer not found",
            });
          }

          finalEmployerId = employer._id;

          employerName = employer.name;
        }

        // EMPLOYER NAME SEARCH
        else {
          const escapedEmployerName = employerName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );

          const employer = await MasterEmployer.findOne({
            name: {
              $regex: `^${escapedEmployerName}$`,
              $options: "i",
            },
          });

          if (!employer) {
            return res.status(400).json({
              success: false,
              message: `Employer not found: ${employerName}`,
            });
          }

          finalEmployerId = employer._id;

          employerName = employer.name;
        }

        // ATTACHMENT

        let finalAttachment = existingEmployment?.attachment || "";

        const employmentFile = (req.files || []).find(
          (file) => file.fieldname === `employmentAttachment_${index}`,
        );

        if (employmentFile) {
          finalAttachment = `/uploads/profileManager/${employmentFile.filename}`;
        } else if (typeof attachment === "string" && attachment.trim() !== "") {
          finalAttachment = attachment;
        }

        // ATTACHMENT REQUIRED

        if (!finalAttachment) {
          return res.status(400).json({
            success: false,
            message: `Employment attachment is required for employment record ${
              index + 1
            }`,
          });
        }

        // UPDATED EMPLOYMENT

        const updatedEmployment = {
          employedName: employerName,

          employerId: finalEmployerId,

          jobStartDate:
            jobStartDate !== undefined
              ? jobStartDate
              : existingEmployment?.jobStartDate,

          jobEndDate:
            jobEndDate !== undefined
              ? jobEndDate
              : existingEmployment?.jobEndDate,

          salary: salary !== undefined ? salary : existingEmployment?.salary,

          jobAddress:
            jobAddress !== undefined
              ? jobAddress
              : existingEmployment?.jobAddress,

          designation:
            designation !== undefined
              ? designation
              : existingEmployment?.designation,

          employeeId:
            employeeId !== undefined
              ? employeeId
              : existingEmployment?.employeeId,

          attachment: finalAttachment,
        };

        // PRESERVE EXISTING ID

        if (existingEmployment?._id) {
          updatedEmployment._id = existingEmployment._id;
        }

        updatedEmploymentDetails.push(updatedEmployment);
      }

      // PRESERVE LOCKED EMPLOYMENT NOT SENT BY FRONTEND

      oldEmploymentDetails.forEach((oldEmployment) => {
        if (!oldEmployment?._id) {
          return;
        }

        const oldEmploymentId = oldEmployment._id.toString();

        const alreadyExists = updatedEmploymentDetails.some(
          (item) => item?._id?.toString() === oldEmploymentId,
        );

        const isLocked = lockedEmploymentIds.has(oldEmploymentId);

        if (isLocked && !alreadyExists) {
          updatedEmploymentDetails.push(oldEmployment);
        }
      });

      profile.employmentDetails = updatedEmploymentDetails;
    }

    // ACTIVE STATUS

    if (isActive !== undefined) {
      if (typeof isActive === "boolean") {
        profile.isActive = isActive;
      } else if (isActive === "true") {
        profile.isActive = true;
      } else if (isActive === "false") {
        profile.isActive = false;
      } else {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }
    }

    // UPDATED BY / DATE

    profile.updatedBy = createdBy;
    profile.updatedDate = new Date();

    // SAVE

    const updatedProfile = await profile.save();

    // SUCCESS

    return res.status(200).json({
      success: true,

      message: "Profile Manager updated successfully",

      data: updatedProfile,

      verificationStatus: {
        educationVerification: educationVerificationLogs.length > 0,

        employmentVerification: employmentVerificationLogs.length > 0,
      },

      lockedEducationIds: [...lockedEducationIds],

      lockedEmploymentIds: [...lockedEmploymentIds],
    });
  } catch (error) {
    // ERROR

    console.error("Update Profile Manager Error:", error);

    // DUPLICATE KEY

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists for this user",
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

    // CAST ERROR

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // INTERNAL SERVER ERROR

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateProfileManagerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Profile Manager Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const profile = await ProfileManager.findOneAndUpdate(
      {
        _id: id,
        createdBy,
      },
      {
        isActive: isActive === "true" || isActive === true,
        updatedBy: createdBy,
        updatedDate: Date.now(),
      },
      {
        new: true,
      },
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile Manager not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile Manager status updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update Profile Manager Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
