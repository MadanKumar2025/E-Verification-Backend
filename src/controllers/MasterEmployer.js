import MasterEmployer from "../models/MasterEmployerSchema.js";
import Subscription from "../models/SubscriptionPlanSchema.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import CreditTransaction from "../models/creditTransactionSchema.js";

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
      // password,
    } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Employer name is required",
      });
    }

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

    const finalEmail = email.toLowerCase().trim();

    if (!mobile || !/^[0-9]{10}$/.test(String(mobile))) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    const finalGST = gst?.trim() ? gst.toUpperCase().trim() : undefined;

    if (
      finalGST &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(finalGST)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST Number",
      });
    }

    if (!pan || pan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "PAN Number is required",
      });
    }

    const finalPAN = pan.toUpperCase().trim();

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(finalPAN)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN Number",
      });
    }

    // PDF FILE VALIDATION
    const panPdfFile = req.files?.panCardPDF?.[0];
    const gstPdfFile = req.files?.gstCertificatePDF?.[0];
    const companyRegistrationPdfFile = req.files?.companyRegistrationPDF?.[0];

    if (!panPdfFile) {
      return res.status(400).json({
        success: false,
        message: "PAN PDF is required",
      });
    }

    const employerEmailExists = await MasterEmployer.findOne({
      email: finalEmail,
    });

    if (employerEmailExists) {
      return res.status(400).json({
        success: false,
        message: "Employer email already exists",
      });
    }

    // DUPLICATE MOBILE
    const mobileExists = await MasterEmployer.findOne({
      mobile: String(mobile),
    });
    if (mobileExists) {
      return res.status(400).json({
        success: false,
        message: "Employer mobile number already exists",
      });
    }

    // DUPLICATE GST
    if (finalGST) {
      const gstExists = await MasterEmployer.findOne({
        gst: finalGST,
      });
      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    // CREATED BY
    const createdBy = req.user?.id || null;
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // CREATE MASTER EMPLOYER
    const masterEmployer = await MasterEmployer.create({
      name: name.trim(),
      email: finalEmail,
      mobile: String(mobile),
      gst: finalGST,
      pan: finalPAN,
      panPdf: panPdfFile.path,
      gstPdf: gstPdfFile?.path,
      companyRegistrationPdf: companyRegistrationPdfFile?.path,
      isApproved: false,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country ? country.trim() : "India",
      credits: 0,
      createdBy,
    });

    // SEND EMAIL
    // try {
    //   const transporter = nodemailer.createTransport({
    //     host: process.env.SMTP_HOST,
    //     port: Number(process.env.SMTP_PORT),
    //     secure: false,
    //     auth: {
    //       user: process.env.EMAIL_USER,
    //       pass: process.env.EMAIL_PASS,
    //     },
    //   });

    //   await transporter.sendMail({
    //     from: process.env.EMAIL_USER,
    //     to: finalEmail,
    //     subject: "Master Employer Account Created Successfully",

    //     html: `
    //       <h2>Hello ${name}</h2>
    //       <p>Your Master Employer account has been created successfully.</p>
    //       <table border="1" cellpadding="8">
    //         <tr>
    //           <td><b>Email</b></td>
    //           <td>${finalEmail}</td>
    //         </tr>
    //       </table>

    //     `,
    //   });
    // } catch (emailError) {
    //   console.log("Email sending failed:", emailError.message);
    // }

    // RESPONSE
    return res.status(201).json({
      success: true,
      message: "Employer created successfully",

      data: {
        masterEmployer,
      },
    });
  } catch (error) {
    console.error("Create Employer Error =>", error);

    // DUPLICATE KEY ERROR
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email, GST or Mobile already exists",
      });
    }

    // MONGOOSE VALIDATION ERROR
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // SERVER ERROR
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

    const employerList = await MasterEmployer.find({ createdBy }).sort({
      createdDate: -1,
    });

    const data = employerList.map((employer) => ({
      id: employer._id,
      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,
      gst: employer.gst,
      pan: employer.pan,
      panPdf: employer.panPdf,
      gstPdf: employer.gstPdf,
      companyRegistrationPdf: employer.companyRegistrationPdf,
      isApproved: employer.isApproved,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      country: employer.country,
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
    });

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
      panPdf: employer.panPdf,
      gstPdf: employer.gstPdf,
      companyRegistrationPdf: employer.companyRegistrationPdf,

      // APPROVAL
      isApproved: employer.isApproved,
      address: employer.address,
      city: employer.city,
      state: employer.state,
      country: employer.country,

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
      isActive,
    } = req.body;

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

    const employer = await MasterEmployer.findById(id);
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }
    // PDF FILES
    const panPdfFile = req.files?.panCardPDF?.[0];
    const gstPdfFile = req.files?.gstCertificatePDF?.[0];
    const companyRegistrationPdfFile = req.files?.companyRegistrationPDF?.[0];

    // PDF UPDATE
    if (panPdfFile) {
      employer.panPdf = panPdfFile.path;
    }

    if (gstPdfFile) {
      employer.gstPdf = gstPdfFile.path;
    }

    if (companyRegistrationPdfFile) {
      employer.companyRegistrationPdf = companyRegistrationPdfFile.path;
    }

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
      // Approved employer ka email change nahi hoga
      if (employer.isApproved === true) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be changed after employer is approved",
        });
      }

      if (email.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const finalEmail = email.toLowerCase().trim();
      const emailExists = await MasterEmployer.findOne({
        email: finalEmail,
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
      employer.email = finalEmail;
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
      if (!pan || pan.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "PAN Number is required",
        });
      }

      const finalPAN = pan.toUpperCase().trim();

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(finalPAN)) {
        return res.status(400).json({
          success: false,
          message: "Invalid PAN Number",
        });
      }

      employer.pan = finalPAN;
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

    // Validate Employer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    // Validate isActive
    let activeStatus;

    if (typeof isActive === "boolean") {
      activeStatus = isActive;
    } else if (isActive === "true") {
      activeStatus = true;
    } else if (isActive === "false") {
      activeStatus = false;
    } else {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // FIND MASTER EMPLOYER
    const employer = await MasterEmployer.findById(id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // UPDATE MASTER EMPLOYER STATUS
    employer.isActive = activeStatus;
    employer.updatedBy = req.user?.id || null;
    employer.updatedDate = new Date();

    await employer.save();

    // UPDATE RELATED USER STATUS
    const relatedUser = await User.findOne({
      refid: employer._id,
      refModel: "MasterEmployer",
    });

    // User nahi mila to koi problem nahi
    if (relatedUser) {
      relatedUser.isActive = activeStatus;

      await relatedUser.save();
    }

    // SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      message: activeStatus
        ? "Employer activated successfully"
        : "Employer deactivated successfully",

      data: {
        employerId: employer._id,
        isActive: employer.isActive,

        userUpdated: !!relatedUser,

        user: relatedUser
          ? {
              id: relatedUser._id,
              name: relatedUser.name,
              email: relatedUser.email,
              isActive: relatedUser.isActive,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Update Employer Status Error:", error);

    // CAST ERROR
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
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

    // INTERNAL SERVER ERROR
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
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
        message: "Employer Id is required",
      });
    }

    // Find Master Employer
    const masterEmployer = await MasterEmployer.findById(masterEmployerId);

    if (!masterEmployer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
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
      UserRole: "Employer",
      // Master Employer id save hogi
      refid: masterEmployer._id,
      createby: req.user?.id || null,
    });

    // Send Email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: masterEmployer.email,
      subject: "Employer Account Created Successfully",
      html: `

      <h2>Hello ${masterEmployer.name}</h2>


      <p>Your Employer account has been created successfully.</p>


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
      message: "Employer user created successfully",
      data: user,
    });
  } catch (error) {
    console.log("Create Employer User Error =>", error);

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
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    const data = employerList.map((employer) => ({
      id: employer._id,

      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,

      gst: employer.gst || null,
      pan: employer.pan || null,

      // PDF/Documents
      panPdf: employer.panPdf || null,
      gstPdf: employer.gstPdf || null,
      companyRegistrationPdf: employer.companyRegistrationPdf || null,

      // Address
      address: employer.address || null,
      city: employer.city || null,
      state: employer.state,
      country: employer.country || "India",

      credits: employer.credits ?? null,

      // Status
      isApproved: employer.isApproved,
      isActive: employer.isActive,

      // Audit
      createdDate: employer.createdDate,
      createdBy: employer.createdBy || null,
      updatedBy: employer.updatedBy || null,
      updatedDate: employer.updatedDate || null,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Employers Error =>", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching employers",
    });
  }
};

export const getMasterEmployerByIdOne = async (req, res) => {
  try {
    const { id } = req.params;

    // ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    // Get Employer by ID
    const employer = await MasterEmployer.findById(id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // Full Employer Data
    const data = {
      id: employer._id,

      // Basic Details
      name: employer.name,
      email: employer.email,
      mobile: employer.mobile,

      // Tax Details
      gst: employer.gst || null,
      pan: employer.pan || null,

      // Documents
      panPdf: employer.panPdf || null,
      gstPdf: employer.gstPdf || null,
      companyRegistrationPdf: employer.companyRegistrationPdf || null,

      // Address
      address: employer.address || null,
      city: employer.city || null,
      state: employer.state,
      country: employer.country || "India",

      credits: employer.credits ?? null,

      // Status
      isApproved: employer.isApproved,
      isActive: employer.isActive,

      // Audit
      createdBy: employer.createdBy || null,
      updatedBy: employer.updatedBy || null,
      createdDate: employer.createdDate,
      updatedDate: employer.updatedDate || null,
    };

    return res.status(200).json({
      success: true,
      message: "Employer fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Get Employer By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching employer",
    });
  }
};

export const updateMasterEmployerApproval = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDATE ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Employer Id",
      });
    }

    // LOGGED-IN ADMIN
    const updatedBy = req.user?.id || req.user?._id || null;

    if (!updatedBy) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    // FIND MASTER EMPLOYER
    const employer = await MasterEmployer.findById(id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found",
      });
    }

    // ALREADY APPROVED CHECK
    if (employer.isApproved === true) {
      return res.status(400).json({
        success: false,
        message: "Employer is already approved",
      });
    }

    // APPROVE MASTER EMPLOYER
    employer.isApproved = true;
    employer.isActive = true;
    employer.updatedBy = updatedBy;
    employer.updatedDate = new Date();

    const updatedEmployer = await employer.save();

    // FIND RELATED USER
    let employerUser = await User.findOne({
      refid: employer._id,
      refModel: "MasterEmployer",
    });

    let userCreated = false;

    // CREATE / ACTIVATE USER
    if (employerUser) {
      // Existing user ko active karo

      employerUser.isActive = true;
      employerUser.updateby = updatedBy;
      employerUser.updatedate = new Date();

      employerUser = await employerUser.save();
    } else {
      // New user create karo

      userCreated = true;

      const password = "123";

      employerUser = await User.create({
        name: employer.name,
        email: employer.email.toLowerCase(),
        password: password,
        mobileNo: employer.mobile,
        UserRole: "Employer",
        refid: employer._id,
        refModel: "MasterEmployer",
        isActive: true,
        createby: updatedBy,
        createdate: new Date(),
      });
    }

    // ==========================================
    // GET USER ID
    // ==========================================
    const userId = employerUser?._id || null;

    // ==========================================
    // SEND APPROVAL EMAIL
    // ==========================================
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: updatedEmployer.email,
        subject: "Employer Account Approved",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: auto;
            "
          >

            <h2>
              Hello ${updatedEmployer.name},
            </h2>

            <p>
              Your Employer account has been
              <strong style="color: #28a745;">
                approved
              </strong>
              successfully.
            </p>

            ${
              userCreated
                ? `
                  <h3>Login Details</h3>

                  <table
                    border="1"
                    cellpadding="10"
                    cellspacing="0"
                    style="
                      border-collapse: collapse;
                      width: 100%;
                    "
                  >

                    <tr>
                      <td>
                        <strong>Email</strong>
                      </td>

                      <td>
                        ${updatedEmployer.email}
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Password</strong>
                      </td>

                      <td>
                        <strong>123</strong>
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <strong>Role</strong>
                      </td>

                      <td>
                        Employer
                      </td>
                    </tr>

                  </table>

                  <p style="color: #dc3545;">
                    Please change your password after
                    your first login.
                  </p>
                `
                : `
                  <p>
                    Your existing Employer login
                    account has been activated.
                  </p>
                `
            }

            <br />

            <p>
              Regards,<br />
              Admin Team
            </p>

          </div>
        `,
      });

      console.log(
        `Approval email sent successfully to ${updatedEmployer.email}`,
      );
    } catch (emailError) {
      // Email fail hone par approval fail nahi hoga

      console.error("Approval email sending failed:", emailError);
    }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    return res.status(200).json({
      success: true,

      message: userCreated
        ? "Employer approved and User created successfully"
        : "Employer approved and User activated successfully",

      data: {
        // ======================================
        // USER ID
        // ======================================
        userId: userId,

        // ======================================
        // MASTER EMPLOYER
        // ======================================
        masterEmployer: {
          _id: updatedEmployer._id,
          name: updatedEmployer.name,
          email: updatedEmployer.email,
          mobile: updatedEmployer.mobile,
          gst: updatedEmployer.gst,
          pan: updatedEmployer.pan,
          address: updatedEmployer.address,
          city: updatedEmployer.city,
          state: updatedEmployer.state,
          country: updatedEmployer.country,
          credits: updatedEmployer.credits,
          isApproved: updatedEmployer.isApproved,
          isActive: updatedEmployer.isActive,
          createdBy: updatedEmployer.createdBy,
          updatedBy: updatedEmployer.updatedBy,
          createdDate: updatedEmployer.createdDate,
          updatedDate: updatedEmployer.updatedDate,
        },

        // ======================================
        // USER
        // ======================================
        user: employerUser
          ? {
              _id: employerUser._id,
              name: employerUser.name,
              email: employerUser.email,
              mobileNo: employerUser.mobileNo,
              UserRole: employerUser.UserRole,
              refid: employerUser.refid,
              refModel: employerUser.refModel,
              isActive: employerUser.isActive,
              createdate: employerUser.createdate,
              createby: employerUser.createby,
              updateby: employerUser.updateby,
              updatedate: employerUser.updatedate,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Update Employer Approval Error =>", error);

    // ==========================================
    // MONGOOSE VALIDATION ERROR
    // ==========================================
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // ==========================================
    // CAST ERROR
    // ==========================================
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // ==========================================
    // DUPLICATE KEY ERROR
    // ==========================================
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // ==========================================
    // SERVER ERROR
    // ==========================================
    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

export const createMasterEmployerPublic = async (req, res) => {
  try {
    const { name, email, mobile, gst, pan, address, city, state, country } =
      req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Employer name is required",
      });
    }

    if (!email || email.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!mobile || String(mobile).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    if (!address || address.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    if (!city || city.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "City is required",
      });
    }

    if (!state || state.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "State is required",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMobile = String(mobile).trim();
    const normalizedAddress = address.trim();
    const normalizedCity = city.trim();
    const normalizedState = state.trim();
    const normalizedCountry = country?.trim() || "India";

    const normalizedGST = gst?.trim() ? gst.trim().toUpperCase() : undefined;

    if (!pan || pan.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "PAN Number is required",
      });
    }

    const normalizedPAN = pan.trim().toUpperCase();

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!/^[0-9]{10}$/.test(normalizedMobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalizedPAN)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN Number",
      });
    }

    if (
      normalizedGST &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(normalizedGST)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST Number",
      });
    }

    const panPdfFile = req.files?.panCardPDF?.[0];
    const gstPdfFile = req.files?.gstCertificatePDF?.[0];
    const companyRegistrationPdfFile = req.files?.companyRegistrationPDF?.[0];

    if (!panPdfFile) {
      return res.status(400).json({
        success: false,
        message: "PAN PDF is required",
      });
    }

    const employerEmailExists = await MasterEmployer.findOne({
      email: normalizedEmail,
    });

    if (employerEmailExists) {
      return res.status(400).json({
        success: false,
        message: "Employer email already exists",
      });
    }

    // DUPLICATE MOBILE - MASTER EMPLOYER
    const mobileExists = await MasterEmployer.findOne({
      mobile: normalizedMobile,
    });

    if (mobileExists) {
      return res.status(400).json({
        success: false,
        message: "Employer mobile number already exists",
      });
    }

    // DUPLICATE GST
    if (normalizedGST) {
      const gstExists = await MasterEmployer.findOne({
        gst: normalizedGST,
      });

      if (gstExists) {
        return res.status(400).json({
          success: false,
          message: "GST Number already exists",
        });
      }
    }

    // DUPLICATE PAN

    const panExists = await MasterEmployer.findOne({
      pan: normalizedPAN,
    });

    if (panExists) {
      return res.status(400).json({
        success: false,
        message: "PAN Number already exists",
      });
    }

    // CREATE MASTER EMPLOYER

    const masterEmployer = await MasterEmployer.create({
      name: normalizedName,
      email: normalizedEmail,
      mobile: normalizedMobile,
      ...(normalizedGST && {
        gst: normalizedGST,
      }),
      pan: normalizedPAN,
      panPdf: panPdfFile.path,
      gstPdf: gstPdfFile?.path,
      companyRegistrationPdf: companyRegistrationPdfFile?.path,
      address: normalizedAddress,
      city: normalizedCity,
      state: normalizedState,
      country: normalizedCountry,
      credits: 0,
      isApproved: false,
      isActive: false,
      createdBy: null,
      createdDate: new Date(),
    });

    // SEND EMAIL
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "Employer Registration Submitted Successfully",
        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            "
          >
            <h2>
              Hello ${normalizedName},
            </h2>
            <p>
              Your Employer registration has been
              submitted successfully.
            </p>
            <p>
              Your application has been sent to the
              administrator for approval.
            </p>
            <p>
              Your account will be activated once the
              administrator approves your application.
            </p>
            <hr />
            <h3>
              Registration Details
            </h3>
            <table
              border="1"
              cellpadding="8"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
              "
            >
              <tr>
                <td>
                  <strong>Employer Name</strong>
                </td>

                <td>
                  ${normalizedName}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Email</strong>
                </td>

                <td>
                  ${normalizedEmail}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Mobile</strong>
                </td>

                <td>
                  ${normalizedMobile}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Status</strong>
                </td>

                <td>
                  Pending Admin Approval
                </td>
              </tr>

            </table>
            <br />
            <p>
              You will be able to access your account
              after administrator approval.
            </p>

            <p>
              Thank you.
            </p>

          </div>
        `,
      });
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    // SUCCESS RESPONSE
    return res.status(201).json({
      success: true,
      message:
        "Employer registration submitted successfully and sent to admin for approval.",
      data: {
        masterEmployer: {
          _id: masterEmployer._id,
          name: masterEmployer.name,
          email: masterEmployer.email,
          mobile: masterEmployer.mobile,
          gst: masterEmployer.gst,
          pan: masterEmployer.pan,
          panPdf: masterEmployer.panPdf,
          gstPdf: masterEmployer.gstPdf,
          companyRegistrationPdf: masterEmployer.companyRegistrationPdf,
          address: masterEmployer.address,
          city: masterEmployer.city,
          state: masterEmployer.state,
          country: masterEmployer.country,
          credits: masterEmployer.credits,
          isApproved: masterEmployer.isApproved,
          isActive: masterEmployer.isActive,
          createdBy: masterEmployer.createdBy,
          updatedBy: masterEmployer.updatedBy,
          createdDate: masterEmployer.createdDate,
          updatedDate: masterEmployer.updatedDate,
        },
      },
    });
  } catch (error) {
    console.error("createMasterEmployerPublic Error:", error);
    // DUPLICATE KEY ERROR
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // MONGOOSE VALIDATION ERROR
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // CAST ERROR
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}`,
      });
    }

    // SERVER ERROR
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
