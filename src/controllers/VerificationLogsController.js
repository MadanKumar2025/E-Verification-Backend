import EducationVerificationLog from "../models/EducationVerificationLogSchema.js";
import EmploymentVerificationLog from "../models/EmploymentVerificationLogSchema.js";

export const getVerificationLogsByCreatedBy = async (req, res) => {
  try {
    const { createdBy } = req.params;

    if (!createdBy) {
      return res.status(400).json({
        success: false,
        message: "createdBy is required",
      });
    }

    // Education verification records
    const educationLogs = await EducationVerificationLog.find({
      createdBy: createdBy,
    })
      .populate("profileId")
      .populate("boardId")
      .populate("createdBy", "name email")
      .sort({ createdDate: -1 });

    // Employment verification records
    const employmentLogs = await EmploymentVerificationLog.find({
      createdBy: createdBy,
    })
      .populate("profileId")
      .populate("employerId")
      .populate("createdBy", "name email")
      .sort({ createdDate: -1 });

    return res.status(200).json({
      success: true,
      message: "Verification logs fetched successfully",

      data: {
        education: educationLogs,
        employment: employmentLogs,

        educationCount: educationLogs.length,
        employmentCount: employmentLogs.length,

        totalCount:
          educationLogs.length + employmentLogs.length,
      },
    });
  } catch (error) {
    console.error(
      "Get verification logs by createdBy error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch verification logs",
      error: error.message,
    });
  }
};


export const getAllVerificationLogs = async (req, res) => {
  try {
    const educationLogs = await EducationVerificationLog.find({})
      .populate("profileId")
      .populate("boardId")
      .populate("createdBy", "name email")
      .sort({ createdDate: -1 });

    const employmentLogs = await EmploymentVerificationLog.find({})
      .populate("profileId")
      .populate("employerId")
      .populate("createdBy", "name email")
      .sort({ createdDate: -1 });

    return res.status(200).json({
      success: true,
      message: "All verification logs fetched successfully",

      data: {
        education: educationLogs,
        employment: employmentLogs,

        educationCount: educationLogs.length,
        employmentCount: employmentLogs.length,

        totalCount:
          educationLogs.length + employmentLogs.length,
      },
    });
  } catch (error) {
    console.error("Get all verification logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch verification logs",
      error: error.message,
    });
  }
};
