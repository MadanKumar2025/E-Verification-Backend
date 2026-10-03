import mongoose from "mongoose";

const transactionItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    action: {
      type: String,
      enum: [
        "SUBSCRIPTION_ASSIGN",
        "SUBSCRIPTION_CHANGE",
        "MANUAL_ADD",
        "MANUAL_DEDUCT",
        "EDUCATION_VERIFICATION",
        "EMPLOYMENT_VERIFICATION",
        "OTHER",
      ],
      default: "OTHER",
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    referenceModel: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  },
);

const creditTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    refid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "refModel",
      index: true,
    },

    refModel: {
      type: String,
      enum: ["Agency", "MasterEmployer"],
      required: true,
      index: true,
    },

    transactions: {
      type: [transactionItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "CreditTransaction",
  creditTransactionSchema,
);
