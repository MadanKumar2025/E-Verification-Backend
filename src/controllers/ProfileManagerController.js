import ProfileManager from "../models/ProfileManagerSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import mongoose from "mongoose";

// export const createProfileManager = async (req, res) => {
//   try {
//     const {
//       candidateName,
//       mobile,
//       email,
//       permanentAddress,
//       city,
//       state,
//       country,
//       panCardNumber,
//       aadharCardNumber,
//       dateOfBirth,
//       educationDetails,
//       employmentDetails,
//     } = req.body;

//     // Candidate Name Validation
//     if (!candidateName || candidateName.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Candidate Name is required",
//       });
//     }

//     // Mobile Validation
//     if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid 10 digit mobile number is required",
//       });
//     }

//     // Email Validation
//     if (!email || email.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Email is required",
//       });
//     }

//     // Address Validation
//     if (!permanentAddress || permanentAddress.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "Permanent Address is required",
//       });
//     }

//     // City Validation
//     if (!city || city.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "City is required",
//       });
//     }

//     // State Validation
//     if (!state || state.trim() === "") {
//       return res.status(400).json({
//         success: false,
//         message: "State is required",
//       });
//     }

//     // DOB Validation
//     if (!dateOfBirth) {
//       return res.status(400).json({
//         success: false,
//         message: "Date of Birth is required",
//       });
//     }

//     // Logged In User
//     const createdBy = req.user?.id || null;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Duplicate Mobile Check (Same User)
//     const existingProfile = await ProfileManager.findOne({
//       createdBy,
//       mobile,
//     });

//     if (existingProfile) {
//       return res.status(400).json({
//         success: false,
//         message: "Profile with this mobile number already exists",
//       });
//     }

//     // Create Profile
//     const profileManager = new ProfileManager({
//       candidateName,
//       mobile,
//       email: email.toLowerCase(),
//       permanentAddress,
//       city,
//       state,
//       country,
//       panCardNumber,
//       aadharCardNumber,
//       dateOfBirth,
//       educationDetails,
//       employmentDetails,

//       createdBy,
//     });

//     const savedProfile = await profileManager.save();

//     return res.status(201).json({
//       success: true,
//       message: "Profile created successfully",
//       data: savedProfile,
//     });
//   } catch (error) {
//     console.error(error);

//     // Duplicate Index Error
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number already exists for this user",
//       });
//     }

//     // Validation Error
//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((err) => err.message);

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

    // Match Employer Name and Add employerId
    let updatedEmploymentDetails = [];
    if (employmentDetails && employmentDetails.length > 0) {
      updatedEmploymentDetails = await Promise.all(
        employmentDetails.map(async (emp) => {
          let employerId = null;

          if (emp.employedName) {
            const employer = await MasterEmployer.findOne({
              name: {
                $regex: `^${emp.employedName.trim()}$`,
                $options: "i",
              },
            });

            if (employer) {
              employerId = employer._id;
            }
          }

          return {
            ...emp,
            employerId,
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
      educationDetails,
      employmentDetails: updatedEmploymentDetails,
      createdBy,
    });

    const savedProfile = await profileManager.save();

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: savedProfile,
    });
  } catch (error) {
    console.error(error);

    // Duplicate Error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists for this user",
      });
    }

    // Validation Error
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

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

// export const getProfileManagers = async (req, res) => {
//   try {
//     // Login user ki ID token se aa rahi hai
//     const createdBy = req.user?._id;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Sirf logged-in user ka data fetch hoga
//     const profileList = await ProfileManager.find({
//       createdBy: createdBy,
//     }).sort({
//       createdDate: -1,
//     });

//     const data = profileList.map((profile) => ({
//       id: profile._id,
//       candidateName: profile.candidateName,
//       mobile: profile.mobile,
//       email: profile.email,
//       permanentAddress: profile.permanentAddress,
//       city: profile.city,
//       state: profile.state,
//       country: profile.country,
//       panCardNumber: profile.panCardNumber,
//       aadharCardNumber: profile.aadharCardNumber,
//       dateOfBirth: profile.dateOfBirth,
//       educationDetails: profile.educationDetails,
//       employmentDetails: profile.employmentDetails,
//       isActive: profile.isActive,
//       createdDate: profile.createdDate,
//       updatedDate: profile.updatedDate,
//     }));

//     return res.status(200).json({
//       success: true,

//       count: data.length,

//       data: data,
//     });
//   } catch (error) {
//     console.error("Get Profile Manager Error:", error);

//     return res.status(500).json({
//       success: false,

//       message: "Error fetching profile managers",
//     });
//   }
// };

export const getProfileManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
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

    const data = {
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
    };

    return res.status(200).json({
      success: true,
      message: "Profile Manager fetched successfully",
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

// export const updateProfileManager = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       candidateName,
//       mobile,
//       email,
//       permanentAddress,
//       city,
//       state,
//       country,
//       panCardNumber,
//       aadharCardNumber,
//       dateOfBirth,
//       educationDetails,
//       employmentDetails,
//       isActive,
//     } = req.body;

//     // Validate ObjectId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Profile Manager Id",
//       });
//     }

//     const createdBy = req.user?.id || null;

//     if (!createdBy) {
//       return res.status(401).json({
//         success: false,
//         message: "User authentication required",
//       });
//     }

//     // Find Profile
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

//     // Candidate Name Update
//     if (candidateName !== undefined) {
//       if (candidateName.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Candidate Name is required",
//         });
//       }

//       profile.candidateName = candidateName.trim();
//     }

//     // Mobile Update
//     if (mobile !== undefined) {
//       if (!/^[0-9]{10}$/.test(mobile)) {
//         return res.status(400).json({
//           success: false,
//           message: "Valid 10 digit mobile number is required",
//         });
//       }

//       profile.mobile = mobile;
//     }

//     // Email Update
//     if (email !== undefined) {
//       if (email.trim() === "") {
//         return res.status(400).json({
//           success: false,
//           message: "Email is required",
//         });
//       }

//       profile.email = email.toLowerCase().trim();
//     }

//     // Address Update
//     if (permanentAddress !== undefined) {
//       profile.permanentAddress = permanentAddress.trim();
//     }

//     // City Update
//     if (city !== undefined) {
//       profile.city = city.trim();
//     }

//     // State Update
//     if (state !== undefined) {
//       profile.state = state.trim();
//     }

//     // Country Update
//     if (country !== undefined) {
//       profile.country = country.trim();
//     }

//     // PAN Update
//     if (panCardNumber !== undefined) {
//       profile.panCardNumber = panCardNumber.toUpperCase().trim();
//     }

//     // Aadhar Update
//     if (aadharCardNumber !== undefined) {
//       profile.aadharCardNumber = aadharCardNumber.trim();
//     }

//     // DOB Update
//     if (dateOfBirth !== undefined) {
//       profile.dateOfBirth = dateOfBirth;
//     }

//     // Education Update
//     if (educationDetails !== undefined) {
//       profile.educationDetails = educationDetails;
//     }

//     // Employment Update
//     if (employmentDetails !== undefined) {
//       profile.employmentDetails = employmentDetails;
//     }

//     // Active Status Update
//     if (isActive !== undefined) {
//       profile.isActive = isActive === true || isActive === "true";
//     }

//     profile.updatedBy = createdBy;
//     profile.updatedDate = Date.now();

//     const updatedProfile = await profile.save();

//     return res.status(200).json({
//       success: true,
//       message: "Profile Manager updated successfully",
//       data: updatedProfile,
//     });
//   } catch (error) {
//     console.error("Update Profile Manager Error:", error);

//     // Duplicate index error
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile number already exists for this user",
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

export const updateProfileManager = async (req, res) => {
  try {
    const { id } = req.params;

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
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Profile Manager Id",
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

    // Find Profile
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

    // Candidate Name Validation
    if (candidateName !== undefined) {
      if (!candidateName || candidateName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Candidate Name is required",
        });
      }

      profile.candidateName = candidateName.trim();
    }

    // Mobile Validation + Duplicate Check
    if (mobile !== undefined) {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Valid 10 digit mobile number is required",
        });
      }

      const existingMobile = await ProfileManager.findOne({
        createdBy,
        mobile,
        _id: { $ne: id },
      });

      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "Profile with this mobile number already exists",
        });
      }

      profile.mobile = mobile;
    }

    // Email Validation
    if (email !== undefined) {
      if (!email || email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      profile.email = email.toLowerCase().trim();
    }

    // Address Validation
    if (permanentAddress !== undefined) {
      if (!permanentAddress || permanentAddress.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Permanent Address is required",
        });
      }

      profile.permanentAddress = permanentAddress.trim();
    }

    // City Validation
    if (city !== undefined) {
      if (!city || city.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "City is required",
        });
      }

      profile.city = city.trim();
    }

    // State Validation
    if (state !== undefined) {
      if (!state || state.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      profile.state = state.trim();
    }

    // Country
    if (country !== undefined) {
      profile.country = country.trim();
    }

    // PAN
    if (panCardNumber !== undefined) {
      profile.panCardNumber = panCardNumber.toUpperCase().trim();
    }

    // Aadhar
    if (aadharCardNumber !== undefined) {
      profile.aadharCardNumber = aadharCardNumber.trim();
    }

    // DOB Validation
    if (dateOfBirth !== undefined) {
      if (!dateOfBirth) {
        return res.status(400).json({
          success: false,
          message: "Date of Birth is required",
        });
      }

      profile.dateOfBirth = dateOfBirth;
    }

    // Education Update
    if (educationDetails !== undefined) {
      profile.educationDetails = educationDetails;
    }

    // Employment Update With Employer Id
    if (employmentDetails !== undefined) {
      let updatedEmploymentDetails = [];

      if (employmentDetails.length > 0) {
        updatedEmploymentDetails = await Promise.all(
          employmentDetails.map(async (emp) => {
            let employerId = null;

            if (emp.employedName) {
              const employer = await MasterEmployer.findOne({
                name: {
                  $regex: `^${emp.employedName.trim()}$`,
                  $options: "i",
                },
              });

              if (employer) {
                employerId = employer._id;
              }
            }

            return {
              ...emp,
              employerId,
            };
          }),
        );
      }

      profile.employmentDetails = updatedEmploymentDetails;
    }

    // Active Status
    if (isActive !== undefined) {
      profile.isActive = isActive === true || isActive === "true";
    }

    profile.updatedBy = createdBy;
    profile.updatedDate = Date.now();

    const updatedProfile = await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile Manager updated successfully",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Update Profile Manager Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Mobile number already exists for this user",
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
