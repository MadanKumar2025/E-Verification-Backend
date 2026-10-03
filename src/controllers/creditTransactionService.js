import mongoose from "mongoose";

import User from "../models/User.js";
import Agency from "../models/AgenciesSchema.js";
import MasterEmployer from "../models/MasterEmployerSchema.js";
import CreditTransaction from "../models/creditTransactionSchema.js";

export const getCreditTransactionDataByUserId = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid User Id");
  }

  // USER
  const user = await User.findById(userId)
    .select("name email UserRole refid refModel")
    .lean();

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.refid || !user.refModel) {
    throw new Error("User refid/refModel not found");
  }

  // ORGANIZATION
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
    throw new Error(`Unsupported refModel: ${user.refModel}`);
  }

  if (!organization) {
    throw new Error(`${user.refModel} not found`);
  }

  // TRANSACTION
  const creditTransaction = await CreditTransaction.findOne({
    userId,
    refid: user.refid,
    refModel: user.refModel,
  })
    .populate("transactions.createdBy", "name email UserRole")
    .lean();

  const transactions = creditTransaction?.transactions || [];

  const totalCredit = transactions
    .filter((transaction) => transaction.type?.toUpperCase() === "CREDIT")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalDebit = transactions
    .filter((transaction) => transaction.type?.toUpperCase() === "DEBIT")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  return {
    id: creditTransaction?._id || null,

    userId: user,

    refid: organization._id,

    refModel: user.refModel,

    organization,

    currentBalance: Number(organization.credits || 0),

    totalCredit,

    totalDebit,

    transactions,

    createdAt: creditTransaction?.createdAt || null,

    updatedAt: creditTransaction?.updatedAt || null,
  };
};
