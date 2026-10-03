import User from "../models/User.js";
import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import nodemailer from "nodemailer";
import CreditTransaction from "../models/creditTransactionSchema.js";

export const addPaymentAndCredits = async (req, res) => {
  try {
    const { paymentAmount } = req.body;

    const userId = req.user?._id;

    // BASIC VALIDATION

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (
      paymentAmount === undefined ||
      paymentAmount === null ||
      paymentAmount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount is required",
      });
    }

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a valid number greater than 0",
      });
    }

    // PAYMENT MUST BE MULTIPLE OF 10

    if (amount % 10 !== 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter payment amount in multiples of 10, such as 10, 20, 30, 40...",
        paymentAmount: amount,
        allowedExamples: [10, 20, 30, 40],
      });
    }

    // FIND USER

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // CHECK USER STATUS

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is inactive",
      });
    }

    // CHECK USER REFERENCE

    if (!user.refid || !user.refModel) {
      return res.status(400).json({
        success: false,
        message: "User is not linked with any Agency or Master Employer",
      });
    }

    // CALCULATE CREDITS

    const addedCredits = amount / 10;

    let account;
    let accountType;

    // FIND AGENCY

    if (user.refModel === "Agency") {
      account = await Agency.findById(user.refid);
      accountType = "Agency";
    }

    // FIND MASTER EMPLOYER
    else if (user.refModel === "MasterEmployer") {
      account = await MasterEmployer.findById(user.refid);
      accountType = "MasterEmployer";
    }

    // OTHER MODEL
    else {
      return res.status(400).json({
        success: false,
        message: `Credits are not supported for ${user.refModel}`,
      });
    }

    // CHECK ACCOUNT

    if (!account) {
      return res.status(404).json({
        success: false,
        message: `${accountType} not found`,
      });
    }

    // CHECK ACCOUNT ACTIVE

    if (account.isActive === false) {
      return res.status(400).json({
        success: false,
        message: `${accountType} is inactive`,
      });
    }

    // OLD CREDITS

    const oldCredits = Number(account.credits || 0);

    // ADD NEW CREDITS

    const newCredits = oldCredits + addedCredits;

    account.credits = newCredits;

    // UPDATE AUDIT FIELDS

    if (account.updatedBy !== undefined) {
      account.updatedBy = req.user?._id || null;
    }

    if (account.updatedDate !== undefined) {
      account.updatedDate = new Date();
    }

    await account.save();

    // ================= CREDIT TRANSACTION =================

    const transactionData = {
      type: "CREDIT",
      amount: addedCredits,
      balanceBefore: oldCredits,
      balanceAfter: newCredits,

      reason: `Payment received: ₹${amount}`,

      action: "MANUAL_ADD",

      referenceId: null,
      referenceModel: "Payment",

      createdBy: req.user?._id || null,
      createdDate: new Date(),
    };

    // Same userId + refid + refModel ka existing document find karo
    let creditTransaction = await CreditTransaction.findOne({
      userId: user._id,
      refid: user.refid,
      refModel: user.refModel,
    });

    if (creditTransaction) {
      // Pehle se document hai -> usi ke transactions array mein add karo
      creditTransaction.transactions.push(transactionData);

      await creditTransaction.save();
    } else {
      // Pehli baar -> new document create karo
      await CreditTransaction.create({
        userId: user._id,
        refid: user.refid,
        refModel: user.refModel,
        transactions: [transactionData],
      });
    }

    // SEND EMAIL

    let emailStatus = "not_sent";

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
        to: user.email,

        subject: "Payment Received - Credits Added",

        html: `
          <div
            style="
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: auto;
            "
          >

            <h2 style="color: #2e7d32;">
              Payment Successfully Received
            </h2>

            <p>
              Hello <strong>${user.name}</strong>,
            </p>

            <p>
              Your payment has been successfully received and
              credits have been added to your account.
            </p>

            <hr />

            <h3>Payment Details</h3>

            <table
              border="1"
              cellpadding="10"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
                max-width: 600px;
              "
            >

              <tr>
                <td>
                  <strong>User</strong>
                </td>
                <td>
                  ${user.name}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Email</strong>
                </td>
                <td>
                  ${user.email}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Account Type</strong>
                </td>
                <td>
                  ${accountType}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Payment Amount</strong>
                </td>
                <td>
                  ₹${amount}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Credit Rate</strong>
                </td>
                <td>
                  ₹10 = 1 Credit
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Credits Added</strong>
                </td>
                <td>
                  ${addedCredits}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Previous Credits</strong>
                </td>
                <td>
                  ${oldCredits}
                </td>
              </tr>

              <tr>
                <td>
                  <strong>Total Credits</strong>
                </td>
                <td>
                  <strong style="color: green;">
                    ${newCredits}
                  </strong>
                </td>
              </tr>

            </table>

            <br />

            <p>
              Your credits have been added successfully to your account.
            </p>

            <hr />

            <p>
              Thank you.
            </p>

          </div>
        `,
      });

      emailStatus = "sent";
    } catch (emailError) {
      console.error("Payment credit email sending failed:", emailError);

      emailStatus = "failed";
    }

    // SUCCESS RESPONSE

    return res.status(200).json({
      success: true,

      message: "Payment added successfully and credits updated.",

      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          UserRole: user.UserRole,
          refid: user.refid,
          refModel: user.refModel,
        },

        payment: {
          amount: amount,
          rate: "₹10 = 1 Credit",
          creditsAdded: addedCredits,
        },

        credits: {
          previousCredits: oldCredits,
          addedCredits: addedCredits,
          totalCredits: newCredits,
        },

        email: {
          status: emailStatus,
        },
      },
    });
  } catch (error) {
    console.error("addPaymentAndCredits Error:", error);

    // VALIDATION ERROR

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

    // DUPLICATE KEY

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];

      return res.status(400).json({
        success: false,
        message: `${duplicateField} already exists`,
      });
    }

    // SERVER ERROR

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
