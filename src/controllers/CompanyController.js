import Company from "../models/CompanySchema.js";
import crypto from "crypto";
import mongoose from "mongoose";

export const createCompany = async (req, res) => {
  try {
    const { companyName, gstNo, address1, address2, city, state, country } =
      req.body;

    // Required Validation
    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    if (!gstNo) {
      return res.status(400).json({
        success: false,
        message: "GST No is required",
      });
    }

    // Check Existing Company
    const existingCompany = await Company.findOne({
      $or: [{ companyName }, { gstNo }],
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company name or GST No already exists",
      });
    }

    // Generate Unique Key & Secret
    let key;
    let secret;

    do {
      key = crypto.randomBytes(8).toString("hex");
      secret = crypto.randomBytes(32).toString("hex");
    } while (
      await Company.findOne({
        $or: [{ key }, { secret }],
      })
    );

    // End Date = 1 Year From Today
    const EndDate = new Date();
    EndDate.setFullYear(EndDate.getFullYear() + 1);

    const createby = req.user?.id || null;

    const company = new Company({
      companyName,
      gstNo,
      address1,
      address2,
      city,
      state,
      country,
      key,
      secret,
      EndDate,
      createby,
    });

    const savedCompany = await company.save();

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: savedCompany,
    });
  } catch (error) {
    console.log(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getCompanies = async (req, res) => {
  try {
    const companiesList = await Company.find()
      .sort({ createdate: -1 })
      .populate("createby", "name email")
      .populate("updateby", "name email");

    const data = companiesList.map((company) => ({
      id: company._id,

      companyName: company.companyName,
      gstNo: company.gstNo,

      address1: company.address1,
      address2: company.address2,

      city: company.city,
      state: company.state,
      country: company.country,

      key: company.key,
      secret: company.secret,

      EndDate: company.EndDate,

      isActive: company.isActive,

      createby: company.createby,
      updateby: company.updateby,

      createdate: company.createdate,
      updatedate: company.updatedate,
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
      message: "Error fetching companies",
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company Id",
      });
    }

    const company = await Company.findById(id)
      .populate("createby", "name email")
      .populate("updateby", "name email");

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const data = {
      id: company._id,

      companyName: company.companyName,
      gstNo: company.gstNo,

      address1: company.address1,
      address2: company.address2,

      city: company.city,
      state: company.state,
      country: company.country,

      key: company.key,
      secret: company.secret,

      EndDate: company.EndDate,

      isActive: company.isActive,

      createby: company.createby,
      updateby: company.updateby,

      createdate: company.createdate,
      updatedate: company.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "Company fetched successfully",
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

export const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      companyName,
      gstNo,
      address1,
      address2,
      city,
      state,
      country,
      isActive,
      EndDate,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Company Id",
      });
    }

    // Find Company
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Company Name Update Validation
    if (companyName !== undefined) {
      if (companyName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Company name is required",
        });
      }

      const existingCompany = await Company.findOne({
        companyName: companyName.trim(),
        _id: { $ne: id },
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: "Company name already exists",
        });
      }

      company.companyName = companyName.trim();
    }

    // GST Update Validation
    if (gstNo !== undefined) {
      if (gstNo.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "GST No is required",
        });
      }

      const existingGST = await Company.findOne({
        gstNo: gstNo.trim(),
        _id: { $ne: id },
      });

      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: "GST No already exists",
        });
      }

      company.gstNo = gstNo.trim();
    }

    // Address Update
    if (address1 !== undefined) {
      if (address1.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      company.address1 = address1.trim();
    }

    if (address2 !== undefined) {
      company.address2 = address2;
    }

    // City Update
    if (city !== undefined) {
      company.city = city.trim();
    }

    // State Update
    if (state !== undefined) {
      company.state = state.trim();
    }

    // Country Update
    if (country !== undefined) {
      company.country = country.trim();
    }

    // End Date Update
    if (EndDate !== undefined) {
      company.EndDate = new Date(EndDate);
    }

    // Active Status Update
    if (isActive !== undefined) {
      company.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields
    company.updateby = req.user?.id || null;
    company.updatedate = new Date();

    const updatedCompany = await company.save();

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Update Company Error:", error);

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

export const updateCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const company = await Company.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
        updateby: req.user?.id || null,
        updatedate: new Date(),
      },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Company status updated successfully",
      data: company,
    });

  } catch (error) {
    console.error("Update Company Status Error =>", error);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};