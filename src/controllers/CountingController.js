import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import BoardUniversity from "../models/BoardUniversitySchema.js";
import ProfileManager from "../models/ProfileManagerSchema.js";

export const getCounting = async (req, res) => {
  try {
    const [
      agencyCount,
      employerCount,
      boardUniversityCount,
      profileManagerCount,
    ] = await Promise.all([
      Agency.countDocuments({ isApproved: true }),
      MasterEmployer.countDocuments({ isApproved: true }),
      BoardUniversity.countDocuments({ isApproved: true }),
      ProfileManager.countDocuments({ isActive: true }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Counting fetched successfully",
      data: {
        agencyCount,
        employerCount,
        boardUniversityCount,
        profileManagerCount,
      },
    });
  } catch (error) {
    console.error("Counting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch counting",
      error: error.message,
    });
  }
};

export const getMasterData = async (req, res) => {
  try {
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required",
      });
    }

    let data = [];

    switch (type) {
      case "RecruitmentAgency":
        data = await Agency.find()
          .populate("subscriptionId")
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email")
          .lean();
        break;

      case "Employers":
        data = await MasterEmployer.find()
          .populate("subscriptionId")
          .populate("createdBy", "name email")
          .populate("updatedBy", "name email")
          .lean();
        break;

      case "Board&Universities":
        data = await BoardUniversity.find().lean();
        break;

      default:
        return res.status(400).json({
          success: false,
          message:
            "Invalid type. Use RecruitmentAgency, Employers or Board&Universities",
        });
    }

    return res.status(200).json({
      success: true,
      type,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("getMasterData error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
