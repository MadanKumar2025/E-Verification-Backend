import MasterEmployer from "../models/MasterEmployerSchema.js";
import Subscription from "../models/SubscriptionPlanSchema.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
 
export const createMasterEmployer = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      gst,
      pan,
      address,
      city,
      state,
      country,
      subscriptionId,
    } = req.body;

    // Name Validation
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Employer name is required",
      });
    }

    // Email Validation
    if (!email || email.trim() === "") {
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

    // Mobile Validation
    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
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

    // Subscription Optional Validation

    let subscription = null;

    if (subscriptionId && subscriptionId.trim() !== "") {
      subscription = await Subscription.findById(subscriptionId);

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Invalid Subscription",
        });
      }

      if (!subscription.isActive) {
        return res.status(400).json({
          success: false,
          message: "Subscription is not active",
        });
      }
    }

    // GST Validation

    if (
      gst &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        gst.toUpperCase(),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST Number",
      });
    }

    // PAN Validation

    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN Number",
      });
    }

    // Duplicate Email Check

    const emailExists = await MasterEmployer.findOne({
      email: email.toLowerCase(),
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Employer email already exists",
      });
    }

    // Duplicate Mobile Check

    const mobileExists = await MasterEmployer.findOne({
      mobile,
    });

    if (mobileExists) {
      return res.status(400).json({
        success: false,
        message: "Employer mobile number already exists",
      });
    }

    // Duplicate GST Check

    if (gst) {
      const gstExists = await MasterEmployer.findOne({
        gst: gst.toUpperCase(),
      });

      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Create Master Employer

    const masterEmployer = await MasterEmployer.create({
      name: name.trim(),

      email: email.toLowerCase().trim(),

      mobile,

      gst: gst ? gst.toUpperCase().trim() : undefined,

      pan: pan ? pan.toUpperCase().trim() : undefined,

      address: address.trim(),

      city: city.trim(),

      state: state.trim(),

      country: country || "India",

      // Optional Subscription

      subscriptionId:
        subscriptionId && subscriptionId.trim() !== ""
          ? subscriptionId
          : undefined,

      // Subscription se credits

      credits: subscription ? subscription.credits : undefined,

      createdBy,
    });

    return res.status(201).json({
      success: true,

      message: "Employer created successfully",

      data: masterEmployer,
    });
  } catch (error) {
    console.error("Create Master Employer Error =>", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,

        message: "Email, GST or Mobile already exists",
      });
    }

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

export const getMasterEmployers = async (req, res) => {
  try {
    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const employerList = await MasterEmployer.find({ createdBy })
      .sort({
        createdDate: -1,
      })
      .populate("subscriptionId", "name price duration");

    const data = employerList.map((employer) => ({
      id: employer._id,
      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,
      gst: employer.gst,
      pan: employer.pan,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      country: employer.country,
      subscriptionId: employer.subscriptionId,
      credits: employer.credits,
      isActive: employer.isActive,
      createdDate: employer.createdDate,
      updatedDate: employer.updatedDate,
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
      message: "Error fetching employers",
    });
  }
};

export const getMasterEmployerById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const employer = await MasterEmployer.findOne({
      _id: id,
      createdBy,
    }).populate("subscriptionId", "name price duration");

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    const data = {
      id: employer._id,

      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,

      gst: employer.gst,
      pan: employer.pan,

      address: employer.address,
      city: employer.city,
      state: employer.state,
      country: employer.country,

      subscriptionId: employer.subscriptionId,
      credits: employer.credits,

      isActive: employer.isActive,

      createdDate: employer.createdDate,
      updatedDate: employer.updatedDate,
    };

    return res.status(200).json({
      success: true,
      message: "Employer fetched successfully",
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

export const updateMasterEmployer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      mobile,
      gst,
      pan,
      address,
      city,
      state,
      country,
      subscriptionId,
      isActive,
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // Find Employer
    const employer = await MasterEmployer.findOne({
      _id: id,
      createdBy,
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Name Update
    if (name !== undefined) {
      if (name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Employer name is required",
        });
      }

      employer.name = name.trim();
    }

    // Email Update
    if (email !== undefined) {
      if (email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const emailExists = await MasterEmployer.findOne({
        email: email.toLowerCase(),
        _id: {
          $ne: id,
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      employer.email = email.toLowerCase().trim();
    }

    // Mobile Update
    if (mobile !== undefined) {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return res.status(400).json({
          success: false,
          message: "Valid 10 digit mobile number is required",
        });
      }

      const mobileExists = await MasterEmployer.findOne({
        mobile,
        _id: {
          $ne: id,
        },
      });

      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: "Mobile number already exists",
        });
      }

      employer.mobile = mobile;
    }

    // GST Update
    if (gst !== undefined) {
      if (
        gst &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          gst.toUpperCase(),
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid GST Number",
        });
      }

      if (gst) {
        const gstExists = await MasterEmployer.findOne({
          gst: gst.toUpperCase(),
          _id: {
            $ne: id,
          },
        });

        if (gstExists) {
          return res.status(400).json({
            success: false,
            message: "GST Number already exists",
          });
        }
      }

      employer.gst = gst ? gst.toUpperCase().trim() : undefined;
    }

    // PAN Update
    if (pan !== undefined) {
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN Number",
        });
      }

      employer.pan = pan ? pan.toUpperCase().trim() : undefined;
    }

    // Address Update
    if (address !== undefined) {
      employer.address = address.trim();
    }

    // City Update
    if (city !== undefined) {
      employer.city = city.trim();
    }

    // State Update
    if (state !== undefined) {
      if (state.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "State is required",
        });
      }

      employer.state = state.trim();
    }

    // Country Update
    if (country !== undefined) {
      employer.country = country.trim();
    }

    // Subscription Update
    if (subscriptionId !== undefined) {
      // Remove Subscription
      if (subscriptionId === "") {
        employer.subscriptionId = undefined;
        employer.credits = undefined;
      } else {
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
          return res.status(400).json({
            success: false,
            message: "Invalid Subscription",
          });
        }

        if (!subscription.isActive) {
          return res.status(400).json({
            success: false,
            message: "Subscription is not active",
          });
        }

        employer.subscriptionId = subscription._id;
        // credits automatic
        employer.credits = subscription.credits;
      }
    }

    // Active Status Update
    if (isActive !== undefined) {
      employer.isActive = isActive === true || isActive === "true";
    }

    employer.updatedBy = createdBy;
    employer.updatedDate = Date.now();
    const updatedEmployer = await employer.save();

    return res.status(200).json({
      success: true,
      message: "Employer updated successfully",
      data: updatedEmployer,
    });
  } catch (error) {
    console.error("Update Master Employer Error =>", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email, GST or Mobile already exists",
      });
    }

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

export const updateMasterEmployerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    const createdBy = req.user?.id || null;

    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const employer = await MasterEmployer.findOneAndUpdate(
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

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Employer status updated successfully",
      data: employer,
    });
  } catch (error) {
    console.error("Update Employer Status Error =>", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const createMasterEmployerUser = async (req, res) => {
  try {
    const { masterEmployerId } = req.body;

    // ID Validation
    if (!masterEmployerId) {
      return res.status(400).json({
        success: false,
        message: "Master Employer Id is required",
      });
    }

    // Find Master Employer
    const masterEmployer = await MasterEmployer.findById(masterEmployerId);

    if (!masterEmployer) {
      return res.status(404).json({
        success: false,
        message: "Master Employer not found",
      });
    }

    // Check Existing User
    const existingUser = await User.findOne({
      email: masterEmployer.email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Generate Password

    const password = Math.random().toString(36).slice(-8);

    // Password Hash

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User

    const user = await User.create({
      name: masterEmployer.name,
      email: masterEmployer.email,
      password: hashedPassword,
      mobileNo: masterEmployer.mobile,
      UserRole: "Master Employer",
      // Master Employer id save hogi
      refid: masterEmployer._id,
      createby: req.user?.id || null,
    });

    // Send Email

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
      to: masterEmployer.email,
      subject: "Master Employer Account Created Successfully",
      html: `

      <h2>Hello ${masterEmployer.name}</h2>


      <p>Your Master Employer account has been created successfully.</p>


      <table border="1" cellpadding="8">

      <tr>
      <td><b>Email</b></td>
      <td>${masterEmployer.email}</td>
      </tr>


      <tr>
      <td><b>Password</b></td>
      <td>${password}</td>
      </tr>


      </table>


      <p>Please change your password after first login.</p>

      `,
    });

    return res.status(201).json({
      success: true,
      message: "Master Employer user created successfully",
      data: user,
    });
  } catch (error) {
    console.log("Create Master Employer User Error =>", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



export const getMasterEmployersAll = async (req, res) => {
  try {
    const employerList = await MasterEmployer.find()
      .sort({ createdDate: -1 })
      .populate("subscriptionId", "name price duration");

    const data = employerList.map((employer) => ({
      id: employer._id,
      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,
      gst: employer.gst,
      pan: employer.pan,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      country: employer.country,
      subscriptionId: employer.subscriptionId,
      credits: employer.credits,
      isActive: employer.isActive,
      createdDate: employer.createdDate,
      createdBy: employer.createdBy,
      updatedBy: employer.updatedBy,
      updatedDate: employer.updatedDate,
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
      message: "Error fetching employers",
    });
  }
};