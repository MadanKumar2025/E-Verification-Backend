import mongoose from "mongoose";

import User from "../models/User.js";
import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import CreditTransaction from "../models/creditTransactionSchema.js";
import Subscription from "../models/SubscriptionPlanSchema.js";
import { getIO } from "../socket.js";

export const createCreditTransaction = async (req, res) => {
  try {
    const { userId } = req.params;

    // VALIDATE USER ID
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    // GET USER
    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.refid || !user.refModel) {
      return res.status(400).json({
        success: false,
        message: "User refid/refModel not found",
      });
    }

    // GET ORGANIZATION
    let organization;

    if (user.refModel === "Agency") {
      organization = await Agency.findById(user.refid);
    } else if (user.refModel === "MasterEmployer") {
      organization = await MasterEmployer.findById(user.refid);
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported refModel: ${user.refModel}`,
      });
    }

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: `${user.refModel} not found`,
      });
    }

    // CREDIT AMOUNT
    const amount = 0;

    const balanceBefore = Number(organization.credits || 0);
    const balanceAfter = balanceBefore + amount;

    // UPDATE ORGANIZATION
    organization.credits = balanceAfter;

    await organization.save({
      validateBeforeSave: false,
    });

    // TRANSACTION DATA
    const transactionData = {
      type: "CREDIT",
      amount,
      balanceBefore,
      balanceAfter,

      createdBy: req.user?._id || null,
      createdDate: new Date(),
    };

    // FIND EXISTING CREDIT TRANSACTION DOCUMENT
    let creditTransaction = await CreditTransaction.findOne({
      userId: user._id,
      refid: user.refid,
      refModel: user.refModel,
    });

    if (creditTransaction) {
      creditTransaction.transactions.push(transactionData);
      await creditTransaction.save();
      console.log("Existing CreditTransaction updated:", creditTransaction._id);
    } else {
      creditTransaction = await CreditTransaction.create({
        userId: user._id,
        refid: user.refid,
        refModel: user.refModel,
        transactions: [transactionData],
      });

      console.log("New CreditTransaction created:", creditTransaction._id);
    }

    // SUCCESS RESPONSE
    return res.status(201).json({
      success: true,
      message: "Credit transaction created successfully",
      data: {
        userId: user._id,
        refid: user.refid,
        refModel: user.refModel,
        amount,
        balanceBefore,
        balanceAfter,
        transaction: transactionData,
        creditTransactionId: creditTransaction._id,
      },
    });
  } catch (error) {
    console.error("createCreditTransaction error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create credit transaction",
      error: error.message,
    });
  }
};

// export const getCreditTransactionByUserId = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Validate User ID
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid User Id",
//       });
//     }

//     // Find Credit Transaction
//     const creditTransaction = await CreditTransaction.findOne({
//       userId: userId,
//     })
//       .populate("userId", "name email UserRole")
//       .populate("refid")
//       .populate("transactions.createdBy", "name email UserRole");

//     // Not found
//     if (!creditTransaction) {
//       return res.status(404).json({
//         success: false,
//         message: "Credit transaction not found",
//       });
//     }

//     // Response data
//     const data = {
//       id: creditTransaction._id,

//       userId: creditTransaction.userId,

//       refid: creditTransaction.refid,
//       refModel: creditTransaction.refModel,

//       transactions: creditTransaction.transactions,

//       createdAt: creditTransaction.createdAt,
//       updatedAt: creditTransaction.updatedAt,
//     };

//     return res.status(200).json({
//       success: true,
//       message: "Credit transactions fetched successfully",
//       data,
//     });
//   } catch (error) {
//     console.error("Error fetching credit transactions:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getCreditTransactionByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid User Id",
      });
    }

    const user = await User.findById(userId)
      .select("name email UserRole refid refModel")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.refid || !user.refModel) {
      return res.status(400).json({
        success: false,
        message: "User refid/refModel not found",
      });
    }

    let organization = null;

    if (user.refModel === "Agency") {
      organization = await Agency.findById(user.refid)
        .select("agencyName credits email mobile")
        .lean();
    } else if (user.refModel === "MasterEmployer") {
      organization = await MasterEmployer.findById(user.refid)
        .select("name credits email mobile")
        .lean();
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported refModel: ${user.refModel}`,
      });
    }

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: `${user.refModel} not found`,
      });
    }

    const creditTransaction = await CreditTransaction.findOne({
      userId: userId,
      refid: user.refid,
      refModel: user.refModel,
    })
      .populate("transactions.createdBy", "name email UserRole")
      .lean();

    const transactions = creditTransaction?.transactions || [];

    const totalCredit = transactions
      .filter((transaction) => transaction.type?.toUpperCase() === "CREDIT")
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );

    const totalDebit = transactions
      .filter((transaction) => transaction.type?.toUpperCase() === "DEBIT")
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );

    // Always take current credits from organization
    const currentBalance = Number(organization.credits || 0);

    const data = {
      id: creditTransaction?._id || null,
      userId: user,
      refid: organization._id,
      refModel: user.refModel,
      organization: organization,
      currentBalance: currentBalance,
      totalCredit: totalCredit,
      totalDebit: totalDebit,
      transactions: transactions,
      createdAt: creditTransaction?.createdAt || null,
      updatedAt: creditTransaction?.updatedAt || null,
    };

    return res.status(200).json({
      success: true,
      message: creditTransaction
        ? "Credit transactions fetched successfully"
        : "No credit transactions found",
      data,
    });
  } catch (error) {
    console.error("Error fetching credit transactions:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getCreditTransactionByRefId = async (req, res) => {
  try {
    const { refid } = req.params;

    if (!refid || !mongoose.Types.ObjectId.isValid(refid)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Reference Id",
      });
    }

    const creditTransaction = await CreditTransaction.findOne({
      refid: refid,
    })
      .populate("userId", "name email UserRole")
      .populate("refid")
      .populate("transactions.createdBy", "name email UserRole");

    if (!creditTransaction) {
      return res.status(404).json({
        success: false,
        message: "Credit transaction not found for this Reference Id",
      });
    }

    const data = {
      id: creditTransaction._id,
      userId: creditTransaction.userId,
      refid: creditTransaction.refid,
      refModel: creditTransaction.refModel,
      transactions: creditTransaction.transactions,
      createdAt: creditTransaction.createdAt,
      updatedAt: creditTransaction.updatedAt,
    };

    return res.status(200).json({
      success: true,

      message: "Credit transactions fetched successfully",

      data,
    });
  } catch (error) {
    console.error("Error fetching credit transactions by refid:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
