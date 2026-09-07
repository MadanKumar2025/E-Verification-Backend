import mongoose from "mongoose";
import BoardUniversity from "../models/BoardUniversitySchema.js";
import User from "../models/User.js";
import nodemailer from "nodemailer";



// export const createBoardUniversity = async (req, res) => {
//   try {
//     const { boardName, boardApi, boardEmail, year, city, state, country } =
//       req.body;

//     // DEFAULT PASSWORD

//     const password = "123";

//     // BOARD NAME VALIDATION

//     if (!boardName || !boardName.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Board / University Name is required",
//       });
//     }

//     const finalBoardName = boardName.trim();

//     // YEAR VALIDATION

//     if (year !== undefined && year !== null && year !== "") {
//       if (isNaN(year)) {
//         return res.status(400).json({
//           success: false,
//           message: "Year must be a valid number",
//         });
//       }
//     }

//     // EMAIL VALIDATION

//     let finalEmail = "";

//     if (boardEmail && boardEmail.trim()) {
//       const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//       if (!emailRegex.test(boardEmail.trim())) {
//         return res.status(400).json({
//           success: false,
//           message: "Please enter a valid Board / University Email",
//         });
//       }

//       finalEmail = boardEmail.trim().toLowerCase();
//     }

//     // EMAIL REQUIRED FOR USER

//     if (!finalEmail) {
//       return res.status(400).json({
//         success: false,
//         message: "Board / University Email is required to create login user",
//       });
//     }

//     // DUPLICATE BOARD / UNIVERSITY

//     const alreadyExist = await BoardUniversity.findOne({
//       boardName: finalBoardName,
//     });

//     if (alreadyExist) {
//       return res.status(400).json({
//         success: false,
//         message: "Board / University already exists.",
//       });
//     }

//     // DUPLICATE USER EMAIL

//     const userEmailExists = await User.findOne({
//       email: finalEmail,
//     });

//     if (userEmailExists) {
//       return res.status(400).json({
//         success: false,
//         message: "User email already exists.",
//       });
//     }

//     // CREATE BOARD / UNIVERSITY

//     const boardUniversity = await BoardUniversity.create({
//       boardName: finalBoardName,
//       boardApi: boardApi?.trim() || "",
//       boardEmail: finalEmail,

//       city: city?.trim() || "",
//       state: state?.trim() || "",
//       country: country?.trim() || "",

//       year:
//         year !== undefined && year !== null && year !== ""
//           ? Number(year)
//           : undefined,
//     });

//     // CREATE USER

//     const user = await User.create({
//       name: finalBoardName,
//       email: finalEmail,
//       password: password,
//       UserRole: "Board / University",
//       // Board / University ID
//       refid: boardUniversity._id,
//       refModel: "BoardUniversity",
//       createby: req.user?.id || null,
//     });

//     // RESPONSE

//     return res.status(201).json({
//       success: true,
//       message: "Board / University created successfully.",
//       data: {
//         boardUniversity,
//         user,
//       },
//     });
//   } catch (error) {
//     console.log("Create Board / University Error:", error);

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Board / University or User email already exists.",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const errors = Object.values(error.errors).map((e) => e.message);

//       return res.status(400).json({
//         success: false,
//         message: errors.join(", "),
//       });
//     }

//     // SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

export const createBoardUniversity = async (req, res) => {
  try {
    const { boardName, boardApi, boardEmail, year, city, state, country } =
      req.body;

    // BOARD / UNIVERSITY NAME VALIDATION

    if (!boardName || !boardName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Board / University Name is required",
      });
    }

    const finalBoardName = boardName.trim();

    // YEAR VALIDATION

    if (year !== undefined && year !== null && year !== "") {
      if (isNaN(year)) {
        return res.status(400).json({
          success: false,
          message: "Year must be a valid number",
        });
      }
    }

    // EMAIL VALIDATION

    let finalEmail = "";

    if (boardEmail && boardEmail.trim()) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailRegex.test(boardEmail.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Board / University Email",
        });
      }

      finalEmail = boardEmail.trim().toLowerCase();
    }

    // Email required
    if (!finalEmail) {
      return res.status(400).json({
        success: false,
        message: "Board / University Email is required",
      });
    }

    // DUPLICATE BOARD / UNIVERSITY CHECK

    const alreadyExist = await BoardUniversity.findOne({
      boardName: finalBoardName,
    });

    if (alreadyExist) {
      return res.status(400).json({
        success: false,
        message: "Board / University already exists.",
      });
    }

    // DUPLICATE USER EMAIL CHECK

    // User abhi create nahi hoga.
    // Lekin same email kisi existing user ka hai
    // to Board / University create nahi karenge.

    const userEmailExists = await User.findOne({
      email: finalEmail,
    });

    if (userEmailExists) {
      return res.status(400).json({
        success: false,
        message: "User email already exists.",
      });
    }

    // CREATE BOARD / UNIVERSITY

    const boardUniversity = await BoardUniversity.create({
      boardName: finalBoardName,

      boardApi: boardApi?.trim() || "",

      boardEmail: finalEmail,

      city: city?.trim() || "",
      state: state?.trim() || "",
      country: country?.trim() || "",

      year:
        year !== undefined && year !== null && year !== ""
          ? Number(year)
          : undefined,

      // IMPORTANT

      // Board create hote time approval false rahega.
      // Admin approve karega tab true hoga.

      isApproved: false,

      // Board active rahega.
      isActive: true,
    });

    // RESPONSE

    return res.status(201).json({
      success: true,
      message: "Board / University created successfully. Waiting for approval.",

      data: {
        boardUniversity,
      },
    });
  } catch (error) {
    console.log("Create Board / University Error:", error);

    // DUPLICATE KEY ERROR

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Board / University already exists.",
      });
    }

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);

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

export const getBoardUniversities = async (req, res) => {
  try {
    const boardUniversityList = await BoardUniversity.find().sort({
      createdAt: -1,
    });

    const data = boardUniversityList.map((boardUniversity) => ({
      id: boardUniversity._id,

      // BOARD / UNIVERSITY DETAILS

      boardName: boardUniversity.boardName,
      boardApi: boardUniversity.boardApi || null,
      boardEmail: boardUniversity.boardEmail || null,
      year: boardUniversity.year || null,

      city: boardUniversity.city || null,
      state: boardUniversity.state || null,
      country: boardUniversity.country || null,

      // APPROVAL / ACTIVE STATUS

      isApproved: boardUniversity.isApproved,
      isActive: boardUniversity.isActive,

      // DATES

      createdAt: boardUniversity.createdAt,
      updatedAt: boardUniversity.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Board / University Error:", error);

    return res.status(500).json({
      success: false,
      message: "Error fetching Board / University",
    });
  }
};

export const getBoardUniversityById = async (req, res) => {
  try {
    const { id } = req.params;

    // ID VALIDATION

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Board / University Id",
      });
    }

    // FIND BOARD / UNIVERSITY

    const boardUniversity = await BoardUniversity.findById(id);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board / University not found",
      });
    }

    // RESPONSE DATA

    const data = {
      id: boardUniversity._id,

      // Board / University Details
      boardName: boardUniversity.boardName,
      boardApi: boardUniversity.boardApi || null,
      boardEmail: boardUniversity.boardEmail || null,
      year: boardUniversity.year || null,

      city: boardUniversity.city || null,
      state: boardUniversity.state || null,
      country: boardUniversity.country || null,

      // APPROVAL / ACTIVE STATUS

      isApproved: boardUniversity.isApproved,
      isActive: boardUniversity.isActive,

      // DATES

      createdAt: boardUniversity.createdAt,
      updatedAt: boardUniversity.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Board / University fetched successfully",
      data,
    });
  } catch (error) {
    console.log("Get Board / University By Id Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateBoardUniversity = async (req, res) => {
  try {
    const { id } = req.params;

    const { boardName, boardApi, boardEmail, year, city, state, country } =
      req.body;

    // VALIDATE OBJECT ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Board / University Id",
      });
    }

    // FIND BOARD / UNIVERSITY

    const boardUniversity = await BoardUniversity.findById(id);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board / University not found",
      });
    }

    // BOARD NAME

    if (boardName !== undefined) {
      if (!boardName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Board Name is required",
        });
      }

      // Duplicate Board Name Check
      const alreadyExist = await BoardUniversity.findOne({
        boardName: boardName.trim(),
        _id: { $ne: id },
      });

      if (alreadyExist) {
        return res.status(400).json({
          success: false,
          message: "Board / University already exists.",
        });
      }

      boardUniversity.boardName = boardName.trim();
    }

    // BOARD API

    if (boardApi !== undefined) {
      if (boardApi === null) {
        boardUniversity.boardApi = "";
      } else {
        boardUniversity.boardApi = boardApi.trim();
      }
    }

    // BOARD EMAIL

    if (boardEmail !== undefined) {
      // Check if Board is already approved
      if (boardUniversity.isApproved === true) {
        return res.status(400).json({
          success: false,
          message: "Board / University email cannot be changed after approval.",
        });
      }

      // Email required
      if (boardEmail === null || !String(boardEmail).trim()) {
        return res.status(400).json({
          success: false,
          message: "Board / University Email is required",
        });
      }

      const finalEmail = String(boardEmail).trim().toLowerCase();

      // Email validation
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailRegex.test(finalEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid Board / University Email",
        });
      }

      // Check if email belongs to another user
      const userEmailExists = await User.findOne({
        email: finalEmail,
      });

      if (userEmailExists) {
        return res.status(400).json({
          success: false,
          message: "User email already exists.",
        });
      }

      // Update email
      boardUniversity.boardEmail = finalEmail;
    }

    // YEAR

    if (year !== undefined) {
      if (year !== null && year !== "") {
        if (isNaN(year)) {
          return res.status(400).json({
            success: false,
            message: "Year must be a valid number",
          });
        }

        boardUniversity.year = Number(year);
      } else {
        boardUniversity.year = undefined;
      }
    }

    // CITY

    if (city !== undefined) {
      if (city === null) {
        boardUniversity.city = "";
      } else {
        boardUniversity.city = city.trim();
      }
    }

    // STATE

    if (state !== undefined) {
      if (state === null) {
        boardUniversity.state = "";
      } else {
        boardUniversity.state = state.trim();
      }
    }

    // COUNTRY

    if (country !== undefined) {
      if (country === null) {
        boardUniversity.country = "";
      } else {
        boardUniversity.country = country.trim();
      }
    }

    // SAVE UPDATED BOARD / UNIVERSITY

    const updatedBoardUniversity = await boardUniversity.save();

    // RESPONSE

    return res.status(200).json({
      success: true,
      message: "Board / University updated successfully",
      data: updatedBoardUniversity,
    });
  } catch (error) {
    console.error("Update Board / University Error:", error);

    // DUPLICATE KEY ERROR

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Board / University already exists.",
      });
    }

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // SERVER ERROR

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateBoardUniversityActiveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // VALIDATE OBJECT ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Board / University Id",
      });
    }

    // VALIDATE isActive

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    // FIND BOARD / UNIVERSITY

    const boardUniversity = await BoardUniversity.findById(id);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board / University not found",
      });
    }

    // UPDATE BOARD / UNIVERSITY STATUS

    boardUniversity.isActive = isActive;

    await boardUniversity.save();

    // UPDATE RELATED USER STATUS

    // User Board / University ke refid se find hoga.

    const user = await User.findOne({
      refid: boardUniversity._id,
      refModel: "BoardUniversity",
    });

    // Agar User exist karta hai tabhi update karo
    if (user) {
      user.isActive = isActive;

      await user.save();
    }

    // RESPONSE

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Board / University activated successfully."
        : "Board / University deactivated successfully.",

      data: {
        boardUniversity,
        user: user || null,
      },
    });
  } catch (error) {
    console.error("Update Board / University Active Status Error:", error);

    // MONGOOSE VALIDATION ERROR

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // SERVER ERROR

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// export const updateBoardUniversityApproval = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { isApproved } = req.body;

//     // VALIDATE OBJECT ID

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Board / University Id",
//       });
//     }

//     // VALIDATE isApproved

//     if (typeof isApproved !== "boolean") {
//       return res.status(400).json({
//         success: false,
//         message: "isApproved must be true or false",
//       });
//     }

//     // FIND BOARD / UNIVERSITY

//     const boardUniversity = await BoardUniversity.findById(id);

//     if (!boardUniversity) {
//       return res.status(404).json({
//         success: false,
//         message: "Board / University not found",
//       });
//     }

//     // APPROVE BOARD / UNIVERSITY

//     if (isApproved === true) {
//       // Already approved
//       if (boardUniversity.isApproved === true) {
//         return res.status(400).json({
//           success: false,
//           message: "Board / University is already approved.",
//         });
//       }

//       // CHECK USER ALREADY EXISTS

//       const existingUser = await User.findOne({
//         refid: boardUniversity._id,
//         refModel: "BoardUniversity",
//       });

//       // APPROVE BOARD

//       boardUniversity.isApproved = true;
//       // Approved Board should be active
//       boardUniversity.isActive = true;
//       await boardUniversity.save();

//       // CREATE USER

//       let user = existingUser;

//       if (!user) {
//         user = await User.create({
//           name: boardUniversity.boardName,
//           email: boardUniversity.boardEmail,

//           // Temporary password
//           password: "123",
//           UserRole: "Board / University",
//           refid: boardUniversity._id,
//           refModel: "BoardUniversity",
//           createby: req.user?.id || null,
//           // User active after approval
//           isActive: true,
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Board / University approved and user created successfully.",

//         data: {
//           boardUniversity,
//           user,
//         },
//       });
//     }

//     // UNAPPROVE BOARD / UNIVERSITY

//     boardUniversity.isApproved = false;
//     await boardUniversity.save();

//     return res.status(200).json({
//       success: true,
//       message: "Board / University approval removed successfully.",
//       data: {
//         boardUniversity,
//       },
//     });
//   } catch (error) {
//     console.error("Update Board / University Approval Error:", error);

//     // DUPLICATE KEY ERROR

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "User email already exists.",
//       });
//     }

//     // MONGOOSE VALIDATION ERROR

//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);

//       return res.status(400).json({
//         success: false,
//         message: messages.join(", "),
//       });
//     }

//     // SERVER ERROR

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };
export const updateBoardUniversityApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    // VALIDATE OBJECT ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Board / University Id",
      });
    }

    // VALIDATE isApproved
    if (typeof isApproved !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isApproved must be true or false",
      });
    }

    // FIND BOARD / UNIVERSITY
    const boardUniversity = await BoardUniversity.findById(id);

    if (!boardUniversity) {
      return res.status(404).json({
        success: false,
        message: "Board / University not found",
      });
    }

    // =========================
    // APPROVE
    // =========================
    if (isApproved === true) {
      // Already approved
      if (boardUniversity.isApproved === true) {
        return res.status(400).json({
          success: false,
          message: "Board / University is already approved.",
        });
      }

      // CHECK EXISTING USER
      let user = await User.findOne({
        refid: boardUniversity._id,
        refModel: "BoardUniversity",
      });

      let userCreated = false;

      // APPROVE BOARD / UNIVERSITY
      boardUniversity.isApproved = true;
      boardUniversity.isActive = true;

      boardUniversity.updatedBy = req.user?._id || null;
      boardUniversity.updatedDate = new Date();

      await boardUniversity.save();

      // =========================
      // CREATE / ACTIVATE USER
      // =========================

      if (!user) {
        userCreated = true;

        user = await User.create({
          name: boardUniversity.boardName,
          email: boardUniversity.boardEmail,
          password: "123",
          UserRole: "Board / University",
          refid: boardUniversity._id,
          refModel: "BoardUniversity",
          createby: req.user?._id || null,
          isActive: true,
        });
      } else {
        user.isActive = true;

        await user.save();
      }

      // =========================
      // SEND APPROVAL EMAIL
      // =========================

      let emailSent = false;

      try {
        console.log(
          "Board University Email:",
          boardUniversity.boardEmail
        );

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,

          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // OPTIONAL: Check SMTP connection
        await transporter.verify();

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: boardUniversity.boardEmail,

          subject: "Board / University Account Approved",

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
                Hello ${boardUniversity.boardName},
              </h2>

              <p>
                Congratulations!
              </p>

              <p>
                Your Board / University account has been
                <strong style="color: #28a745;">
                  approved successfully.
                </strong>
              </p>

              <p>
                Your account is now active and you can login
                to the system.
              </p>

              <hr />

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
                    ${boardUniversity.boardEmail}
                  </td>
                </tr>

                ${
                  userCreated
                    ? `
                      <tr>
                        <td>
                          <strong>Password</strong>
                        </td>

                        <td>
                          123
                        </td>
                      </tr>
                    `
                    : ""
                }

                <tr>
                  <td>
                    <strong>Role</strong>
                  </td>

                  <td>
                    Board / University
                  </td>
                </tr>

                <tr>
                  <td>
                    <strong>Status</strong>
                  </td>

                  <td>
                    <strong style="color: green;">
                      Active
                    </strong>
                  </td>
                </tr>

              </table>

              ${
                userCreated
                  ? `
                    <p style="color: #dc3545;">
                      Please change your password after
                      your first login.
                    </p>
                  `
                  : `
                    <p>
                      Your existing login account has been
                      activated successfully.
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

        emailSent = true;

        console.log(
          `Approval email sent successfully to ${boardUniversity.boardEmail}`
        );
      } catch (emailError) {
        emailSent = false;

        console.error(
          "Board / University approval email failed:",
          emailError
        );
      }

      // =========================
      // SUCCESS RESPONSE
      // =========================

      return res.status(200).json({
        success: true,

        message: userCreated
          ? "Board / University approved and user created successfully."
          : "Board / University approved and existing user activated successfully.",

        emailSent,

        data: {
          boardUniversity: {
            _id: boardUniversity._id,
            boardName: boardUniversity.boardName,
            boardEmail: boardUniversity.boardEmail,
            isApproved: boardUniversity.isApproved,
            isActive: boardUniversity.isActive,
          },

          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            UserRole: user.UserRole,
            refid: user.refid,
            refModel: user.refModel,
            isActive: user.isActive,
          },
        },
      });
    }

    // =========================
    // UNAPPROVE
    // =========================

    boardUniversity.isApproved = false;

    await boardUniversity.save();

    return res.status(200).json({
      success: true,
      message: "Board / University approval removed successfully.",

      data: {
        boardUniversity: {
          _id: boardUniversity._id,
          boardName: boardUniversity.boardName,
          boardEmail: boardUniversity.boardEmail,
          isApproved: boardUniversity.isApproved,
          isActive: boardUniversity.isActive,
        },
      },
    });
  } catch (error) {
    console.error(
      "Update Board / University Approval Error:",
      error
    );

    // DUPLICATE KEY ERROR
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User email already exists.",
      });
    }

    // VALIDATION ERROR
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

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

    // SERVER ERROR
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

