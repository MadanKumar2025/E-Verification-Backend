import User from "../models/User.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { sendEmail } from "./emailService.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, mobileNo } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

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
    if (mobileNo && !/^[0-9]{10}$/.test(mobileNo)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    // Check Existing Email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Password Hash
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Logged in User Id
    const createby = req.user?.id || null;

    const user = new User({
      name,
      email,
      password,
      mobileNo,
      createby,
    });

    const savedUser = await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: savedUser,
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

export const getUsers = async (req, res) => {
  try {
    const usersList = await User.find()
      .sort({ createdate: -1 })
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .populate("refid");

    const data = usersList.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      mobileNo: user.mobileNo,
      UserRole: user.UserRole,
      refid: user.refid,
      isActive: user.isActive,
      createdate: user.createdate,
      createby: user.createby,
      updatedate: user.updatedate,
      updateby: user.updateby,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    const user = await User.findById(id)
      .populate("refid")
      .populate("createby", "name email")
      .populate("updateby", "name email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const data = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      UserRole: user.UserRole,

      // Reference ID
      refid: user.refid?._id || user.refid || null,

      // Reference model
      refModel: user.refModel,

      // Optional: complete referenced data
      refData: user.refid || null,

      isActive: user.isActive,

      createby: user.createby,
      updateby: user.updateby,

      createdate: user.createdate,
      updatedate: user.updatedate,
    };

    return res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data,
    });
  } catch (error) {
    console.log("getUserById error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, mobileNo, isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    // Find User
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Name Update Validation
    if (name !== undefined) {
      if (name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      user.name = name.trim();
    }

    // Mobile Update Validation
    if (mobileNo !== undefined) {
      if (mobileNo !== "" && !/^[0-9]{10}$/.test(mobileNo)) {
        return res.status(400).json({
          success: false,
          message: "Mobile number must be exactly 10 digits",
        });
      }

      user.mobileNo = mobileNo;
    }

    // Password Update
    if (password !== undefined && password !== "") {
      user.password = password;
    }

    // Active Status Update
    if (isActive !== undefined) {
      user.isActive = isActive === true || isActive === "true";
    }

    // Audit Fields
    user.updateby = req.user?.id || null;
    user.updatedate = new Date();

    const updatedUser = await user.save();

    const response = updatedUser.toObject();

    // Hide Password
    delete response.password;

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: response,
    });
  } catch (error) {
    console.error("Update User Error:", error);

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

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isActive: isActive === "true" || isActive === true,
        updateby: req.user?.id || null,
        updatedate: new Date(),
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update User Status Error =>", error);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const getUsersToken = async (req, res) => {
  try {
    // Login user ki ID token se milegi
    const userId = req.user.id;

    const usersList = await User.find({
      _id: userId,
    })
      .sort({ createdate: -1 })
      .populate("createby", "name email")
      .populate("updateby", "name email")
      .populate("refid", "agencyName email mobile credits");

    const data = usersList.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      mobileNo: user.mobileNo,
      UserRole: user.UserRole,
      refid: user.refid,
      isActive: user.isActive,
      createby: user.createby,
      updateby: user.updateby,
      createdate: user.createdate,
      updatedate: user.updatedate,
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

      message: "Error fetching users",
    });
  }
};

// this is use for change user Password

export const changePassword = async (req, res) => {
  try {
    const { newPassword, confirmNewPassword } = req.body;

    const user = req.user;

    // User Check
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Password Required
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Confirm Password Required
    if (!confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Confirm password is required",
      });
    }

    // Password Match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Password Update

    user.password = newPassword;
    user.updatedate = new Date();

    await user.save();

    // Send Email Notification

    await sendEmail({
      to: user.email,

      subject: "Password Changed Successfully",

      html: `

      <div style="font-family:Arial,sans-serif">

        <h2 style="color:#0dcaf0">
          Password Changed Successfully
        </h2>


        <p>
          Hello <b>${user.name}</b>,
        </p>


        <p>
          Your account password has been changed successfully.
        </p>


        <table border="1" cellpadding="10" cellspacing="0">

          <tr>
            <td>
              <b>Email</b>
            </td>

            <td>
              ${user.email}
            </td>
          </tr>
   <tr>
      <td>
        <b>New Password</b>
      </td>

      <td>
        ${newPassword}
      </td>
    </tr>



          <tr>
            <td>
              <b>Date</b>
            </td>

            <td>
              ${new Date().toLocaleString()}
            </td>
          </tr>

        </table>


        <br/>

        <p>
          If you did not perform this action,
          please contact administrator immediately.
        </p>


      </div>

      `,
    });

    return res.status(200).json({
      success: true,

      message: "Password changed successfully",
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
