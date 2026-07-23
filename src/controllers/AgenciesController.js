import Agency from "../models/AgenciesSchema.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import mongoose from "mongoose";

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
      password,
    } = req.body;

    // Agency Name Validation
    if (!agencyName || agencyName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Agency Name is required",
      });
    }

    // Address Validation
    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Address is required",
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

    // Subscription Validation
    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "Subscription is required",
      });
    }

    // Email Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Password Validation
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // Mobile Validation
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // GST Validation
    if (
      gstNo &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNo)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST Number",
      });
    }

    // Check Agency Email
    const agencyEmail = await Agency.findOne({ email });

    if (agencyEmail) {
      return res.status(400).json({
        success: false,
        message: "Agency email already exists",
      });
    }

    // Check User Email
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email already exists",
      });
    }

    // GST Duplicate
    if (gstNo) {
      const gstExists = await Agency.findOne({ gstNo });

      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    // TAN Duplicate
    if (tan) {
      const tanExists = await Agency.findOne({ tan });

      if (tanExists) {
        return res.status(400).json({
          success: false,
          message: "TAN Number already exists",
        });
      }
    }
    const createdBy = req.user?.id || null;

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await User.create({
      name: agencyName,
      email,
      password: hashedPassword,
      mobileNo: mobile,
      createby: createdBy,
    });

    // Create Agency
    const agency = await Agency.create({
      agencyName,
      gstNo,
      address,
      city,
      state,
      country: country || "India",
      tan,
      email,
      mobile,
      subscriptionId,
      createdBy,
    });

    console.log("gmail", email);

    // Send Email
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

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
      to: email,
      subject: "Agency Account Created Successfully",
      html: `
        <h2>Hello ${agencyName},</h2>

        <p>Your Agency account has been created successfully.</p>

        <table border="1" cellpadding="8" cellspacing="0">
          <tr>
            <td><b>Agency Name</b></td>
            <td>${agencyName}</td>
          </tr>
          <tr>
            <td><b>Email</b></td>
            <td>${email}</td>
          </tr>
          <tr>
            <td><b>Password</b></td>
            <td>${password}</td>
          </tr>
        </table>

        <br>

        <p>Please login using the above credentials and change your password after first login.</p>

        <br>

        <b>Thank You</b>
      `,
    });

    return res.status(201).json({
      success: true,
      message:
        "Agency created successfully and login credentials sent to email.",
      data: {
        agency,
        user,
      },
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

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAgencies = async (req, res) => {
  try {
    const agenciesList = await Agency.find()
      .sort({ createdDate: -1 })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

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
      subscriptionId: agency.subscriptionId,
      isActive: agency.isActive,

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
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Error fetching agencies",
    });
  }
};

export const getAgencyById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    const agency = await Agency.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

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
      subscriptionId: agency.subscriptionId,
      isActive: agency.isActive,

      createdBy: agency.createdBy,
      updatedBy: agency.updatedBy,

      createdDate: agency.createdDate,
      updatedDate: agency.updatedDate,
    };

    return res.status(200).json({
      success: true,
      message: "Agency fetched successfully",
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
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    // Find Agency
    const agency = await Agency.findById(id);

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // Agency Name
    if (agencyName !== undefined) {
      if (agencyName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Agency Name is required",
        });
      }

      agency.agencyName = agencyName.trim();
    }

    // GST No
    if (gstNo !== undefined) {
      agency.gstNo = gstNo;
    }

    // Address
    if (address !== undefined) {
      if (address.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Address is required",
        });
      }

      agency.address = address.trim();
    }

    // City
    if (city !== undefined) {
      if (city.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "City is required",
        });
      }

      agency.city = city.trim();
    }

    // State
    if (state !== undefined) {
      if (state.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      agency.state = state.trim();
    }

    // Country
    if (country !== undefined) {
      agency.country = country.trim();
    }

    // TAN
    if (tan !== undefined) {
      agency.tan = tan;
    }

    // Email
    if (email !== undefined) {
      agency.email = email.trim().toLowerCase();
    }

    // Mobile
    if (mobile !== undefined) {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be exactly 10 digits",
        });
      }

      agency.mobile = mobile;
    }

    // Subscription
    if (subscriptionId !== undefined) {
      agency.subscriptionId = subscriptionId;
    }

    // Active Status
    if (isActive !== undefined) {
      agency.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields
    agency.updatedBy = req.user?.id || null;
    agency.updatedDate = new Date();

    const updatedAgency = await agency.save();

    return res.status(200).json({
      success: true,
      message: "Agency updated successfully",
      data: updatedAgency,
    });
  } catch (error) {
    console.error("Update Agency Error:", error);

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

export const updateAgencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Agency Id",
      });
    }

    const agency = await Agency.findByIdAndUpdate(
      id,
      {
        isActive: isActive === true || isActive === "true",
        updatedBy: req.user?.id || null,
        updatedDate: new Date(),
      },
      { new: true },
    )
      .populate("updatedBy", "name email")
      .populate("createdBy", "name email");

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Agency status updated successfully",
      data: agency,
    });
  } catch (error) {
    console.error("Update Agency Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
