import mongoose from "mongoose";
import ProfileManager from "../models/ProfileManagerSchema.js";
import EducationVerificationLog from "../models/EducationVerificationLogSchema.js";
import Agency from "../models/AgenciesSchema.js";
import { deductAgencyCredits } from "./creditService.js";

export const createEducationVerificationLog = async (req, res) => {
  try {
    const { profileId, educationId } = req.body;

    // Profile Id Validation
    if (!profileId || !mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Profile Id is required",
      });
    }

    // Education Id Validation
    if (!educationId || !mongoose.Types.ObjectId.isValid(educationId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Education Id is required",
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

    const agencyId = req.user?.refid;

    if (!agencyId) {
      return res.status(400).json({
        success: false,
        message: "Agency not assigned to user",
      });
    }

    // Profile Find
    const profile = await ProfileManager.findById(profileId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Education Find
    const education = profile.educationDetails.id(educationId);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: "Education record not found",
      });
    }

    // Already Exists Check (Optional)
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

    // Create Log
    const verification = new EducationVerificationLog({
      profileId,
      educationId,
      candidateName: profile.candidateName,
      degree: education.educationName,
      rollNumber: education.rollNumber,
      board: education.board,
      year: education.year,
      status: "Pending",
      createdBy,
    });

    const saveVerification = await verification.save();

    await deductAgencyCredits(agencyId, 5);

    return res.status(201).json({
      success: true,
      message: "Education Verification created successfully.",
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

    if (error.message === "Agency not found") {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
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

export const getEducationVerificationLogs = async (req, res) => {
  try {
    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const verificationList = await EducationVerificationLog.find({
      createdBy,
    }).sort({
      createdDate: -1,
    });

    const data = verificationList.map((verification) => ({
      id: verification._id,
      profileId: verification.profileId,
      educationId: verification.educationId,
      candidateName: verification.candidateName,
      degree: verification.degree,
      rollNumber: verification.rollNumber,
      board: verification.board,
      year: verification.year,
      status: verification.status,
      remarks: verification.remarks,
      result: verification.result,
      createdBy: verification.createdBy,
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
      message: "Error fetching Education Verification Logs",
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

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const verification = await EducationVerificationLog.findOne({
      _id: id,
      createdBy,
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Education Verification not found",
      });
    }

    const data = {
      id: verification._id,
      profileId: verification.profileId,
      educationId: verification.educationId,
      candidateName: verification.candidateName,
      degree: verification.degree,
      rollNumber: verification.rollNumber,
      board: verification.board,
      year: verification.year,
      status: verification.status,
      remarks: verification.remarks,
      result: verification.result,
      createdBy: verification.createdBy,
      verifiedDate: verification.verifiedDate,
      createdDate: verification.createdDate,
    };

    return res.status(200).json({
      success: true,
      message: "Education Verification fetched successfully",
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

// export const updateEducationVerificationStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Education Verification Id",
//       });
//     }

//     const verifiedBy = req.user?.id || null;

//     if (!verifiedBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Status Validation
//     const validStatus = ["Pending", "Verified", "Rejected", "Not Found"];

//     if (!validStatus.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Education Verification Status",
//       });
//     }

//     const educationVerification =
//       await EducationVerificationLog.findOneAndUpdate(
//         {
//           _id: id,
//         },
//         {
//           status,
//           verifiedBy,
//           verifiedDate: Date.now(),
//         },
//         {
//           new: true,
//         },
//       );

//     if (!educationVerification) {
//       return res.status(404).json({
//         success: false,
//         message: "Education Verification not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Education Verification status updated successfully",
//       data: educationVerification,
//     });
//   } catch (error) {
//     console.error("Update Education Verification Status Error =>", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Something went wrong",
//     });
//   }
// };
